# Section clone — QA matrix

Covers **Add section → Copy from…** (same assessment, structure-only).

- **Implemented API contract:** API repo `api/docs/MOBILE_RISK_ASSESSMENT_SECTION_CLONE.md`
- **Mobile summary:** `BACKEND_SECTION_CLONE_API_SPEC.md`
- **Offline materialize + optional batch:** `BACKEND_OFFLINE_SECTION_CLONE_SYNC.md`

## Preconditions

- User has an order with at least one risk template that has **≥ 1 section** with categories/items on the server (or review mock with clone handler).
- `RiskAssessmentTemplates` receives `appointmentId` (survey/appointment id) so **Copy section from…** is visible when a template is expanded.

## Online

| # | Case | Steps | Expected |
|---|------|-------|----------|
| O1 | Happy path | Expand template → Copy section from… → pick source → optional name → Copy | Success alert; new section after hierarchy refresh; structure matches source, user data empty on new rows |
| O2 | Hierarchy | After O1, pull-to-refresh or re-enter survey | `complete-hierarchy` lists new section |
| O3 | SQLite | After O1, inspect `risk_assessment_items` | New `riskassessmentcategoryid` rows; `pending_sync` / `issynced` match server-created convention |
| O4 | Idempotency | Retry POST with same `clientMutationId` (API tool) | No second section; `idempotentReplay` may be true |
| O5 | UUID body | Capture request in proxy | `clientMutationId` is RFC 4122 UUID (not `cm_*`) |
| O6 | syncVersion | After clone, check SQLite for new item rows | `syncversion` **0** when API returns `0` (not forced to 1) |

## Offline

| # | Case | Steps | Expected |
|---|------|-------|----------|
| F1 | Materialize | Airplane mode; hierarchy cached once online → Copy section from… → confirm | “Section added offline”; new row in `offline_materialized_section_clones`; provisional items in `risk_assessment_items`; section shows **Pending sync** |
| F2 | Work onsite | Open offline section → categories → items | Same structure as source; edits saved to SQLite with `pending_sync` |
| F3 | Reconcile | Go online → Sync | `processOfflineMaterializedSectionClones` calls clone API + remaps IDs; overlay row removed; hierarchy refreshed |
| F4 | No cache | Offline copy with no `complete-hierarchy` cache | Clear error to connect once to load templates |
| F5 | Legacy queue only | Old `pending_section_clones` row (no materialization) | Still drained by `processPendingSectionClones` after offline materialized pass |

## Failure / retry

| # | Case | Steps | Expected |
|---|------|-------|----------|
| R1 | API 5xx | Server error | User sees message; queue row retries up to attempt cap |
| R2 | Timeout | Slow network | Same as R1; retry uses same stored UUID |
| R3 | 404 | Bad assessment/section | Message from `error` or `message` body field |
| R4 | 422 | Malformed UUID in body (manual test) | Clear validation message |
| R5 | 409 | Reuse UUID for different source/assessment | Documented API behaviour; user should not see if app generates fresh UUID per operation |
| R6 | Auth | Expired token | Session/transport handling |

## Out of scope (regression sanity)

- Cloned section must **not** copy user answers, qty/price/notes, or photos as business rules require.
- Clone is **not** across different assessments/orders.
