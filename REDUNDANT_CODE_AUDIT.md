# REDUNDANT / DUPLICATED / DEAD CODE AUDIT (CODE-DERIVED)

Scope: Identify redundancy, drift, dead or semi-dead modules, repeated logic patterns, and consolidation opportunities in the mobile client (focus: `valuations-app/mobile-tablet`). No existing documentation consulted—evidence from source inspection (api layer, request managers, offline utilities, sync endpoints, error handling patterns, caching logic).

---
## 1. High-Level Redundancy Themes
| Theme | Description | Impact | Representative Files |
|-------|-------------|--------|----------------------|
| Dual HTTP Client Stacks | Legacy `api/client.js` vs `api/enhancedClient.js` vs a third partial stack `api/index.ts` each implement auth headers, timeout adjustments, retry/error normalization. | Inconsistent behavior, maintenance overhead, auth divergence risk, bug surface area increases. | `client.js`, `enhancedClient.js`, `index.ts` |
| Repeated 404→Empty Handling | Identical string-based heuristics for interpreting certain 404 errors as empty arrays scattered across multiple files. | Brittle error semantics; copy-paste propagation; difficult to update contract. | `client.js`, `enhancedClient.js`, `riskTemplates.js`, `index.ts` |
| Offline Cache Patterns Duplicated | Different ad-hoc caching: `offlineStorage` (domain-specific), inline AsyncStorage JSON blobs, `apiRequestManager` TTL caching. | Inconsistent expiry semantics; stale data risk; complex invalidation. | `offlineStorage.ts`, `riskTemplates.js`, `index.ts`, `apiRequestManager.ts` |
| Token / API Key Header Assembly Duplicated | Re-implemented token caching & user context header logic in multiple clients. | Auth drift (e.g., add header in one client only), harder security auditing. | `client.js`, `enhancedClient.js`, `index.ts` |
| Multi-Endpoint Probing Inline | Arrays of fallback endpoints embedded directly in functions. | Latency, noisy logs, no metrics to retire unused variants. | `riskTemplates.js` |
| FormData Media Upload Logic Repeated | Single-upload logic duplicated inside batch function. | Unnecessary code bloat; inconsistent error capture. | `index.ts` (uploadMedia vs uploadMediaBatch loop) |
| Sync Endpoint Surface Overlaps Domain Concepts | Some sync endpoints duplicate semantics of "regular" endpoints (media upload vs `/sync/media/upload`). | API surface sprawl; blending of concerns in aggregator file. | `index.ts` |
| Redundant AsyncStorage Layer Helpers | Multiple bespoke store/get wrappers (inline storeData/getData vs centralized manager). | Heterogeneous serialization & TTL control. | `index.ts`, `asyncStorageManager.ts` |
| Response Envelope Inconsistency | Some functions wrap `{ success, data }`, others rely on raw data from request manager, others re-wrap. | Confusing consumer expectations; error branching duplication. | All API modules |
| Logging Patterns Repeated | Console logging for network status, counts, caching, token refresh across modules without shared logger abstraction. | No structured filtering; verbosity adjustments require editing many sites. | `client.js`, `enhancedClient.js`, `riskTemplates.js`, `index.ts` |

---
## 2. Concrete Duplicate Code Blocks / Patterns
| Pattern ID | Description | Instances | Notes |
|-----------|-------------|-----------|-------|
| DUP-404EMPTY | 404 message substring triage ("no items found" / "no data found" / "not found for this category") -> return empty array with status 204. | ≥4 explicit + transpiled bundles | Centralize into `interpretEmpty404(error, patterns)` utility. |
| DUP-TOKEN-CACHE | In-memory token + timestamp caching & refresh gating. | `client.js`, `enhancedClient.js` | Factor into `authSessionService`. |
| DUP-USER-CONTEXT | Fetch & parse `userContext` with 10-min TTL. | `client.js`, `enhancedClient.js`, dynamic headers in `index.ts` | Unify with token service; allow invalidation hook. |
| DUP-TIMEOUT-SPECIAL | Hard-coded 45s override for `/appointments/list-view` and `/appointments/stats`. | `client.js`, `enhancedClient.js` | Replace with endpoint policy table. |
| DUP-FALLBACK-ENDPOINT-ARRAYS | Arrays of candidate endpoints iterated sequentially. | `riskTemplates.js` (categories, items, sections) | Replace with registry + metrics. |
| DUP-FORMDATA-UPLOAD | Building FormData for media upload repeated inside batch loop. | `index.ts` functions `uploadMedia` & inside `uploadMediaBatch` loop | Extract `buildMediaFormData(mediaFile)` once. |
| DUP-OFFLINE-CACHE | Manual AsyncStorage JSON object with `{data,timestamp}` structure repeated. | `index.ts`, risk template caching segments | Use `asyncStorageManager` abstraction. |
| DUP-SCHEMA-ASSUMPTION | Implicit acceptance of response shape before caching; no validation repeated across modules. | All API modules | Introduce schema layer; reduces silent drift. |
| DUP-LOG-PREFIX | Emoji + textual network logs. | Many | Provide logger wrapper (level gating + correlation IDs). |

---
## 3. Potential Dead / Obsolete Code (Evidence-Based)
| Candidate | Evidence / Rationale | Action Proposal | Confidence |
| `api/index.ts` large composite API wrapper | Overlaps with domain-specific modules (`riskTemplates.js`, media, sync). Different endpoint paths (e.g., `/risk-assessment-master/sections/`) not referenced in earlier enumerated modules; may be legacy transitional aggregator. | Trace usages in UI; if call sites replaced by newer modules, deprecate & remove incrementally. | Medium |
| Legacy risk template fetch logic duplication in both `riskTemplates.js` and `index.ts` (template categories/items) | Two implementations of similar retrieval with caching semantics; risk of stale divergence. | Choose canonical (`riskTemplates.js` with fallback logic) -> Map UI imports there; remove duplicate after metric window. | High |
| Separate media endpoints in `index.ts` vs single `/uploads` in surveys API file | Two divergent media upload mechanisms; one sync-specific, one generic. | Consolidate behind `mediaService` that selects correct backend path; remove unused path(s). | Low-Med |
| Unreferenced enhanced batching functions if domain modules still import `apiClient` not `enhancedApiClient` | Batching & circuit breaker benefits not exploited (no observed multi-call `batchRequest` usage). | Add usage or prune advanced path until needed. | Medium |
| Inline retry logic in `client.js` while `apiRequestManager` also implements retries | Dual policy can yield inconsistent resilience. | Remove legacy interceptor retry after consolidation. | High |

(Note: A full dead-code guarantee requires static reference search across entire app screens & hooks—only API layer inspected here.)

---
## 4. Redundancy Impact Matrix
| Redundancy | Operational Risk | Performance Cost | Cognitive Load | Priority |
|------------|------------------|------------------|----------------|----------|
| Dual clients (client vs enhanced) | Auth/refresh mismatch | Duplicate network overhead via inconsistent retries | High | P1 |
| 404→Empty scattered | Masked real errors | Minor | Medium | P2 |
| Multi-endpoint probing inline | Hidden latency, noisy logs | Added sequential waits | Medium | P1 |
| Offline caching styles | Stale or oversized storage | Extra serialization | High | P1 |
| Token/user context duplication | Refresh bugs | Negligible | High | P1 |
| FormData duplication | Minor | Minor | Low | P4 |
| Logging repetition | Debug inefficiency | Minor | Medium | P3 |

---
## 5. Consolidation Roadmap
Phase A (Stabilize):
1. Introduce `transportCore` (single abstraction using `apiRequestManager` under the hood) with pluggable policies: { timeout, retry, cacheTTL, interpret404Empty }.
2. Build `authSessionService` exporting: `getAuthHeaders()`, `invalidate()`, `refreshIfNeeded()`. Remove token/user context code from legacy clients.
3. Create `errorNormalization.ts` with shared 404->empty logic & standard envelope.
4. Migrate high-traffic endpoints (appointments list/statistics, risk template retrieval) to new transport; instrument metrics.

Phase B (Consolidate):
5. Deprecate `client.js`; freeze changes; route imports through façade shim file mapping to transport.
6. Replace fallback arrays with registry entries: `endpointPolicies["riskTemplateCategories"] = { variants:[...], retireMetricKey:"riskTemplateCategories.variant" }`.
7. Normalize FormData media builder.
8. Move all offline cache writes through `offlineCache.store(key, data, meta)` implementing TTL + optional schema verify.

Phase C (Eliminate & Harden):
9. Remove unused code paths in `index.ts` after verifying zero runtime calls (instrument with warning log per function invocation for a week).
10. Enforce TypeScript migration for API modules; generate types or define interfaces; integrate zod validation pipeline.
11. Introduce lint rule / codemod to forbid raw string endpoint literals outside registry file.

Phase D (Optimize):
12. Add adaptive retry (jittered exponential) & circuit breaker segmentation improvements.
13. Introduce structured logger (JSON events) with correlation IDs per request chain.
14. Pre-fetch orchestration using batch + dynamic priority queue (leveraging `apiRequestManager` concurrency controls).

---
## 6. Tactical Refactors (Fast Wins)
| Win | Change | Effort | Benefit |
|-----|--------|--------|---------|
| FW-01 | Extract `interpretEmpty404` util & replace 4+ occurrences. | Low | Single source of semantics. |
| FW-02 | Central `buildAuthHeaders(mode)`; call from both clients (pre-consolidation). | Low | Reduces auth drift risk. |
| FW-03 | Introduce `endpointPolicies.ts` JSON map (id→{path, timeout, cacheTTL}). | Low | Removes scattered magic strings/timeouts. |
| FW-04 | Wrap FormData creation for media in helper reused in batch & single. | Low | DRY, easier future changes (e.g., checksum). |
| FW-05 | Add warning logs to suspected unused `index.ts` functions to collect usage telemetry. | Low | Data-driven safe deletion. |

---
## 7. Proposed File Additions / Deletions
| Action | File | Rationale |
|--------|------|-----------|
| Add | `transport/core.ts` | Unified request orchestration. |
| Add | `services/authSessionService.ts` | Token & API key header consolidation. |
| Add | `services/endpointPolicies.ts` | Central endpoint registry & timeouts. |
| Add | `utils/errorNormalization.ts` | Shared 404→empty + envelope. |
| Delete (after migration) | `api/client.js` | Legacy duplicate stack. |
| Delete (after migration) | Redundant sections of `api/index.ts` | Decompose to domain-specific modules. |

---
## 8. Metrics / Validation Before Removal
| Metric | Target | Tooling |
|--------|--------|---------|
| Calls to legacy `client.js` after façade introduced | 0 within 2 sprints | Console warn + counter export |
| Fallback variant success rate | <5% before removal | Instrument registry variant selection |
| Duplicate 404 handlers remaining | 0 | Grep CI check failing build |
| Distinct token refresh implementations | 1 | Static import scan |

---
## 9. Risks of Consolidation & Mitigations
| Risk | Mitigation |
|------|-----------|
| Hidden consumer relying on subtle legacy client behavior (e.g., retry count) | Shadow mode: run transport & legacy in parallel for sample endpoints; diff outcomes. |
| Removal of fallback breaks edge tenant | Observe variant usage metrics for 14 days; communicate deprecation early. |
| Central registry becomes single point of failure | Keep small local default constants; unit tests for registry loader. |
| Schema validation rejects real but previously tolerated drift | Start in WARN mode; collect stats; escalate to BLOCK after baseline. |

---
## 10. Recommendation Set (RDC-*)
ID | Recommendation | Resolves | Priority
- RDC-01 Implement unified transport & deprecate legacy `client.js`. | Dual stacks, retries drift | P1
- RDC-02 Abstract auth/session header logic. | Token/user context duplication | P1
- RDC-03 Centralize 404 empty mapping into util w/ pattern list. | 404 heuristic duplication | P1
- RDC-04 Introduce endpoint registry & remove hard-coded timeouts. | Timeout duplication | P1
- RDC-05 Instrument and retire fallback variant endpoints progressively. | Multi-probe redundancy | P2
- RDC-06 Normalize offline caching through single module with TTL + validation. | Cache style sprawl | P2
- RDC-07 DRY media upload FormData builder. | FormData duplication | P3
- RDC-08 Add structured logger wrapper replacing raw console noise. | Logging duplication | P3
- RDC-09 Migrate API modules to TypeScript + schemas. | Envelope/type inconsistency | P2
- RDC-10 Add CI grep rule disallowing inline endpoint strings (except registry). | Prevent reintroduction | P2

---
## 11. Fast Implementation Order (Sequenced)
1. FW-01, FW-02 (utilities) -> immediate reduction in future divergence.
2. Endpoint registry stub + adopt for appointments & risk templates (highest traffic).
3. Introduce transport core; re-point two modules (pilot) -> measure parity.
4. Add instrumentation & gather 1-week metrics.
5. Remove duplicated token logic; mark `client.js` deprecated banner.
6. Expand migration to all API modules; excise fallback variants with zero usage.
7. Type + schema integration; offline cache alignment.

---
## 12. Summary
Redundancy is concentrated in the networking/auth/caching layers due to evolutionary layering of new experimental features (enhanced client, sync APIs) atop legacy clients. Eliminating dual clients and centralizing endpoint policy + error semantics yields the highest leverage: lowers complexity, unifies resilience strategy, and enables precise observability. A disciplined phased approach (instrument → migrate → validate → remove) minimizes regression risk while accelerating future feature delivery.

Prepared exclusively from code; no pre-existing docs consulted.
