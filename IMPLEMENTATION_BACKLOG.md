<!--
  IMPLEMENTATION_BACKLOG.md
  Source: Code-derived audits (Business, Architecture, Endpoints, Redundancy, Security, Code Structure) – NOT existing docs.
  Purpose: Executable backlog with user stories, acceptance criteria, agent prompts, traceability to audit findings (SEC-*, CS-*, BF-*, etc.).
  Date: 2025-09-24
-->

# Implementation Backlog (Prioritized, Code-Derived)

## Legend
- Priority Levels: P0 (Immediate), P1 (Next), P2 (Later Hardening), P3 (Polish / Future)
- Effort: S (Small), M (Medium), L (Large)
- Roles: Dev (Developer), Sec (Security), PM (Product Maintainer)
- Traceability Tags map to audits: SEC-*, CS-*, BF-*, RISK (redundancy risk IDs), R# (Endpoint Risks), DUP-* (duplication patterns)

---
## Quick Priority Index

| ID | Priority | Effort | Title | Key Risks Reduced |
|----|----------|--------|-------|-------------------|
| S0 | P0 | S | Remove API‑Key Remnants and Broken Imports | SEC-01,R6 |
| S1 | P0 | L | Unify Transport Layer | R1,R6,R7,SEC-04,DUP-* |
| S2 | P0 | M | Secure Token & User Context Handling | SEC-01,SEC-02,DUP-TOKEN-CACHE |
| S2C | P0 | M | Seamless Session Continuity (Preemptive & Graceful Refresh) | SEC-01,SEC-02 + UX Stability |
| S3 | P0 | S | Centralized Empty/404 Semantics | SEC-04,R3,DUP-404EMPTY |
| S4 | P0 | M | Schema Validation (Critical Entities) | SEC-03,R5 |
| S5 | P0 | M | Structured Logging & Redaction | SEC-06,R6 |
| S6 | P0 | M | Secure Logout & Data Purge | SEC-07,SEC-02 |
| S7 | P1 | L | Decompose db.ts | CS-02,CS-11 |
| S8 | P1 | S | Endpoint Registry | R8,R13,CS-03 |
| S9 | P1 | M | Remove Legacy Clients | R6,DUP-* |
| S10| P1 | M | Standardize Offline Cache | R5,SEC-03 |
| S11| P1 | M | Testing Backbone | CS-09,SEC-03 |
| S12| P1 | L | Type Migration (High-Churn APIs) | CS-07,R10 |
| S13| P2 | M | Circuit Breaker Granularity & Metrics | SEC-09,R4 |
| S14| P2 | M | Media Upload Constraints | SEC-08 |
| S15| P2 | S | Data Retention & Purge TTL | SEC-02,SEC-07 |
| S16| P2 | M | OpenAPI Type Generation | CS-07,R10 |
| S17| P3 | M | Structured Metrics Export | Observability gaps |
| S18| P3 | S | Remove Obsolete Aggregator api/index.ts | Redundancy |
| S19| P3 | S | Lint & Layer Boundary Enforcement | CS-06,CS-03 |

---
## P0 – Foundation & Security

### S0 – Remove API‑Key Remnants and Broken Imports
Evidence (from code):
- `mobile-tablet/constants/apiConfig.ts` enforces JWT‑only (API key symbols removed).
- `mobile-tablet/api/client.js` still references `API_KEY`, `API_KEY_HEADER_NAME`, and `validateApiKeyConfig` which no longer exist.
- Several services (e.g., `services/prefetchService.ts`) dynamically import removed API‑key constants.
Acceptance Criteria:
1. Delete API‑key branches from `api/client.js` and affected services; rely solely on `core/auth/sessionService.getAuthHeaders()`.
2. Remove stale imports (`API_KEY`, `API_KEY_HEADER_NAME`, `validateApiKeyConfig`).
3. Ensure `X-User-Context` is produced via sessionService with SHA‑256 email hash.
4. Smoke test app startup and a simple authenticated fetch; no missing export errors.
Traceability: SEC‑01, R6.

### S1 – Unify Transport Layer (Retire Dual Clients)
Story: As a Dev I want a single transport abstraction so retries, headers, circuit breaker, caching and error semantics are consistent and testable.
Acceptance Criteria:
1. New file: `core/transport/transportClient.ts` built atop existing `utils/apiRequestManager.ts` (single internal axios instance).
2. Policy map: endpointID -> { timeoutMs, retry: { attempts, strategy }, cacheTTL, interpretEmptyPolicyKey }.
3. All calls in `api/appointments.*`, `api/riskTemplates.*`, `api/surveys.*` refactored to use transport client.
4. Legacy `client.js` & `enhancedClient.js` become shims: export deprecated wrapper logging one-time warning.
5. Hard-coded timeout logic removed (replaced by policy entries).
6. Jest tests: (a) honors timeout override, (b) applies retries, (c) injects headers from provided async header provider mock.
7. No direct axios usage outside transport after refactor (search verification pass).
Definition of Done: Tests pass, type-check passes, duplicate logic lines removed reported.
Traceability: R1,R6,R7,R5,SEC-04, DUP-TOKEN-CACHE, DUP-404EMPTY.
Agent Prompt:
Implement unified transport:
1. Create `core/transport/transportClient.ts` exporting { request(config), get(endpointId,...), post(...), etc }.
2. Introduce `core/transport/policies.ts` with map of endpoint IDs.
3. Provide an injection point `setHeaderProvider(fn: ()=>Promise<Record<string,string>>)`.
4. Refactor target API modules to consume `transportClient`.
5. Add tests in `__tests__/transportClient.test.ts` mocking axios.
6. Replace legacy clients with shims: log once: `DEPRECATED_CLIENT_USED`.
7. Output summary: number of replaced imports, removed duplicated timeout blocks.

### S2 – Secure Token & User Context Handling
Story: As Sec I want centralized secure token & user context management prepared for encrypted storage to minimize exposure.
Acceptance Criteria:
1. New `core/auth/sessionService.ts` with: loadSession(), persistSession(), getAuthHeaders(), invalidate(), refreshIfStale().
2. Email hashed (SHA-256 hex) before adding to `X-User-Context` header; user context trimmed to { userId, emailHash }.
3. JWT‑only mode across app (remove API‑key branches and imports).
4. No residual token logic in legacy client shims.
5. Redacted logging: tokens masked (first 6 chars + length).
6. Concurrency guard: multiple parallel API calls during an active refresh await a single refresh promise (single-flight refresh).
7. Preemptive refresh threshold configurable (default 120s remaining lifetime) – triggers in background without blocking in‑flight domain operations.
8. Refresh failure handling: transient network errors trigger up to 2 exponential backoff retries (e.g. 500ms, 1500ms) before escalating.
9. Distinguish soft vs hard expiry: softExpiry used for preemptive refresh; only hard expiry (or explicit server revocation code) forces logout.
10. Provide lightweight metrics counters: `session.refresh.count`, `session.refresh.failure`, `session.refresh.softWindow`. (Logging only now; formal metrics later S17.)
11. Tests: (a) coalesced refresh; (b) preemptive refresh occurs when remaining <= threshold; (c) transient failure retry; (d) hard expiry triggers invalidate.
Implementation note: Fix duplicate `getCurrentSession` definitions in `core/auth/sessionService.ts` (keep a single public getter and a private internal helper with distinct names).
Traceability: SEC-01,SEC-02,DUP-TOKEN-CACHE.
Agent Prompt:
1. Create sessionService; move token caching logic out of clients.
2. Implement hashing (web: subtle crypto; fallback to js SHA-256 lib if needed).
3. Update transport header provider to call sessionService.getAuthHeaders().
4. Add tests in `__tests__/sessionService.test.ts`.
5. Remove direct token reads from other modules (search & refactor).
 6. Implement preemptive refresh scheduler & single-flight guard.
 7. Add soft/hard expiry handling in session state.
 8. Add simple metrics counters & expose via debug logger.

### S2C – Seamless Session Continuity (Preemptive & Graceful Refresh)
Story: As a user I want long-running workflows (capturing assessments, media uploads, multi-step forms) to continue uninterrupted when tokens refresh so I am never bounced unexpectedly to the login screen.
Acceptance Criteria:
1. Augment session state with `softExpiry` (refresh before) and `hardExpiry` (absolute) timestamps.
2. While refresh is in-flight and time > hardExpiry + 15s grace, queue outbound requests (GET + mutations) instead of failing; execute after refresh resolves.
3. Request queue ensures idempotency: mutation requests deduplicated via signature (method + path + body hash) so they execute exactly once post-refresh.
4. If refresh ultimately fails but current time < hardExpiry, emit continuity event `session:refresh-temporary-failure` (no forced logout) allowing UI to show subtle banner; only force logout if server returns explicit revocation code or time >= hardExpiry.
5. Large media upload operations (size > configurable threshold) may proceed with expiring token if > 30s remain; otherwise they are paused and resumed after refresh (if resumable) or aborted with user guidance.
6. Provide hook `core/auth/useSessionContinuity.ts` returning { timeToSoftExpiry, timeToHardExpiry, refreshStatus, queuedRequests } for optional UI instrumentation (no core dependency required in business logic).
7. Tests: (a) two parallel mutations during refresh execute once each; (b) queued GET resolves after refresh; (c) hardExpiry path forces logout event; (d) mutation dedupe works (same signature only once).
8. Documentation: continuity strategy comment block at top of `sessionService.ts` referencing backend requirements for soft/hard expiry codes.
Dependencies: S2 (foundation). API dependencies moved to `valuations-api/API_IMPLEMENTATION_BACKLOG.md` (e.g., AUTH‑A1/A3).
Traceability: UX stability, SEC-01, SEC-02.
Agent Prompt:
1. Extend sessionService to persist & interpret soft/hard expiry from token payload or accompanying metadata.
2. Implement request queue with signature hashing (e.g., SHA-1 or murmur) and single-flight replayer.
3. Add event emitter (lightweight) for continuity events; integrate into hook.
4. Include logic to pause/resume eligible media uploads (stub if not yet implemented; mark TODO linking to S14/A15).
5. Write tests in `__tests__/sessionContinuity.test.ts` covering queueing & replay scenarios.
6. Instrument debug logs for queue length high-water mark.

### S3 – Centralized Empty / 404 Semantics
Story: As Dev I want explicit empty-result policy to deter silent masking.
Acceptance Criteria:
1. New `core/errors/emptyResultPolicy.ts` exporting map: endpointId -> { treatStatus:[204], treat404:false } etc.
2. Remove substring-based message checks from all code.
3. For endpoints previously returning empty on 404, keep behavior ONLY if explicitly enumerated (document reason in comments).
4. Tests: unlisted 404 throws; listed returns empty array.
Traceability: SEC-04,R3,DUP-404EMPTY.
Agent Prompt:
1. Implement policy + utility evaluateEmptyResponse().
2. Integrate into transport error interception.
3. Delete old heuristic code blocks; summarize removed line count.

### S4 – Schema Validation (Appointments, Risk Templates, Surveys)
Story: As Dev I need runtime validation to block corrupt data from persisting.
Acceptance Criteria:
1. Add dependency `zod` (update package.json).
2. Schemas: Appointment, RiskTemplateCategory, RiskTemplateItem, SurveyMeta in `core/schemas/*`.
3. Utility: `validateOrReject(schema, payload, context)` returning { ok:true,data } or throws StructuredError.
4. Insert validation before caching / DB writes.
5. Invalid payload: skip persistence; log warn with redaction.
6. Tests: one malformed payload per schema triggers rejection.
Traceability: SEC-03,R5,CS-08.
Agent Prompt:
1. Add schemas & utility.
2. Refactor API modules to validate.
3. Add tests & run coverage.

### S5 – Structured Logging & Redaction
Story: As Sec I want consistent, redacted logging for debugging without leaking PII/secrets.
Acceptance Criteria:
1. `core/logging/logger.ts`: createLogger({ levelEnvVar }) supporting debug/info/warn/error.
2. Redaction: emails -> `<email_hash:...>`, tokens -> `<token:prefix..len>`.
3. Correlation ID optional per request injected by transport (uuid v4 or short id).
4. Replace console.* in modules touched by S1–S4.
5. Tests: redaction patterns.
Traceability: SEC-06.
Agent Prompt:
1. Implement logger & redaction helpers.
2. Inject logger into transport & sessionService.
3. Replace direct console usage only in changed files (avoid large churn elsewhere).

### S6 – Secure Logout & Data Purge
Story: As Sec I want logout to remove sensitive residual data.
Acceptance Criteria:
1. `core/security/purge.ts` with purgeSensitiveData(): clears AsyncStorage keys (tokens, userContext, cached domain keys) + selected SQLite tables (appointments, assessments, media metadata).
2. Optional secure overwrite (write dummy then delete) behind flag.
3. AuthContext logout flow calls purge before resolving.
4. Test: mocks confirm deletions invoked.
Traceability: SEC-07,SEC-02.
Agent Prompt:
1. Implement purge module.
2. Integrate into logout.
3. Add test verifying calls to storage & DB wrappers.

---
## P1 – Structural & Redundancy Reduction

### S7 – Decompose `db.ts`
Story: As Dev I want DB logic separated by concern to reduce cognitive load.
Acceptance Criteria:
1. New structure: `persistence/db/connection.ts`, `persistence/db/migrations.ts`, `persistence/repositories/{appointmentsRepo.ts,riskAssessmentsRepo.ts,mediaRepo.ts}`.
2. `db.ts` becomes façade re-export with `@deprecated` docblock.
3. No functional changes; tests still green.
4. Module size of `db.ts` reduced by >70% lines.
Traceability: CS-02,CS-11,Hotspot.
Agent Prompt: Extract modules, update imports, add TODO comment to remove façade in later milestone, report line diff.

### S8 – Endpoint Registry
Story: As Dev I want a single registry to eliminate string duplication.
Acceptance Criteria:
1. `core/endpoints/registry.ts` enumerating endpoint IDs & paths & default policy keys.
2. Replace literals in primary API modules (appointments, riskTemplates, surveys).
3. ESLint rule or comment guard forbidding raw path usage in those modules.
Traceability: CS-03,R8.
Agent Prompt: Create registry, refactor imports, implement minimal lint (no-restricted-imports or custom regex), output count of replacements.

### S9 – Remove Legacy Client Internals
Story: As Dev I want to eliminate dead logic pathways after transport unification.
Acceptance Criteria:
1. `client.js` & `enhancedClient.js` replaced by stub throwing Error if invoked directly: "Deprecated: use transportClient".
2. Search ensures no direct imports remain except deprecated façade export used nowhere.
Traceability: R6,DUP-TOKEN-CACHE.
Agent Prompt: Search & refactor imports to `core/transport`. Replace internals with stub. Provide search results summary.

### S10 – Standardize Offline Cache
Story: As Dev I want consistent TTL + metadata for offline entities.
Acceptance Criteria:
1. `core/cache/offlineCache.ts` with store/get/remove & per-entity TTL config.
2. Entities: appointments (10m), risk templates (24h), surveys meta (30m default), items/categories (24h).
3. Validation hook (from S4) integrated.
4. Logging of hit/miss at debug level.
Traceability: R5,SEC-03,CS-08.
Agent Prompt: Implement cache module, migrate existing ad-hoc caches, add tests for TTL expiration & schema pass/fail.

### S11 – Testing Backbone
Story: As Dev I need automated testing to support refactors safely.
Acceptance Criteria:
1. Add Jest config (if absent) with ts-jest or babel-jest.
2. Scripts: `test`, `test:coverage` (threshold lines 70%).
3. Tests: transportClient (retry), sessionService (invalidate), schema validation (reject), offlineCache (expiry), emptyResultPolicy (404 logic).
4. CI placeholder instructions (GitHub Action future).
Traceability: CS-09,SEC-03.
Agent Prompt: Add config + tests, run coverage, output summary.

### S12 – Type Migration (High-Churn APIs)
Story: As Dev I want core API modules in TypeScript.
Acceptance Criteria:
1. Convert `api/appointments.js`, `api/riskTemplates.js`, `api/surveys.js` -> `.ts`.
2. Use `zod` inferred types from schemas.
3. Zero `any` except intentional `// TODO refine` comments.
Traceability: CS-07,R10.
Agent Prompt: Convert files, fix imports, run tsc, output any->typed count.

---
## P2 – Feature Hardening & Optimization

### S13 – Circuit Breaker Granularity & Metrics
Story: Improve isolation & observability of failures.
Acceptance Criteria:
1. Breaker key: host + first two path segments.
2. Metrics: track opens, half-open transitions, fail counts.
3. Expose `transportMetrics.snapshot()`.
Traceability: SEC-09,R4.
Agent Prompt: Implement improved keying & metrics module; add tests simulating breaker state transitions.

### S14 – Media Upload Constraints
Story: Validate media before upload.
Acceptance Criteria:
1. Config: maxSizeMB, allowedMime[], compute SHA-256 hash.
2. Add `X-File-Integrity` header with hash.
3. Reject oversize/invalid type pre-flight with structured error.
4. Tests for oversize & header presence.
Traceability: SEC-08.
Agent Prompt: Add validator, integrate in upload path, test scenarios.

### S15 – Data Retention & Purge TTL
Story: Auto-purge expired sensitive caches.
Acceptance Criteria:
1. On app bootstrap + scheduled interval (e.g. 15m) run purge scanning offlineCache metadata.
2. Info log with counts purged.
Traceability: SEC-02,SEC-07.
Agent Prompt: Implement retentionCleaner in cache module; add test with artificially expired entries.

### S16 – OpenAPI Type Generation
Story: Generate consistent types from `swagger.json`.
Acceptance Criteria:
1. Add `openapi-typescript` dev dep.
2. Generate to `core/generated/types.ts` (script: `gen:types`).
3. Begin adapter mapping to zod (at least placeholder conversions for main entities).
Traceability: CS-07,R10.
Agent Prompt: Add generator script, run once, integrate types into API modules where safe.

---
## P3 – Polish & Future Work

### S17 – Structured Metrics Export
Story: Provide internal diagnostics for performance tuning.
Acceptance Criteria:
1. Aggregate: request counts, retry counts, cache hit ratio, breaker events.
2. Expose `logMetricsSummary()` for dev builds.
Traceability: Observability gaps.
Agent Prompt: Implement aggregator, add dev-only logger function.

### S18 – Remove Obsolete Aggregator (`api/index.ts`)
Story: Delete deprecated composite API file.
Acceptance Criteria:
1. Confirm zero imports via search.
2. Delete file; update any test referencing it.
Traceability: Redundancy.
Agent Prompt: Search, confirm zero hits, remove file, output diff summary.

### S19 – Lint & Import Boundary Enforcement
Story: Enforce architectural boundaries.
Acceptance Criteria:
1. Add `.eslintrc.cjs` with import/order + no relative deep core access rule.
2. Script `lint:ci` fails on violations.
3. Apply fixes only to refactored modules to limit churn.
Traceability: CS-03,CS-06.
Agent Prompt: Configure ESLint, add rule(s), run lint, output violations count then fix targeted.

---
## Cross-Story Dependency Graph (Condensed)
```
S1 → S2 → S2C → S6
S1 → S3 → S9
S1 → S4 → S10 → S15
S1 → S5
S4 → S12 → S16
S1 → S7 → S19
S1 → S8 → S12
S1 → S11 (tests depend on new infra)
S1+S4+S5 → S13 → S17
S9+S12 → S18
```

---
## Execution Orchestration Prompt (Optional)
Agent, execute P0 (S1–S6) sequentially:
1. Implement S1 transport unification (report files & removed duplicates).
2. Implement S2 sessionService & header provider; add tests.
3. Implement S3 emptyResultPolicy; remove heuristic code.
4. Implement S4 zod schemas + validation integration.
5. Implement S5 logger + redaction; replace logs only in modified files.
6. Implement S6 secure purge on logout.
After each story: run type-check & tests; stop & fix if failures. Provide cumulative summary mapping risk reductions (SEC-* / R* / DUP-* lines removed).

---
## Risk Reduction Mapping (Selected)
| Risk / Finding | Stories Addressing | Notes |
|----------------|--------------------|-------|
| SEC-01 (API key exposure) | S2,S2C (+ future server changes) | Centralization & continuity prerequisites for rotation. |
| SEC-02 (Plaintext tokens) | S2,S2C,S6,S15 | Prep for secure storage & purge; avoids mid-flow logout. |
| SEC-03 (No schema validation) | S4,S10,S11 | Validation gate + test coverage. |
| SEC-04 (404 masking) | S1,S3 | Heuristics removed. |
| SEC-06 (PII logging) | S5 | Structured redaction. |
| R6 / Dual clients | S1,S9 | Unification then deprecation. |
| R5 / Cache corruption | S4,S10 | Validation + standardized cache. |
| CS-02 / db.ts god module | S7 | Decomposition. |
| CS-07 / Type safety gaps | S12,S16 | TS + codegen. |
| CS-08 / Schema validation layer | S4,S10 | Concrete layer delivered. |

---
## Reporting Template (Per Story Completion)
When completing a story, append an entry under a future `IMPLEMENTATION_PROGRESS.md` (proposed):
```
### S{n} – {Title}
Date: YYYY-MM-DD
Files Added: (list)
Files Modified: (list)
Duplicate Lines Removed: <count>
Tests Added: <count>
Coverage Delta: +X% lines
Risks Reduced: [SEC-03, R6]
Follow-ups: (if any)
```

---
## Notes
- Keep refactors incremental; avoid wide churn (minimize merge conflicts).
- Introduce metrics hooks early (S1 scaffolding) even if not surfaced until S17.
- JWT‑only on client. API‑side stories have been split into `valuations-api/API_IMPLEMENTATION_BACKLOG.md` and removed from this mobile backlog.

---
End of Backlog.
