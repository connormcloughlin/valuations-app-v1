<!--
  API_SUPPORT_BACKLOG.md
  Purpose: Backend (API platform) backlog required to enable / maximize ROI of mobile refactor stories S1–S19 in `IMPLEMENTATION_BACKLOG.md`.
  Scope: Server-side changes only (contract, security, performance, observability, deprecation, documentation).
  Date: 2025-09-24
  Source Basis: Mobile code-derived audits & mobile implementation backlog. No reuse of prior narrative docs.
-->

# API Support Backlog (For Mobile Refactor Enablement)

## Legend
- Priority: P0 (Immediate unblockers), P1 (Short-term), P2 (Hardening), P3 (Strategic / Future)
- Effort: S / M / L (relative server team estimate)
- Traceability: Links to mobile stories (S#) & risks (SEC-*, R*, CS-*, DUP-*) they unlock or mitigate.
- "Agent Prompt" = Execution-ready instruction for an autonomous backend/infra agent.

## Quick Index
| ID | Priority | Effort | Title | Unlocks Mobile | Key Risks Addressed |
|----|----------|--------|-------|----------------|---------------------|
| A1 | P0 | M | Canonical Endpoint Contract & Version Tagging | S1,S8,S12 | R2,R8,R10 |
| A2 | P0 | M | 404 vs 204 Semantics Normalization | S3,S4,S10 | SEC-04,R3 |
| A3 | P0 | L | Short-Lived Token & Rotation Endpoint | S2,S6,S15 | SEC-01,SEC-02 |
| A4 | P0 | M | OpenAPI Spec Accuracy & CI Drift Gate | S4,S11,S16 | SEC-03,R10 |
| A5 | P0 | S | Consistent Error Envelope (No Raw Strings) | S1,S3,S4 | R9,SEC-04 |
| A6 | P0 | S | Risk Template Endpoint Consolidation | S1,S4,S9 | R2,R6 |
| A7 | P1 | M | Integrity Header Support for Media Uploads | S14 | SEC-08 |
| A8 | P1 | S | Add ETag / If-None-Match for Cacheable Collections | S10,S15 | Performance, R5 |
| A9 | P1 | S | Per-Endpoint Policy Metadata Endpoint | S1,S5,S13 | R7,Observability |
| A10| P1 | M | Unified Stats Endpoint (Mobile Optimized) | S1,S10 | Performance, R7 |
| A11| P1 | S | Email Hash Acceptance & Deprecate Raw Email Header | S2,S5 | SEC-06 |
| A12| P2 | M | Field Projection & Partial Response Support | S10,S15 | Data Minimization |
| A13| P2 | M | Pagination Consistency & Cursor Tokens | S1,S10 | Performance, Data Drift |
| A14| P2 | S | Structured Security & Metrics Events Stream | S5,S13,S17 | Observability |
| A15| P2 | M | Media Chunked Upload + Resume API | S14 | Large File Robustness |
| A16| P2 | S | Soft-Delete Confirmation & Purge Hook | S6,S15 | SEC-07 |
| A17| P3 | M | Rate Limit Hints (Retry-After + Policy) | S1,S13,S17 | R7 |
| A18| P3 | S | Contract Evolution Policy (Sunset Headers) | S8,S9,S18 | Future Drift |
| A19| P3 | S | Schema Hash Header (Server) | S4,S10,S16 | Tamper Detection |
| A20| P0 | S | Soft/Hard Expiry Metadata & Revocation Codes | S2,S2C,S6 | UX Stability, SEC-01 |

---
## Detailed Stories & Agent Prompts

### A1 – Canonical Endpoint Contract & Version Tagging
Story: As a backend engineer I need a versioned, canonical set of endpoint paths (v1) so the mobile endpoint registry (S8) references stable contracts and fallback probing can be removed.
Acceptance Criteria:
1. Introduce `/api/v1/` prefix (reverse proxy / routing alias acceptable) for all mobile-consumed endpoints (appointments, surveys, risk templates, media, stats).
2. Provide 301/302 or explicit deprecation header (`Deprecation`, `Sunset`) on legacy unprefixed paths.
3. Publish updated OpenAPI with versioned paths.
4. Add CI rule: new mobile endpoints MUST include version prefix.
Traceability: S1,S8,S9,S12 | Risks: R2,R8,R10.
Agent Prompt:
Implement versioned routing:
1. Add `/api/v1` router grouping existing controllers.
2. Add deprecation middleware adding `Deprecation: true` & `Sunset: <ISO_DATE+90d>` to legacy routes.
3. Update OpenAPI paths & regenerate spec artifact.
4. Add CI check failing if path regex `^/(appointments|surveys|risk-)` added without `/api/v1` prefix.
5. Produce diff summary (# endpoints versioned, # legacy annotated).

### A2 – 404 vs 204 Semantics Normalization
Story: Standardize empty response semantics to allow mobile removal of substring heuristics (S3).
Acceptance Criteria:
1. Endpoints that represent "no collection items" return HTTP 204 (no body) OR 200 with `[]` – never 404.
2. True 404 only when the parent resource ID is invalid/nonexistent.
3. Document per endpoint rule in OpenAPI descriptions.
4. Add integration tests verifying status codes.
Traceability: S3,S10 | Risks: SEC-04,R3.
Agent Prompt:
Refactor controllers to return 204 for empty lists. Ensure current 404-with-message paths updated. Update OpenAPI & add tests capturing previous incorrect behavior (guard).

### A3 – Short-Lived Token & Rotation Endpoint
Story: Provide ephemeral bearer tokens (e.g. 15 min) and refresh/rotate to enable secure mobile session service (S2, S6).
Acceptance Criteria:
1. Endpoint: `POST /api/v1/auth/token` returns { accessToken (ttl<=900s), refreshToken (ttl<=7d), issuedAt }.
2. Endpoint: `POST /api/v1/auth/refresh` consumes refreshToken, returns new pair (rotate refresh token).
3. Revoke mechanism: `POST /api/v1/auth/revoke` (idempotent) invalidates refresh token.
4. Tokens signed with strong algorithm (RS256 or EdDSA) – public key exposable for mobile verification future.
5. Include `kid` header; JWKS endpoint `/api/v1/.well-known/jwks.json`.
6. OpenAPI updated; security scheme documented.
Traceability: S2,S6,S15 | Risks: SEC-01,SEC-02.
Agent Prompt:
Implement refresh token rotation: create auth controller endpoints, add JWT signing w/ key rotation schedule metadata, persist refresh tokens (secure store), add revocation list or status column, expose JWKS. Provide tests for rotation & invalid refresh.

### A4 – OpenAPI Spec Accuracy & CI Drift Gate
Story: Guarantee code ↔ spec alignment so mobile type generation (S16) & validation (S4) are reliable.
Acceptance Criteria:
1. Add schema-first or code-first generation step producing `swagger.json` on build.
2. CI fails if `git diff` shows handler path not reflected in spec or if schemas diverge (hash compare strategy).
3. Provide `x-mobile-critical: true` vendor extension on core entities.
Traceability: S4,S11,S16 | Risks: SEC-03,R10.
Agent Prompt:
Add spec generation script, implement diff hash check, annotate critical models (Appointment, Survey, RiskTemplate*, MediaUploadResponse). Output mismatches list.

### A5 – Consistent Error Envelope
Story: Provide unified error JSON so mobile transport can normalize (S1,S3).
Acceptance Criteria:
1. Error shape: `{ error: { code, message, details?, correlationId } }`.
2. Middleware attaches correlationId per request (UUID v4).
3. OpenAPI components updated with `ErrorResponse`.
4. Legacy plain text errors replaced.
Traceability: S1,S3,S5 | Risks: R9,SEC-04.
Agent Prompt:
Implement global error handler returning unified envelope. Replace legacy `res.status().send('...')`. Add test for 400, 404, 500 cases.

### A6 – Risk Template Endpoint Consolidation
Story: Remove multi-probe necessity on mobile (fallback arrays) by exposing single canonical endpoints.
Acceptance Criteria:
1. Decide canonical set (e.g., `/api/v1/risk/templates`, `/api/v1/risk/templates/{templateId}/sections/{sectionId}/categories`, etc.).
2. Deprecated variants emit warning header `Warning: 299 - "Deprecated risk template path"`.
3. Provide mapping table in docs.
4. Telemetry: count hits to deprecated paths.
Traceability: S1,S4,S9 | Risks: R2,R6.
Agent Prompt:
Implement canonical endpoints & wrapper deprecations. Add metrics counter for deprecated path usage. Provide 30-day deprecation report query.

### A7 – Integrity Header Support for Media Uploads
Story: Accept & verify `X-File-Integrity` (SHA-256) and reject mismatch (enables S14).
Acceptance Criteria:
1. Middleware computes server-side hash, compare with header.
2. Mismatch -> 422 with error code `INTEGRITY_MISMATCH`.
3. Store hash alongside media metadata.
Traceability: S14 | Risks: SEC-08.
Agent Prompt:
Add integrity middleware to upload route; implement hashing stream; update schema & tests for mismatch + success.

### A8 – ETag / Conditional Caching
Story: Enable mobile offline cache revalidation (S10,S15).
Acceptance Criteria:
1. Collections (appointments list, risk template hierarchy) return stable ETag.
2. Support `If-None-Match` returning 304 no body.
3. ETag variant part includes data version + schema hash.
Traceability: S10,S15 | Risks: R5 (stale data).
Agent Prompt:
Add ETag generator (hash of serialized canonical projection) & conditional response middleware. Add tests for 304 path.

### A9 – Per-Endpoint Policy Metadata Endpoint
Story: Expose server guidance for mobile transport policies (timeouts, cache hints, criticality flags) to reduce hard-coded values (S1,S5,S13).
Acceptance Criteria:
1. Endpoint: `GET /api/v1/mobile/endpoint-policies` returning array of { id, recommendedTimeoutMs, cacheTTL, priority }.
2. Backed by config file or DB for adjustability.
3. Timestamp + version field for change detection.
Traceability: S1,S13 | Risks: R7.
Agent Prompt:
Create endpoint & config loader. Add test for shape & caching headers (short TTL). Provide sample JSON.

### A10 – Unified Stats Endpoint (Mobile Optimized)
Story: Replace multi-calls & extended timeouts with server-side aggregation.
Acceptance Criteria:
1. Endpoint: `GET /api/v1/mobile/dashboard/summary` (appointments statuses, counts, recent changes).
2. Response time p95 < 2s with realistic dataset.
3. Remove need for separate fallback stats endpoints.
Traceability: S1,S10 | Risks: R7 (timeout heuristics).
Agent Prompt:
Implement aggregated query with indexes, measure p95 (log), return minimal schema. Provide benchmark script output.

### A11 – Email Hash Acceptance & Raw Email Deprecation
Story: Allow hashed email in context header to reduce PII exposure (S2,S5).
Acceptance Criteria:
1. Accept header `X-User-Context` containing `{ emailHash, userId }`.
2. Server resolves user by hash; fallback to email only if email present (log warning) for transitional period.
3. Warning header when raw email used.
Traceability: S2,S5 | Risks: SEC-06.
Agent Prompt:
Update auth middleware to parse hashed context, perform lookup, emit warning header if raw email found. Add tests for both modes.

### A12 – Field Projection / Partial Responses
Story: Reduce payload size for cache efficiency (S10,S15).
Acceptance Criteria:
1. Support query param `fields=comma,list` for list endpoints.
2. Validate allowed field set; default full.
3. Document projections in OpenAPI.
Traceability: S10,S15 | Data minimization.
Agent Prompt:
Implement projection middleware; update handlers to apply field filter. Add test verifying field reduction.

### A13 – Consistent Pagination & Cursors
Story: Standardize pagination to reduce client complexity.
Acceptance Criteria:
1. Use cursor-based pagination for large lists: response includes `nextCursor`.
2. Provide `limit` bounds; enforce max.
3. Document in OpenAPI; deprecate ad-hoc page params.
Traceability: S1,S10 | Risks: Data drift, performance.
Agent Prompt:
Add cursor pagination util; retrofit appointments list. Provide migration notes & tests (first/next page).

### A14 – Security & Transport Metrics Stream
Story: Enable mobile to correlate circuit breaker decisions with server telemetry (S13,S17).
Acceptance Criteria:
1. Emit structured events (JSON Lines / queue) for auth failures, 4xx rates, latency p95, error bursts.
2. Provide metrics snapshot endpoint `/api/v1/admin/metrics` (secured).
Traceability: S5,S13,S17 | Observability.
Agent Prompt:
Integrate metrics middleware; persist counters & histograms (e.g. Prometheus exposition). Add endpoint returning selected fields; tests verifying schema.

### A15 – Chunked & Resumable Media Upload
Story: Reduce failure rate for large media (S14).
Acceptance Criteria:
1. Initiate: `POST /api/v1/media/uploads` -> uploadId.
2. Chunk: `PUT /api/v1/media/uploads/{uploadId}/parts/{n}` with integrity header per chunk.
3. Complete: `POST /api/v1/media/uploads/{uploadId}/complete` verifying sequence & hash of concatenated chunks.
4. Abort endpoint.
Traceability: S14 | Robustness.
Agent Prompt:
Design chunk tables (uploadId, partNo, hash, size). Implement endpoints + final assembler. Add tests (happy path & missing chunk). Document in OpenAPI.

### A16 – Soft-Delete Confirmation & Purge Hook
Story: Ensure logout purge (S6,S15) aligns with server deletion semantics.
Acceptance Criteria:
1. Add `deletedAt` timestamp to soft-deleted resources.
2. Endpoint to request purge confirmation batch (IDs + purge tokens) enabling client to safely hard-purge local copies.
Traceability: S6,S15 | SEC-07.
Agent Prompt:
Add column & migration; implement `GET /api/v1/purge/appointments?since=...` returning list of purgable IDs; add test.

### A17 – Rate Limit Hints
Story: Provide structured rate limit info to guide adaptive retry (S13).
Acceptance Criteria:
1. Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` on 429.
2. Document server-side policy window.
Traceability: S13,S17 | R7.
Agent Prompt:
Add rate limiting middleware (token bucket / leaky). Inject headers and consistent 429 error envelope. Add tests verifying headers.

### A18 – Contract Evolution Policy (Sunset Flow)
Story: Formal deprecation process to prevent future fallback chaos.
Acceptance Criteria:
1. Add `Sunset` header & `Link: <url>; rel="sunset"` when marking endpoint for removal.
2. Document deprecation lifecycle (announce → warn → remove) in contributor guide.
3. CI rule: removal of endpoint requires scanning for active consumers metadata file.
Traceability: S8,S9,S18 | R2,R6.
Agent Prompt:
Implement middleware adding sunset headers for flagged endpoints list. Add doc section & sample config.

### A19 – Schema Hash Header
Story: Provide stable hash per response schema enabling client tamper & drift detection.
Acceptance Criteria:
1. Header `X-Schema-Hash` (SHA-256 of canonical JSON schema for entity) on critical payloads.
2. Changes in schema hash require minor version bump or documented changelog entry.
3. Document mapping of entity → schema hash in spec extensions.
Traceability: S4,S10,S16 | SEC-03,R5.
Agent Prompt:
Compute schema hash at build time; attach via response middleware for endpoints tagged `x-mobile-critical`. Add test verifying header presence.

### A20 – Soft/Hard Expiry Metadata & Revocation Codes
Story: Provide explicit token lifetime segmentation (soft vs hard expiry) and machine-readable revocation reasons so mobile can perform graceful background refresh without interrupting active user workflows.
Acceptance Criteria:
1. Token payload (or refresh response JSON) includes fields: `exp` (hard expiry epoch), `soft_exp` (soft expiry epoch), `sid` (session id), `ver` (token schema version).
2. Refresh endpoint returns `retry_after_seconds` when transient conditions (e.g. upstream auth provider latency) advise retry vs immediate logout.
3. On invalid/compromised token server returns 401 JSON error with code `TOKEN_REVOKED` (hard logout) or `REFRESH_REQUIRED` (graceful attempt) vs generic message.
4. Add JWKS or metadata endpoint extension documenting supported codes and expected client behaviors.
5. OpenAPI security schema extended with description of soft/hard expiry semantics.
6. Tests: (a) refresh near soft_exp returns new token pair; (b) request after hard expiry returns TOKEN_REVOKED; (c) simulated transient failure returns 503 + `retry_after_seconds`.
Traceability: Mobile S2,S2C; Risks SEC-01, SEC-02 (better rotation & continuity), UX stability.
Agent Prompt:
1. Extend token generation to embed `soft_exp` (e.g. exp - 120s) – configurable.
2. Modify refresh handler to send structured error codes (`TOKEN_REVOKED`, `REFRESH_REQUIRED`, `TRANSIENT_ISSUE`).
3. Update OpenAPI components & examples.
4. Add integration tests for each code path.
5. Provide sample token decode snippet in repo docs for client reference.

---
## Cross-Dependency Map (API → Mobile)
```
A1 → (enables mobile S8,S9,S12)
A2 → (enables mobile S3 removal of heuristics)
A3 → (enables secure session S2,S6,S15)
A20 → (enables graceful continuity S2C)
A4 → (feeds schema validation & codegen S4,S16)
A5 → (simplifies error handling S1,S3)
A6 → (removes multi-probe logic S1,S9)
A7 → (media integrity for S14)
A8 → (improves cache strategy S10,S15)
A9 → (dynamic policies for S1,S13)
A10 → (removes special timeout S1)
A11 → (PII reduction S2,S5)
A12 → (payload minimization S10,S15)
A13 → (consistent pagination S1,S10)
A14 → (observability S5,S13,S17)
A15 → (robust upload S14)
A16 → (secure purge semantics S6,S15)
A17 → (adaptive retry S13)
A18 → (future-safe deprecation S8,S9,S18)
A19 → (schema drift detection S4,S16)
```

---
## Execution Wave Recommendation
Wave 1 (P0): A1,A2,A3,A4,A5,A6
Wave 2 (Early P1): A8,A9,A10,A11,A7,A20 (if not completed in Wave 1)
Wave 3 (P2 Hardening): A12,A13,A14,A15,A16
Wave 4 (Strategic): A17,A18,A19

Rationale: Wave 1 eliminates contract ambiguity & enables secure, validated mobile stack; Wave 2 injects performance & integrity optimizations consumed by new transport/cache layers; Wave 3 enhances scalability & security posture; Wave 4 future-proofs evolution.

---
## Backend Acceptance Verification Matrix (Sample)
| Mobile Dependence | Required API Artifact | Verification Method |
|-------------------|-----------------------|--------------------|
| S3 (404 policy) | A2 normalized codes | Contract test suite (empty list => 204) |
| S4/S16 (schemas) | A4 accurate OpenAPI | CI drift gate passes, hash diff 0 |
| S14 (integrity) | A7 header verification | Upload test returns 422 on mismatch |
| S10 (cache TTL) | A9 endpoint policies | Policy endpoint returns TTL JSON |
| S2 (hashed email) | A11 hash acceptance | Raw email triggers warning header |
| S15 (purge) | A16 purge list | Endpoint returns deleted IDs since timestamp |
| S13 (breaker tuning) | A9 + A14 metrics | Policy + metrics endpoints respond |

---
## Reporting Template (Per API Story)
```
### A{n} – {Title}
Date: YYYY-MM-DD Deployed
Spec Version: vX.Y.Z
Endpoints Added/Modified: (list)
Backward Compatibility: (Yes/No + notes)
Tests Added: <count>
Performance (p95): <value> ms (if applicable)
Security Impact: (SEC-* references)
Mobile Stories Unblocked: [S#,...]
Follow-ups: (list)
```

---
## Risk Mapping Summary
| Risk | API Stories Mitigating | Notes |
|------|------------------------|-------|
| R2 / Multi-probe fallback | A6,A1,A18 | Consolidation + versioning |
| SEC-01 / Static API key | A3 | Token rotation foundation |
| SEC-03 / Validation gap | A4,A19 | Accurate schemas + hashes |
| SEC-04 / 404 masking | A2,A5 | Status normalization + envelope |
| R7 / Hard-coded timeouts | A9,A10 | Policy metadata + aggregated stats |
| SEC-08 / Media constraints | A7,A15 | Integrity + chunking |
| Cache Staleness | A8,A19 | Conditional GET + schema hash |

---
## Notes
- Where feasible expose feature flags in policy endpoint to allow mobile progressive enablement.
- Emit structured deprecation telemetry early (Wave 1) to measure real client usage before removal.
- Keep OpenAPI spec as contract source; mobile validation depends on stability of naming and nullability.

---
End of API Support Backlog.
\n+---
## Appendix A – Mobile-Consumed Endpoint Mapping (Current → Target Canonical)
Source: Code-derived mobile client inspection (no prior docs). Purpose: Give backend team precise contract surface for versioning (A1), normalization (A2, A6), caching (A8), policy metadata (A9), and deprecation (A18).

| Domain | Current Path (Observed) | Method(s) | Mobile Use (Key Functions) | Issues / Gaps (Audit Codes) | Proposed Canonical v1 Path | 404 Semantics Target | Cacheable? (Guidance) | ETag? | Policy Notes / Special Timeout | Notes |
|--------|-------------------------|-----------|----------------------------|-----------------------------|----------------------------|----------------------|-----------------------|-------|-------------------------------|-------|
| Auth | /auth/login | POST | login() | Static key mode only (SEC-01) | /api/v1/auth/login | 401 only on bad creds | No | No | — | Consider deprecate if moving to token exchange only |
| Auth | /auth/token-exchange | POST | exchangeToken() | JWT path disabled (legacy) | /api/v1/auth/token (A3) | 400 invalid grant | No | No | — | Replace w/ short-lived tokens |
| Auth | /auth/verify | GET | verifyAuth() | Non-standard verify vs introspect | /api/v1/auth/verify | 401 invalid token | No | No | — | Could merge into token introspection |
| Appointments | /appointments | GET | list, status filters | Hard-coded timeouts (R7) | /api/v1/appointments | 200 [] or 204 none | Yes (short TTL 10m) | Optional | Standard timeout | Accept field projection (A12) |
| Appointments | /appointments/{id} | GET | detail lookup | Fallback to list scan (perf) | /api/v1/appointments/{id} | 404 if id missing | No | No | Normal | Encourage conditional GET by ETag |
| Appointments | /appointments/order/{orderNumber} | GET | lookup by order | Possibly redundant if search endpoint added | /api/v1/appointments/by-order/{orderNumber} | 404 invalid order | No | No | Normal | Consider unify under search param |
| Appointments | /appointments/with-orders | GET | list with embedded orders | Parallel variant increases drift | /api/v1/appointments?include=orders | 200 [] or 204 | Yes (10m) | Yes | Normal | Replace path variant with include param |
| Appointments | /appointments/with-orders/{status} | GET | status subset | Path-based status duplication | /api/v1/appointments?status=<>&include=orders | 200 []/204 | Yes | Yes | Normal | Remove status sub-path |
| Appointments | /appointments/list-view | GET | large aggregated list | Extended timeout hack | /api/v1/appointments/list-view (or unified query) | 200 []/204 | Yes (5m) | Yes | Increase recommendedTimeoutMs | Could merge into base with query flags |
| Appointments | /appointments/stats | GET | fallback stats | Duplicate of optimized stats | /api/v1/appointments/stats (deprecated after A10) | 200 {counts} | Yes (1m) | No | Might have extended timeout | Superseded by /mobile/dashboard/summary |
| Dashboard | /mobile/appointment/dashboard/status-counts | GET | primary stats | Non-versioned prefix | /api/v1/mobile/dashboard/summary | 200 JSON | Yes (1m) | No | Normal | Consolidate multiple stats |
| Surveys | /surveys | GET | list | No ETag, no projection | /api/v1/surveys | 200 []/204 | Yes (30m) | Yes | Normal | Add fields param |
| Surveys | /surveys/{id} | GET | detail | — | /api/v1/surveys/{id} | 404 invalid id | No | Optional | Normal | Add schema hash header (A19) |
| Surveys | /surveys/{id} (create/update) | POST (create/update) | submitSurvey() | Upsert semantics ambiguous | /api/v1/surveys (POST create), /api/v1/surveys/{id} (PUT update) | 409 on conflict | No | No | Normal | Align verbs to REST |
| Surveys | /surveys/{id} | DELETE | deleteSurvey() | Standard | /api/v1/surveys/{id} | 404 invalid id | No | No | Normal | Soft delete should set deletedAt (A16) |
| Media | /uploads | POST | uploadFile() | No integrity check | /api/v1/media/upload (simple) | 422 invalid file | No | No | Normal | Integrity header (A7) |
| Risk Templates | /risk-templates | GET | getRiskTemplates() | Fallback arrays for sub-entities | /api/v1/risk/templates | 200 []/204 | Yes (24h) | Yes | Normal | Provide ETag & schema hash |
| Risk Templates | /risk-assessment-sections/assessment/{templateId} | GET | sections (variant) | Non-canonical naming | /api/v1/risk/templates/{templateId}/sections | 404 invalid template | Yes (24h) | Yes | Normal | Consolidate naming |
| Risk Templates | /risk-template-categories/section/{sectionId} (+ variants) | GET | categories | Multiple variant probing (R2) | /api/v1/risk/sections/{sectionId}/categories | 404 invalid section | Yes (24h) | Yes | Normal | Remove deprecated variants w/ Warning header |
| Risk Templates | /risk-template-items/category/{categoryId} (+ variants) | GET | items | Multi-probe (R2) | /api/v1/risk/categories/{categoryId}/items | 404 invalid category | Yes (24h) | Yes | Normal | 204 instead of 404 empty |
| Risk Assessments | /risk-assessment-sections/assessment/{id} | GET | assessment sections | Inconsistent pattern vs templates | /api/v1/risk/assessments/{id}/sections | 404 invalid id | Yes (24h) | Yes | Normal | Harmonize resource hierarchy |
| Risk Assessments | /risk-assessment-categories/section/{id} | GET | assessment categories | — | /api/v1/risk/assessment-sections/{id}/categories | 404 invalid id | Yes (24h) | Yes | Normal | Align naming |
| Risk Assessments | /risk-assessment-items/category/{id} | GET | assessment items | 404→empty heuristic used | /api/v1/risk/assessment-categories/{id}/items | 200 [] / 204 | Yes (24h) | Yes | Normal | Enforce 204 empty semantics |

### Legend / Column Guidance
- Issues / Gaps: Refer to audit risk IDs (R*, SEC-*, DUP-*) or structural issues (naming, semantics, fallback usage).
- 404 Semantics Target: Specifies correct contract so mobile can remove heuristics; Use 204 or 200 [] for empty collections.
- Cacheable guidance: Proposed server hints (A9) & ETag (A8) for revalidation strategy.
- Policy Notes: Values expected to appear in policy metadata endpoint (A9) to drive mobile transport config (timeout, TTL, priority).

### Summary Metrics (Baseline → Target)
| Metric | Baseline (Observed) | Target After API Stories |
|--------|---------------------|--------------------------|
| Fallback-Probed Endpoints | 5 (categories/items/sections variants) | 0 (after A6) |
| Non-Versioned Mobile Paths | ~All | 0 (after A1) |
| Endpoints Returning 404 for Empty | ≥2 | 0 (after A2) |
| Endpoints With ETag | 0 | ≥8 (core collections) |
| Extended Timeout Special-Cases | 2 (list-view, stats) | 0 (A9 + A10) |

---
