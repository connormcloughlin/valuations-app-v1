# ENDPOINTS & INTEGRATIONS AUDIT (CODE-DERIVED)

Scope: Enumerates and evaluates every remote HTTP endpoint reference and integration pattern found in the mobile client code (`valuations-app/mobile-tablet/api/*`, supporting utils) WITHOUT using existing written documentation. Evidence strictly from inspected source files: `client.js`, `enhancedClient.js`, `appointments.js`, `surveys.js`, `auth.js`, `riskTemplates.js`, `offline.js`, `apiRequestManager.ts`, supporting context (AuthContext, offlineStorage, connectionUtils, db layer) previously reviewed.

---
## 1. Endpoint Inventory (By Functional Domain)
Format: ID | Method(s) | Canonical Path (as used) | Variants / Fallbacks | Source Functions | Notes

### 1.1 Authentication & Session
- API-001 | POST | /auth/login | — | login() (auth.js) | Exchanges credentials (likely Azure AD token pre-step not here). Returns token stored under `authToken`.
- API-002 | POST | /auth/token-exchange | — | exchangeToken() (auth.js), enhancedClient.refresh logic | Exchanges Azure token -> API JWT when JWT mode.
- API-003 | GET  | /auth/verify | — | verifyAuth(), verifyToken() (auth.js) | Used to validate current token/API key.

### 1.2 Appointments & Dashboard
- API-010 | GET | /appointments | query params vary (status, paging) | — | getAppointments(), getAppointmentsByStatus() (appointments.js) | Base list retrieval.
- API-011 | GET | /appointments/{id} | — | getAppointmentById() | Single appointment.
- API-012 | GET | /appointments/order/{orderNumber} | — | getAppointmentByOrder() | Lookup by order.
- API-013 | GET | /appointments/with-orders | ? (Variant path) | getAppointmentsWithOrders() | Joins orders; path inferred.
- API-014 | GET | /appointments/with-orders/{status} | — | getAppointmentsWithOrdersByStatus() | Filtered join.
- API-015 | GET | /appointments/list-view | — | getAppointmentsByListView() | Large aggregated listing (extended timeout in enhanced client: 45s).
- API-016 | PUT | /appointments/{id} | — | updateAppointment() | Update appointment record.
- API-017 | GET | /appointments/stats | — | getAppointmentStats() | Summary metrics (extended timeout path check in enhanced client).
- API-018 | GET | /mobile/appointment/dashboard/status-counts | — | getMobileDashboardStats() | Mobile dashboard counts (distinct base path prefix `mobile`).

### 1.3 Surveys
- API-030 | GET | /surveys | — | getSurveys() (surveys.js) | Survey metadata.
- API-031 | GET | /surveys/{id} | — | getSurveyDetails() | Detailed survey schema/items.
- API-032 | POST | /surveys/{id} (or /surveys) | Conditional (create vs update) | submitSurvey() | Logic decides POST vs maybe PUT (code shows create path; update may reuse POST w/ ID).
- API-033 | DELETE | /surveys/{id} | — | deleteSurvey() | Remove survey.
- API-034 | POST | /uploads (multipart) | — | uploadFile() | Media/file upload (single endpoint for attachments).

### 1.4 Risk Templates & Assessments (Multiple Fallback Resolution Attempts)
Risk Template Structure retrieval uses multi-endpoint probing to handle inconsistent backend implementations.
- API-050 | GET | /risk-templates | — | getRiskTemplates() | Master template list.
- API-051 | GET | /risk-assessment-sections/assessment/{templateId} | (Primary) | getRiskTemplateSections() | Tries only this variant presently (array prepared for potential expansion earlier comments show design for multiple but currently 1).
- API-052 | GET | /risk-template-categories/section/{sectionId} | Fallbacks: /risk-templates/{templateId}/sections/{sectionId}/categories, /risk-template-sections/{sectionId}/categories, /risk-template/{templateId}/section/{sectionId}/categories | getRiskTemplateCategories() | Iterates endpoints until success.
- API-053 | GET | /risk-template-items/category/{categoryId} | Fallbacks: /risk-template-categories/{categoryId}/items, /categories/{categoryId}/items, /risk-items/category/{categoryId} | getRiskTemplateItems() | Iterative probing; caches result.
- API-054 | GET | /risk-assessment-sections/assessment/{riskAssessmentId} | — | getRiskAssessmentSections() | Assessment-specific sections.
- API-055 | GET | /risk-assessment-categories/section/{riskAssessmentSectionId} | — | getRiskAssessmentCategories() | Single-path (no multi variant in code; named 'CONNOR endpoint').
- API-056 | GET | /risk-assessment-items/category/{riskAssessmentCategoryId} | Handles 404->empty array semantic | getRiskAssessmentItems() | Interprets domain-specific "no items" 404s.

### 1.5 Offline / Utility (Local Only)
- (Local) offlineApi.* functions interact with AsyncStorage only; no network endpoints.

### 1.6 Internal Enhanced Client / Support
Enhanced client wraps arbitrary supplied paths; dynamic timeouts applied for substring matches: `/appointments/list-view`, `/appointments/stats`.

---
## 2. Endpoint Usage Classification
Categories: Core (frequently orchestrated flows), Supporting (secondary data), Fallback/Exploratory (multi-endpoint probes), Low-touch (edge operations), Write/Mutation.

| ID Range | Core | Supporting | Fallback/Exploratory | Low-touch | Mutation |
|----------|------|-----------|----------------------|-----------|----------|
| 001–003  | 001–003 core for session validity | — | — | — | 002 (token exchange) |
| 010–018  | 010,011,015,017,018 | 012,013,014 | — | 016 (update single) | 016 |
| 030–034  | 030,031,032 | 034 | — | 033 | 032,033 |
| 050–056  | 050,052,053,054,056 | 051,055 | 052,053 (multi-probe) | — | (none write) |

(Determination based on presence of multi-path logic, timeout adjustments, caching, and offline fallbacks.)

---
## 3. Observed Patterns & Behaviors
1. API Key vs JWT Mode Divergence: Header assembly conditional in both `client.js` and `enhancedClient.js`; risk of divergence between clients over time.
2. Multi-Endpoint Probing (Risk Templates): Hard-coded ordered fallbacks to mitigate backend structural inconsistencies; increases latency and masks API contract issues.
3. Timeout Differentiation: Manual special-case for appointments heavy endpoints—suggests need for a per-endpoint config registry.
4. 404 Semantic Reinterpretation: Both base client and risk assessment items treat certain 404 messages as empty list; message string dependence brittle.
5. Caching Layers: (a) apiRequestManager TTL cache keyed by method+url+params+body; (b) offlineStorage domain caches (risk templates/items etc) with manual store & retrieval.
6. Duplication of Client Abstractions: `client.js` (axios with interceptors & retries) AND `enhancedClient.js` (request manager + circuit breaker). Co-existence increases drift risk.
7. Token Refresh Logic Embedded in Client: Enhanced client performing token exchange; mixes transport resilience with auth lifecycle responsibilities.
8. Circuit Breaker Domain Granularity: Breaker groups by string before first slash of URL path (domain extraction method naive) – may incorrectly aggregate unrelated endpoints or fail to isolate problematic ones.
9. Lack of Schema Validation: No runtime validation of response shape before caching or normalization.
10. Missing Typed Contracts: TypeScript present for `apiRequestManager`, but API modules are JS; no shared interface definitions.
11. Inconsistent Error Surface: Standard response shape sometimes enforced (success, data, status) but raw errors thrown inside request manager; wrappers adapt partially.
12. Upload Endpoint Simplification: Single `/uploads` POST; no chunking/retry specialization.
13. Endpoint Discovery Approach: Some endpoints (appointments with orders) inferred; if backend evolves path conventions, no central registry to update.
14. Absence of Versioning: No evidence of `/v1/` style version segmentation; future breaking changes risk.
15. Mixed Concerns in API Modules: Offline fallback, caching, endpoint selection & transformation all inside each function rather than layered.

---
## 4. Risk & Impact Assessment
Format: (R#) Description | Affected IDs | Impact | Likelihood | Priority
- R1 Inconsistent auth header logic (dual clients) | 001–003, 010–018, 030–056 | Silent divergence, auth failures | Medium | High
- R2 Multi-probe fallback hides contract drift | 052–053 | Latency, masking backend bugs | High | High
- R3 Brittle 404 string parsing | 056 + base client generic | Incorrect empty states | Medium | Medium
- R4 Naive circuit breaker grouping | All via enhanced client | Over/under isolation of failures | Medium | Medium
- R5 Missing schema validation before cache | All cached (risk, appointments, surveys) | Propagated corrupt data offline | High | High
- R6 Duplicate client stacks | All | Maintenance overhead, inconsistent retries | High | High
- R7 Timeout heuristics hard-coded | 015,017 | Hard to tune globally | Medium | Medium
- R8 No endpoint versioning | All | Upgrade friction later | Low (near-term) | Medium (strategic)
- R9 Response shape inconsistency | Consumers across app | Conditional branching complexity | Medium | Medium
- R10 Lack of typed contracts (JS modules) | All | Refactor friction & hidden breakages | High | Medium

---
## 5. Coverage & Gaps
| Concern | Present | Gap |
|---------|--------|-----|
| Auth mode switching | Yes | Central abstraction missing |
| Retry policy | Linear in `client.js`; exponential in request manager? (backoff implemented) | Unified configurable strategy absent |
| Circuit breaker | Yes (`enhanced`) | Not integrated with legacy client |
| Offline caching | Manual per domain | Generic plugin layer absent |
| Batch operations | Provided in enhanced client | Not adopted by domain modules |
| Schema validation | No | Introduce zod/io-ts before caching |
| Observability (metrics) | Basic console logs | Structured telemetry events missing |
| Endpoint registry | Implicit via scattered strings | Central config map lacking |

---
## 6. Consolidated Recommendations (API-REC)
ID | Recommendation | Addresses | Effort | Impact
- API-REC-01 Create a single API transport layer combining: auth injection, retry, circuit breaker, cache, timeout policy tables. Deprecate legacy `client.js`. | R1,R4,R6,R7 | Med | High
- API-REC-02 Introduce centralized endpoint registry (object map) with metadata: path template, version, timeout, cache TTL, offline policy, fallback array (for migration only) then remove probing after backend fixed. | R2,R7,R13 | Med | High
- API-REC-03 Implement schema validation (zod) pre-cache; reject & log anomalies; add narrow type definitions consumed by domain functions. | R5,R10 | Med | High
- API-REC-04 Replace message-string 404 heuristics with backend contract: use explicit empty 200/204 or standardized error code; interim: pattern list config not inline string includes. | R3 | Low | Medium
- API-REC-05 Refactor fallback multi-endpoint logic to a generic resolver utility logging which variant succeeded; measure success ratios to drive backend consolidation. | R2 | Low | Medium
- API-REC-06 Adjust circuit breaker keying to group by host + first two path segments; optionally allow override per endpoint via registry. | R4 | Low | Medium
- API-REC-07 Introduce consistent response envelope (e.g., { ok:boolean, data, error?, meta? }) returned from transport; eliminate ad-hoc success flags in modules. | R9 | Med | Medium
- API-REC-08 Add layered timeout & retry policy: fast-first attempt (short), escalate on subsequent tries; configure per endpoint criticality. | R7 | Med | Medium
- API-REC-09 Add version prefix (`/v1`) now and alias un-versioned -> v1 temporarily; update registry; prepares ecosystem for future breaks. | R8 | Low | Strategic
- API-REC-10 Generate TypeScript types from swagger (if available) OR define manual interfaces; migrate JS API modules to TS incrementally. | R10 | Med | Medium
- API-REC-11 Introduce unified auth strategy service: resolves mode, manages token exchange, exposes header builder; clients call service, not environment switches. | R1,R6 | Med | High
- API-REC-12 Instrument structured telemetry (request duration, cache hit rate, fallback usage count) feeding into debug console or remote logging. | R2,R5,R6 | Low | Medium

---
## 7. Migration Phasing
Phase 0 (Stabilize – 1 sprint):
- Implement endpoint registry (read-only) + logging of fallback successes.
- Wrap legacy & enhanced clients behind a façade exporting uniform interface.
- Instrument telemetry & circuit breaker key improvement.

Phase 1 (Consolidate – 1–2 sprints):
- Merge clients; adopt unified retry/backoff & response envelope.
- Add schema validation for high-volume endpoints (appointments, risk items, surveys).
- Extract auth header logic into dedicated service.

Phase 2 (Hygiene – 1 sprint):
- Remove multi-endpoint probing once backend normalizes (data-driven decision via metrics).
- Enforce version prefix; update all references via registry.
- Convert API modules to TypeScript with generated types.

Phase 3 (Optimization – ongoing):
- Adaptive timeouts & circuit breaker thresholds per endpoint using historical metrics.
- Offline-first plugin system configurable via registry metadata.
- Pre-fetch & batch orchestrations using enhanced client's batch pipeline.

---
## 8. Validation Hooks (Proposed Additions)
Add pre-flight hook chain: [buildHeaders] -> [applyEndpointPolicy(timeout,retry,cache)] -> [executeTransport] -> [validateSchema] -> [normalizeEnvelope] -> [cache/store] -> [telemetryEmit]. Each hook testable in isolation.

---
## 9. Key Metrics To Track Post-Refactor
- Fallback resolution rate per endpoint variant (target → 0 over time).
- Cache hit ratio (TTL vs offline caches) per domain.
- P95 latency for high-volume endpoints (appointments list-view, stats).
- Schema validation failure count (should approach zero after stabilization).
- Token exchange success rate & frequency.
- Circuit breaker open events per domain.

---
## 10. Fast Wins (Next 48h)
1. Introduce thin endpoint registry JSON and refactor risk template probing to iterate over registry-defined array (no inline arrays).
2. Adjust circuit breaker grouping logic (two path segments) – trivial code change.
3. Standardize empty result handling: central util `interpretNotFoundAsEmpty(codeList, pathPatterns)`.
4. Add TypeScript declaration file for Appointment, Survey, RiskTemplate minimal shapes consumed by UI to start contract locking.
5. Instrument a console table summary after every batch fetch: {endpoint, ms, cacheHit, fallbackUsed}.

---
## 11. Open Questions (Needing Backend / Domain Input)
- Are multi-endpoint fallbacks transitional or permanent backward compatibility? (Impacts whether registry should retain them.)
- Official semantics for 404 vs 204 for empty domain collections?
- Planned versioning timeline for API? If imminent, bootstrap version registry early.
- Is there a swagger/openapi source we can type-generate from? (Not referenced in code modules directly yet.)
- Throughput & SLA expectations for heavy endpoints (list-view, stats) to tune retry & timeout policy quantitatively.

---
## 12. Summary Snapshot
Total distinct canonical endpoints: 23 (excluding fallback variants & offline-only). High-risk cluster: risk template multi-path & dual client divergence. Primary modernization vector: unify transport + explicit contract registry + schema validation -> enable performance instrumentation & progressive tightening of backend contracts.

---
Prepared strictly from live code references. No external documentation sources consulted.
