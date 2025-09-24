# Business Features Audit (2025-09-24)

Source Basis: Generated strictly from code inspection inside `valuations-app/mobile-tablet` (API layer, utils, offline modules) and related implementation files. Existing markdown documentation intentionally ignored per instruction. Observations derive from executable code patterns, naming, data flows, and API usage signatures.

---
## 1. Executive Summary
The mobile/tablet client implements a valuation/survey workflow centered on appointments, surveys, offline caching, and media/sync support. Core capabilities emerge from API wrappers (`api/`), offline persistence utilities (`utils/offlineStorage.ts`), connectivity heuristics (`connectionUtils.ts`), and status‑driven appointment normalization logic (`appointments.js`). The code reveals dual authentication modes (API key vs JWT), adaptive retry + token refresh, layered fallback fetching, and structured local caching keyed by domain entities. Feature set is moderately cohesive but exhibits redundancy in status normalization and fallback logic complexity.

---
## 2. Capability Catalog
Capability | Description (Code-Derived) | Primary Code Artifacts | Implementation Status | Notes
--------- | --------------------------- | ---------------------- | -------------------- | -----
Appointment Listing | Fetch + normalize heterogeneous appointment payloads, dedupe IDs, offline cache | `api/appointments.js#getAppointments` | Active | Multiple field name variants unified
Appointment Detail Retrieval | Multi-endpoint attempt (`/with-order` → fallback plain → list scan) | `getAppointmentById` | Active | Layered fallback increases complexity
Appointment Status Filtering | Client-side filter + normalization of Invite/meeting statuses | `getAppointmentsByStatus`, `getAppointmentsWithOrdersByStatus` | Active | Status inference logic repeated
Paginated Appointment + Order Fetch | Server pagination with local merge & cache | `getAppointmentsWithOrders` | Active | Caches merged pages using map dedupe
List-View Optimized Retrieval | Parameterized server filtering (status, surveyor, date range) | `getAppointmentsByListView` | Active | Offline replay with client filtering
Dashboard Statistics (Primary + Fallback) | Optimized vs legacy stats endpoints | `getMobileDashboardStats`, `getAppointmentStats` | Active | Fallback if optimized fails
Appointment Update | PUT update for status/fields | `updateAppointment` | Active | Minimal validation client-side
Search by Order Number | Resolve appointment via order number | `getAppointmentByOrder` | Active | Normalizes fields post fetch
Survey CRUD | Basic create/update/delete patterns based on presence of ID | `api/surveys.js` | Active | Upsert heuristic (id + lastSyncedAt)
Survey Media Upload | Multipart upload with form data | `surveysApi.uploadFile` | Active | Single file formData assembly
Offline Data Caching | Keyed TTL + structured storage abstraction | `utils/offlineStorage.ts`, `asyncStorageManager` (implied) | Active | Fallback to raw AsyncStorage if managed layer fails
Selective Template/Assessment Caching | Segmented cache keys per entity (templates, sections, categories, items) | `offlineStorage.ts` | Active | Fine-grained invalidation potential
Last Sync Tracking | Timestamp persistence | `updateLastSyncTimestamp`, `getLastSyncTimestamp` | Active | No conflict strategy here
Connectivity Heuristics | Multi-tier network reachability test (HEAD google + backup + DNS) | `connectionUtils.ts` | Active | 3-tier fallback; cached result interval
Auth Mode Abstraction | API key vs JWT dynamic header injection | `api/client.js` | Active | Environment-driven mode detection
Token/User Context Caching | In-memory + AsyncStorage caching with TTL | `client.js` | Active | Reduces storage churn
Automated Retry & Backoff | Network + 5xx retry escalation up to 3 attempts | `client.js` | Active | Linear backoff (1s * attempt)
Adaptive Timeout Per Endpoint | Extended timeout for heavy endpoints | `client.js` | Active | Hard-coded rules
Graceful Empty 404 Handling | Convert certain 404 phrases to success w/ empty set | `client.js` | Active | Message phrase matching brittle
Rate Limiting Handling | 429 with retryAfter messaging | `client.js` | Active | No auto scheduling retry
Auth Refresh Flow (JWT) | Conditional token exchange on 403 error codes | `client.js` | Active | Guarded by min refresh interval
API Key Context Propagation | User context header serialization | `client.js` | Active | Minimal validation
ID Normalization & Dedup | Multi-field resolution & synthetic IDs for duplicates | `appointments.js` | Active | Potential hidden referential inconsistencies

---
## 3. User Roles & Journeys (Inferred)
Role | Evidence | Capabilities Observed
---- | -------- | --------------------
Authenticated User (Generic) | Auth headers, no role branching present | View & manage appointments, surveys
Surveyor (Implied) | `surveyor`, `surveyorID`, `surveyorEmail` fields normalized | Filterable list-view via `surveyor` param
Administrator (Hypothetical) | No branching logic in code | Not explicitly implemented—no conditional endpoints
Offline User | Offline branches returning cached data | Read cached appointments & templates

---
## 4. Data Domain & Entities (Inferred)
Entity | Key Attributes (Normalized) | Source
------ | --------------------------- | ------
Appointment | id, appointmentId, Invite_Status/status, address, client, date, orderNumber, surveyor, surveyorID, region, city, insurer, broker | `appointments.js` transformations
Order (Embedded) | orderID/orderid, policy, sumInsured, broker, orderdate, dateModified | `appointments.js` `ordersList`
Survey | id, lastSyncedAt, payload (opaque) | `surveys.js`
Risk Template / Sections / Categories / Items | Cached by segmented keys | `offlineStorage.ts`
Assessment (Sections/Categories/Items) | assessment_sections_*, assessment_categories_*, assessment_items_* | `offlineStorage.ts`
Media (Implied) | Upload via `/uploads` (file, surveyId) | `surveys.js#uploadFile`
Sync Metadata | last_sync_timestamp | `offlineStorage.ts`
Connectivity State | isConnected (cached) | `connectionUtils.ts`

---
## 5. Feature → Code Traceability Matrix
Feature | Primary Functions | Support Utilities | Caching Strategy | Network Fallback
------- | ----------------- | ----------------- | ---------------- | ----------------
Appointment List (generic) | `getAppointments` | `connectionUtils`, `offlineStorage` | Key: `appointments` | Offline → cache
Appointment Status Views | `getAppointmentsByStatus` | Same as above | Reuses list cache | Falls back to full list
List View (Server Filtered) | `getAppointmentsByListView` | `connectionUtils`, `offlineStorage` | Key: `appointmentsByListView` | Offline filter local snapshot
Appointment Detail | `getAppointmentById` | Offline full list as tertiary source | `appointments` | Multi-endpoint + list scan
Dashboard Stats | `getMobileDashboardStats` | Retry logic in client | None explicit | Fallback to `/appointments/stats`
Pagination (Orders) | `getAppointmentsWithOrders` | Map merge & dedupe | `appointmentsWithOrders` | Offline local paginate
Survey CRUD | `surveysApi` methods | Auth headers in client | None explicit | Standard retry
Offline Templates | `storeTemplate* / getTemplate*` | `asyncStorageManager` | Key families | No network fetch here (implied elsewhere)
Connectivity Check | `connectionUtils.checkConnection` | Internal multi-method | Cached 10s | N/A
Auth Refresh | Response interceptor | AsyncStorage | In-memory TTL | Re-auth redirect if refresh fails

---
## 6. Gaps & Misalignments (Code Perspective)
Observation ID | Gap | Evidence
BF-01 | Role-based authorization absent client-side | No branching by role in any API wrapper
BF-02 | Redundant status normalization logic duplicated | `getAppointmentsByStatus`, `getAppointmentsWithOrdersByStatus`, `getAppointments` status inference
BF-03 | Over-complex fallback chain for detail retrieval | `getAppointmentById` three-tier strategy
BF-04 | Heterogeneous field mapping increases maintenance cost | Multiple field alias lists in normalization blocks
BF-05 | Lack of central schema/type definitions for appointments | Pure JS in `appointments.js` w/ ad-hoc shapes
BF-06 | Potential stale offline differentiation (TTL logic not applied to all keys) | `offlineStorage.ts` TTL used only via asyncStorageManager, not enforced per domain
BF-07 | No conflict resolution logic for updates (optimistic concurrency absent) | Update endpoints naive PUT
BF-08 | Survey API lacks offline queueing for submissions | `submitSurvey` direct call only
BF-09 | Rate limiting (429) surfaced but no automated retry/backoff scheduling | `client.js` response handler returns rejection
BF-10 | ID synthesis may mask upstream data issues | Synthetic IDs `appointment-${index+1}`
BF-11 | Fallback 404→empty heuristic may swallow real errors | Phrase matching in `client.js`
BF-12 | Pagination cache merge risks unbounded growth | `getAppointmentsWithOrders` merges map indefinitely
BF-13 | Surveyor filtering only partially implemented (param optional) | `getAppointmentsByListView` conditional param inclusion
BF-14 | No metrics instrumentation for cache hit/miss | Absent counters around offlineStorage
BF-15 | Upload process lacks retry/resume semantics | `uploadFile` single attempt

---
## 7. Undocumented / Emergent Features (Inferred Only from Code)
- Adaptive timeout escalation for heavy endpoints (appointments & stats).
- Automatic token refresh gating via cooldown window (prevents refresh storm).
- Empty-content semantic translation for specific 404 textual patterns.
- Multi-source network reachability heuristic (primary, backup, DNS) with cached result.
- Structural normalization layer converting inconsistent backend appointment payload variants into uniform client objects.
- Progressive offline enrichment: merging paginated pages into a consolidated cached map.

---
## 8. Dependencies Affecting Product Velocity (Code-Specific)
Dependency Pattern | Impact | Rationale
Axios Interceptors | Medium | Central logic complexity increases change risk
Ad-hoc Mapping | High | Repeated normalization logic slows feature tweaks
AsyncStorage Direct Fallback | Medium | Dual pathways (manager + raw) widen test matrix
Synthetic ID Generation | Medium | Hides upstream contract violations → latent bugs
Sequential Retry (Linear) | Low | Could extend tail latency under transient errors

---
## 9. AS-IS (Code-Derived Facts)
ID | Fact
--- | ----
BF-01 | No conditional branching on user role in API layer
BF-02 | Status normalization logic repeated in ≥3 functions
BF-03 | `getAppointmentById` uses with-order → basic → list scan fallback chain
BF-04 | Appointment field aliases: address/location/property_address/FullAddress etc.
BF-05 | Appointment ID dedupe uses Set + synthetic fallback IDs
BF-06 | 404 phrase detection converts some errors to empty arrays
BF-07 | Retry logic linear: delay = 1000ms * attempt (max 3)
BF-08 | JWT refresh guarded by 60s interval + `isRefreshing` flag
BF-09 | Offline retrieval for appointments keyed `appointments`, `appointmentsWithOrders`, `appointmentsByListView`
BF-10 | Pagination merge uses Map without eviction policy
BF-11 | Survey submit chooses POST vs PUT by `(id && lastSyncedAt)` heuristic
BF-12 | Upload endpoint `/uploads` single attempt, no chunking
BF-13 | Date range filtering client-side only when offline
BF-14 | No integrity hash stored with cached payloads
BF-15 | `connectionUtils` returns cached state if check interval not elapsed
BF-16 | No circuit breaker logic for repeatedly failing endpoints
BF-17 | Fallback stats request executed when optimized stats call fails
BF-18 | Appointment update lacks optimistic version or ETag
BF-19 | Surveyor param optional; no enforced filtering in standard list endpoints
BF-20 | No test instrumentation hooks around offline vs online path selection

---
## 10. RECOMMENDATIONS (Actionable)
Priority tags: [P0]=Critical leverage, [P1]=High benefit, [P2]=Optimization.

ID | Recommendation | Addresses | Priority
--- | ------------- | --------- | --------
REC-01 | Centralize appointment normalization into shared utility (pure function + type contract) | BF-02, BF-04, BF-05 | P0
REC-02 | Introduce TypeScript models & zod (or similar) runtime validation for appointments & surveys | BF-04, BF-05, BF-10 | P0
REC-03 | Replace multi-tier fallback in `getAppointmentById` with feature-flagged phased deprecation & telemetry of fallback usage | BF-03 | P1
REC-04 | Implement role context injection & enforce surveyor filter (fail closed) when mode=surveyor | BF-01, BF-13 | P0
REC-05 | Add cache metadata (version, hash, expiry) + eviction policy for paginated merge caches | BF-06, BF-10, BF-12 | P1
REC-06 | Introduce structured error classification (domain codes) instead of 404 phrase heuristics | BF-06, BF-11 | P1
REC-07 | Add exponential backoff + jitter and optional circuit breaker for repeated 5xx | BF-07, BF-16 | P2
REC-08 | Implement optimistic concurrency (If-Match headers or version field) for PUT updates | BF-07, BF-18 | P1
REC-09 | Create offline submission queue for surveys + retry persistence | BF-08, BF-15 | P0
REC-10 | Add resumable/retryable media upload (tus protocol or chunked strategy) | BF-12, BF-15 | P2
REC-11 | Instrument cache hit/miss + latency metrics for key domains | BF-14 | P1
REC-12 | Enforce required surveyor filtering at API client wrapper (reject unfiltered list calls in production) | BF-01, BF-13 | P0
REC-13 | Introduce a bounded LRU for appointment & orders caches | BF-12 | P2
REC-14 | Add structured connectivity health events + degrade mode flags | BF-15 | P2
REC-15 | Telemetry counters for fallback path invocation (stats, detail retrieval) | BF-03, BF-17 | P1
REC-16 | Add integrity checksum to cached payloads & verify before serving | BF-14 | P2
REC-17 | Consolidate status interpretation into enumerated mapping table w/ tests | BF-02, BF-04 | P0
REC-18 | Add test harness for offline scenario branch coverage | BF-09, BF-20 | P1
REC-19 | Replace linear retry with polynomial or adaptive strategy keyed to status class | BF-07 | P2
REC-20 | Provide unified config object for per-endpoint timeout rules & log deviations | BF-07 | P2

---
## 11. Prioritized Roadmap (P0/P1/P2)
Phase | Items | Outcome
----- | ----- | -------
Phase 1 (P0) | REC-01, REC-02, REC-04, REC-09, REC-12, REC-17 | Strong data contract, enforced filtering, offline robustness
Phase 2 (P1) | REC-03, REC-05, REC-08, REC-11, REC-15, REC-18 | Reduced complexity, cache governance, observability
Phase 3 (P2) | REC-07, REC-10, REC-13, REC-14, REC-16, REC-19, REC-20 | Operational resilience, performance tuning

---
## 12. Observation → Recommendation Mapping
Observation | Linked Recommendations
----------- | ----------------------
BF-01 | REC-04, REC-12
BF-02 | REC-01, REC-17
BF-03 | REC-03, REC-15
BF-04 | REC-01, REC-02, REC-17
BF-05 | REC-01, REC-02
BF-06 | REC-05, REC-06
BF-07 | REC-07, REC-19, REC-20
BF-08 | REC-09
BF-09 | REC-18
BF-10 | REC-02, REC-05
BF-11 | REC-06
BF-12 | REC-05, REC-13
BF-13 | REC-04, REC-12
BF-14 | REC-11, REC-16
BF-15 | REC-14
BF-16 | REC-07
BF-17 | REC-15
BF-18 | REC-08
BF-19 | REC-04, REC-12
BF-20 | REC-18

---
## 13. Quick Win Set (≤ 1 Day Effort Each)
- Extract single normalization utility (appointments).
- Add enum + map for status conversion.
- Inject mandatory surveyor filter guard (prod flag).
- Basic cache size cap (truncate > N entries).
- Add instrumentation stubs (console counters) for fallback usage.

---
## 14. Risks if Unaddressed
Risk | Impact
---- | ------
Unbounded cache growth | Memory pressure, stale data served offline
Missing role enforcement | Data exposure / compliance breach
Heuristic 404 masking | Silent data quality issues
Status duplication | Divergent behavior across views
Lack of offline submission queue | Data loss under intermittent connectivity

---
## 15. Success Criteria (Measurable)
Metric | Baseline (Implied) | Target
------ | ------------------ | ------
Distinct status normalization sites | ≥3 | 1
Fallback invocation rate (detail) | Unknown | <2% of calls
Offline survey submission failures | Not tracked | <0.5% after queue
Cache memory footprint (appointments) | Unbounded | Capped at 500 entries
Filtered vs unfiltered list-view calls (prod) | Unenforced | 100% filtered

---
## 16. Appendix: Proposed Appointment Normalization Sketch (Illustrative)
```ts
export interface AppointmentDTO { /* raw variant union */ }
export interface AppointmentModel {
  id: string;
  status: AppointmentStatus;
  address: string;
  client: string;
  orderNumber: string;
  date: string; // ISO
  surveyorId?: string;
  region?: string;
  meta?: Record<string, unknown>;
}

export function normalizeAppointment(raw: any): AppointmentModel { /* map + guard */ }
```

---
Generated: 2025-09-24
