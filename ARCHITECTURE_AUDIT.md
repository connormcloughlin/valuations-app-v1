# Architecture Audit (2025-09-24)

Source Basis: Derived exclusively from executable code (API wrappers, context providers, utilities, data layer, navigation structure) inside `valuations-app/mobile-tablet`. Existing narrative documentation intentionally excluded.

---
## 1. Overview Diagram (ASCII)
```
+------------------------------- Mobile Tablet Client (Expo RN) --------------------------------+
|                                                                                               |
|  Presentation Layer (app/, components/)                                                       |
|    - Screens (auth, login, tabs, survey, appointments, sync)                                  |
|    - Themed UI wrappers, layout, dashboard, sync widgets                                      |
|                                                                                               |
|  State / Context Layer (context/)                                                             |
|    - AuthContext (session, token/user storage, Azure AD, API-key mode)                        |
|    - DashboardContext (inferred)                                                              |
|    - SyncContext (inferred)                                                                   |
|                                                                                               |
|  Domain / Service Layer (api/, services/, utils/* domain pieces)                              |
|    - apiClient (axios instance, auth headers, retries, fallbacks)                             |
|    - appointmentsApi / surveysApi                                                             |
|    - offlineStorage (segmented caching)                                                       |
|    - db (SQLite persistence + sync flags + batch insert)                                      |
|    - connectionUtils (multi-stage connectivity heuristic)                                     |
|                                                                                               |
|  Cross-Cutting Utilities                                                                      |
|    - asyncStorageManager (TTL, memory mgmt)                                                   |
|    - logger / debug utilities                                                                 |
|    - performance test harness (db batch)                                                      |
|                                                                                               |
+--------------------------- External Dependencies / Backend Contracts -------------------------+
|  REST Endpoints (appointments, appointments/list-view, /with-order, stats, dashboard counts,  |
|                 surveys CRUD, uploads)                                                        |
|  Azure AD (interactive + silent auth)                                                         |
|  Network (reachability heuristics)                                                            |
+-----------------------------------------------------------------------------------------------+
```

---
## 2. Component Inventory
Category | Components / Modules | Role (Inferred)
-------- | -------------------- | --------------
Presentation | `app/*.tsx`, `components/*` | Navigation & UI composition
State Management | `AuthContext.tsx`, `DashboardContext.tsx`, `SyncContext.js` | Session, derived data, sync orchestration
API Transport | `api/client.js` | Axios configuration, auth, retry, fallback, response shaping
Domain APIs | `api/appointments.js`, `api/surveys.js`, `api/riskTemplates.js`, `api/offline.js` | Business operations wrappers
Offline Persistence | `utils/offlineStorage.ts`, `utils/asyncStorageManager.ts` | Cached JSON/structured TTL storage
Relational Persistence | `utils/db.ts` (SQLite) | Structured local domain storage + sync staging
Connectivity | `utils/connectionUtils.ts` | Multi-layer network detection (primary, backup, dns)
Performance / Diagnostics | `utils/performanceTest.ts`, logging in `client.js`, batch insert metrics | Observability (partial, ad-hoc)
Auth Integration | `services/azureAdService` (referenced), `api/auth` (referenced) | Azure AD + token exchange (mode abstraction)
Media Handling | Survey upload path via `surveysApi.uploadFile` + `media_files` table | Asset capture & sync preparation

---
## 3. Layer & Boundary Evaluation
Layer | Boundary Health | Findings
----- | --------------- | --------
Presentation ↔ API | Moderate | Screens indirectly call domain APIs; some normalization logic leaks upward via raw field reliance
API ↔ Transport | Fair | Centralized axios client, but response shaping returns `{success,data}` wrappers mixing network + domain semantics
Domain ↔ Offline Cache | Weak | Inconsistent TTL usage; no standard interface contract (heterogeneous key naming)
Domain ↔ SQLite | Strong for persistence primitives | CRUD + batch patterns well-structured; sync flags integrated
Auth ↔ Transport | Mixed | Dual-mode (API key vs JWT) logic embedded in interceptor increases coupling; could isolate strategy
Error Handling Cross-Cut | Fragmented | Phrase-based 404 remapping, linear retries; no domain error taxonomy
Sync Concerns | Partially Centralized | Sync flags & pending markers exist, but no unified sync coordinator visible in inspected files
Configuration | Implicit | Hard-coded timeout & endpoint-specific conditional logic inside interceptors

---
## 4. Request / Sync Flow Walkthroughs
### 4.1 Appointment Detail Retrieval Flow (Observed)
1. UI triggers `getAppointmentById(id)`
2. Online check via `connectionUtils.isConnected()`
3. Primary call: `/appointments/{id}/with-order`
4. On failure: fallback to `/appointments/{id}`
5. On failure: invokes `getAppointments()` then scans normalized list
6. Normalization synthesizes `id`, merges multi-field aliases
7. Cache not explicitly updated for detail path (list caching covers)

Issues: Triple-path fallback complexity, potential silent data divergence, duplication of normalization logic.

### 4.2 List View (Server-Filtered) Flow
1. UI passes status + optional surveyor + date range to `getAppointmentsByListView`
2. Network? If offline → filter cached `appointmentsByListView`
3. Online call to `/appointments/list-view` with query params
4. Normalize records, merge into map-like cache (growth unbounded)
5. Pagination metadata synthesized from response

Issues: Cache merge lacks eviction; no version/etag; concurrency not guarded.

### 4.3 Offline Sync (Local Items) – Risk Assessment Items (Partial)
1. Data inserted with `pending_sync` flag (SQLite) via `insertRiskAssessmentItem` or batch insert
2. Retrieval of unsynced via `getPendingSyncRiskAssessmentItems()` (filters temporary IDs)
3. Mark synced via `markRiskAssessmentItemsAsSynced()` (sets flag, timestamp)
4. Deletions soft-marked (`isDeleted=1`, `pending_sync=1`), later cleaned up by `cleanupDeletedItems`

Missing: Central orchestrator or scheduler; conflict resolution; incremental version negotiation.

### 4.4 Authentication Lifecycle (API Key Mode)
1. Login (mock / Azure) stores `authToken='api-key-mode'` & user context in AsyncStorage
2. Interceptor attaches API key header + serialized user context
3. 403 branch re-fetches or clears context depending on error code
4. No token refresh cycle (static mode); user context caching TTL managed separately

### 4.5 JWT Mode (Conditional)
1. Token cached in memory with TTL
2. On 403 + code detection → token exchange attempt (rate-limited by interval & lock)
3. Linear retry on transient network errors (3x)
4. Validation logic optionally calls `/auth/verify` else trusts local expiry decode

---
## 5. Cross-Cutting Concerns
Concern | Current Treatment | Gaps
------- | ----------------- | ----
Authentication | Embedded dual-mode strategy inside `client.js` interceptor | Strategy not pluggable; test complexity
Authorization | Absent client-side; no role gating | Potential overfetch of data sets
Error Handling | Mixed: phrase-based 404 reclassification, network retry, inline console logs | No structured error taxonomy / codes
Caching | AsyncStorage + SQLite + ad-hoc maps | Missing unified cache policy, size & TTL governance
Resilience | Linear retry, fallback endpoints, connection heuristic | Lacks circuit breaker & backoff jitter
Observability | Console logging, batch performance metrics | No structured telemetry events or tracing IDs
Configuration | Hard-coded endpoint-specific timeouts & codes | Needs central config registry or policy layer
Data Validation | Implicit trust in server payload shape | No schema validation (runtime or compile-time)
Concurrency | DB transaction queue for batch inserts | No concurrency control for network fetch merges
Security (Client) | Basic token storage & context headers | No encryption at rest for sensitive local data beyond SQLite defaults

---
## 6. Configuration & Environment Strategy
Element | Mechanism | Notes
------- | --------- | -----
API Base URL | `Constants.expoConfig?.extra?.apiBaseUrl` fallback to `process.env` | Multi-source resolution at runtime
Timeout Overrides | Conditional branches on URL substrings | Hard-coded logic fragments
Auth Mode Detection | `isApiKeyMode()` / `isJwtMode()` (constants) | Mode toggles extensive branching
User Context TTL | In-memory + AsyncStorage caching window (10m) | Not externally configurable
Token Cache TTL | 5m constant | No dynamic adaptation

---
## 7. Data Persistence & Consistency
Store | Purpose | Consistency Mechanisms | Risks
----- | ------- | --------------------- | -----
AsyncStorage | Lightweight caches & auth artifacts | Manual TTL per manager | Silent stale usage possible
SQLite (expo-sqlite) | Structured domain entities + sync staging | Indexes, batch insert, migration logic | No journaling config tuning, limited conflict strategy
In-Memory Caches | Token, user context | TTL timestamps | No invalidation bus
Normalization Layer | JS transformations for appointments | Ad-hoc per function | Drift between variants likely
Sync Flags | `pending_sync`, `isDeleted` columns | Boolean marker approach | No version vector / server reconciliation logic

---
## 8. Performance & Scalability Considerations
Aspect | Current Pattern | Limitation
------ | --------------- | ----------
Network Latency | Linear retries + extended timeouts for heavy endpoints | Risks long tail under degradations
Batch Operations | Transactional batch insert for assessments | Limited to items; not generalized
Pagination Merge | Map-based dedupe append | Unbounded growth; memory usage
Normalization Cost | Repeated per call | CPU overhead + inconsistent mapping risk
Connection Checks | Multi-tier HEAD sequences | Extra latency if frequent; caching mitigates
DB Query Performance | Index creation for key columns | No query planner diagnostics recorded
Media Handling | Single insert + pending sync flag | No streaming/chunking for large payloads

---
## 9. Technical Debt & Risks
ID | Risk | Evidence
ARCH-01 | Role enforcement absent → potential data overexposure | No conditional filters applied in API wrappers
ARCH-02 | Normalization duplication → drift & bugs | Repeated mapping in appointments API functions
ARCH-03 | Fallback chains raise complexity & latency | `getAppointmentById` multi-stage
ARCH-04 | Cache policy fragmentation | Divergent keys & TTL application
ARCH-05 | Error heuristics brittle | Phrase-based 404 handling in interceptor
ARCH-06 | Missing structured telemetry | Console-only instrumentation
ARCH-07 | Linear retry lacks adaptive backoff | `client.js` retry strategy
ARCH-08 | Unbounded cached merges | `getAppointmentsWithOrders` accumulation
ARCH-09 | No conflict resolution semantics for sync | Only `pending_sync` flags
ARCH-10 | Auth strategy coupling | API key vs JWT logic embedded centrally
ARCH-11 | Lack of schema validation | Plain JS object trust at boundaries
ARCH-12 | Media upload fragility | Single attempt; no resumable protocol
ARCH-13 | Missing circuit breaker | Continuous retries under systemic outage
ARCH-14 | ID synthesis masks backend contract flaws | Synthetic IDs allocation
ARCH-15 | Migration resilience limited | Basic PRAGMA checks only

---
## 10. AS-IS (Concise Facts)
ID | Fact
--- | ----
ASIS-01 | Axios interceptors manage auth, retries, logging, empty 404 translation
ASIS-02 | Appointment detail retrieval performs up to 3 network attempts + list scan fallback
ASIS-03 | Offline path branches before network call using connectionUtils cached status
ASIS-04 | SQLite schema includes sync flags & indexes for performance
ASIS-05 | Batch insertion implemented only for risk assessment items
ASIS-06 | No shared normalization utility for appointments
ASIS-07 | Pagination cache merges without eviction or size cap
ASIS-08 | Dual authentication modes coexist within one interceptor
ASIS-09 | Retrying only on network/5xx up to 3 attempts, constant 1s * attempt delay
ASIS-10 | Survey uploads use single POST multipart form without retry wrapper
ASIS-11 | Token refresh guarded by isRefreshing + min interval 60s
ASIS-12 | 404 messages containing selected phrases converted to empty success payload
ASIS-13 | Sync uses boolean flags, no version or merge semantics
ASIS-14 | Environment resolution cascades: Expo extra → env vars → default
ASIS-15 | No telemetry events or metrics counters exported

---
## 11. RECOMMENDATIONS (Ranked)
Priority: [P0] Critical Structural, [P1] High Impact, [P2] Optimization
ID | Recommendation | Addresses | Priority
REC-ARCH-01 | Introduce pluggable AuthStrategy interface (APIKeyStrategy, JWTStrategy) extracted from interceptor | ARCH-10 | P0
REC-ARCH-02 | Centralize appointment normalization in pure module + typed schema validation (e.g., zod) | ARCH-02, ARCH-11, ARCH-14 | P0
REC-ARCH-03 | Implement server contract guard (schema + logging of unknown fields) before mapping | ARCH-11, ARCH-14 | P0
REC-ARCH-04 | Replace fallback chain with telemetry-gated fallback & phased removal plan | ARCH-03 | P1
REC-ARCH-05 | Unified CacheService (policy: size cap, TTL, namespacing, metrics) | ARCH-04, ARCH-08 | P1
REC-ARCH-06 | Structured error classification (enum codes) replacing phrase-based heuristics | ARCH-05 | P1
REC-ARCH-07 | Add exponential backoff + jitter and optional circuit breaker (failure budget) | ARCH-07, ARCH-13 | P1
REC-ARCH-08 | Introduce SyncCoordinator abstraction: diff staging, conflict policy, version fields | ARCH-09 | P0
REC-ARCH-09 | Add resumable / chunked upload or retry wrapper with checksum for media | ARCH-12 | P2
REC-ARCH-10 | Instrument metrics (cache hit %, retry counts, fallback invocations, sync queue length) | ARCH-06, ARCH-08 | P1
REC-ARCH-11 | Implement domain-level role gating (inject surveyor filter, assert presence) | ARCH-01 | P0
REC-ARCH-12 | Add eviction policy + memory watermark logging for large caches | ARCH-08 | P2
REC-ARCH-13 | Formal migration framework (version table + applied migrations) | ARCH-15 | P2
REC-ARCH-14 | Abstract network connectivity strategy behind interface for testability | ARCH-03, ARCH-07 | P2
REC-ARCH-15 | Introduce DataAccessFacade to decouple UI from raw API wrappers | ARCH-02, ARCH-04 | P1
REC-ARCH-16 | Add request correlation IDs + structured logger adapter | ARCH-06 | P2
REC-ARCH-17 | Create validation + transformation pipeline (Fetch → Validate → Normalize → Cache → Expose) | ARCH-02, ARCH-11 | P0
REC-ARCH-18 | Add offline mutation queue (surveys, appointment updates) with replay sequencing | ARCH-09 | P0
REC-ARCH-19 | Parameterize endpoint timeout & retry policy via config registry | ARCH-07 | P2
REC-ARCH-20 | Add feature flags around deprecated fallback logic for gradual removal | ARCH-03 | P2

---
## 12. Migration Phases
Phase | Goals | Included Recs | Exit Criteria
----- | ----- | ------------- | -------------
Phase 1 (Foundational) | Data contract, role enforcement, sync architecture | REC-ARCH-01,02,08,11,17,18 | Type-safe models, sync queue active, enforced surveyor filtering
Phase 2 (Resilience & Governance) | Error taxonomy, cache policy, observability, backoff | REC-ARCH-05,06,07,10,15 | Metrics dashboard, structured errors, adaptive retry live
Phase 3 (Optimization & Decommission) | Fallback reduction, upload robustness, migrations, flags | REC-ARCH-04,09,12,13,16,19,20 | Fallback calls <1%, resumable uploads active, versioned migrations

---
## 13. Observation → Recommendation Mapping
Observation | Recommendations
----------- | --------------
ARCH-01 | REC-ARCH-11
ARCH-02 | REC-ARCH-02,17,15
ARCH-03 | REC-ARCH-04,20,14
ARCH-04 | REC-ARCH-05,15
ARCH-05 | REC-ARCH-06
ARCH-06 | REC-ARCH-10,16
ARCH-07 | REC-ARCH-07,19
ARCH-08 | REC-ARCH-05,12,10
ARCH-09 | REC-ARCH-08,18
ARCH-10 | REC-ARCH-01
ARCH-11 | REC-ARCH-02,17
ARCH-12 | REC-ARCH-09
ARCH-13 | REC-ARCH-07
ARCH-14 | REC-ARCH-02,03,17
ARCH-15 | REC-ARCH-13

---
## 14. Target State Snapshot (Conceptual)
```
UI Screens → DataAccessFacade → Domain Services (AppointmentsService, SurveyService)
   → Transport (Axios Client w/ AuthStrategy, PolicyRegistry, Interceptors)
   → Validation Pipeline (Schema Validate → Normalize → CacheService store)
   → SyncCoordinator (Queue, ConflictResolver, RetryPolicy) → SQLite + AsyncStorage
Observability Layer (Metrics, Structured Logs, Correlation IDs)
Feature Flags wrap legacy fallbacks & migration toggles
```

---
## 15. Success Metrics
Metric | Baseline (Inferred) | Target
------ | ------------------- | ------
Fallback Invocation Rate (Detail) | Unknown | <2% after Phase 2
Duplicate Normalization Sites | ≥3 | 1 unified module
Sync Conflict Handling Coverage | 0 | 100% mutations queue-based
Structured Error Coverage | 0% | 90%+ domain ops emit code
Cache Memory Growth (Appointments) | Unbounded | Capped + metrics
Retry Average Latency Reduction | N/A | 20% tail improvement
Role Filter Enforcement Rate | Optional | 100% of prod list/data calls

---
## 16. Quick Wins (<1 Day Each)
- Extract `normalizeAppointment()` and remove duplicated mapping blocks.
- Introduce simple strategy pattern for auth with factory selection.
- Add metrics counters (simple module) for retries & fallbacks.
- Implement size cap for `appointmentsWithOrders` cache map.
- Wrap fallback chain in feature flag env var.

---
## 17. Risks if Deferred
Risk | Impact
---- | ------
Continued duplication | Increased defect surface, inconsistent UI states
No sync queue | Data loss under offline mutations
Linear retries only | Extended user-perceived latency under partial outages
Fallback chain persists | Hidden latency + complexity
Role filter absent | Data exposure / compliance concerns

---
## 18. Appendix: Example Auth Strategy Refactor Sketch
```ts
interface AuthStrategy { enrich(config: AxiosRequestConfig): Promise<void>; handleError(err): Promise<boolean>; }
class ApiKeyStrategy implements AuthStrategy { /* user context header logic */ }
class JwtStrategy implements AuthStrategy { /* refresh w/ lock logic */ }
// Interceptor: await activeStrategy.enrich(config)
```

---
Generated: 2025-09-24
