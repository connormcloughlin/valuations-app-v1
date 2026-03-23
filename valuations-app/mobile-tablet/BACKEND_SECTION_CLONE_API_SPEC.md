# Clone risk assessment section — mobile ↔ API alignment

**Canonical backend contract (implemented):** in the API repo, `api/docs/MOBILE_RISK_ASSESSMENT_SECTION_CLONE.md`. This file summarizes what the **valuations-app** mobile client expects and how it behaves.

The mobile app **adds a section by copying** an existing section under the **same** risk assessment (structure-only: categories + item shells; user answers and photos are not copied for new rows).

---

## Endpoint

`POST /mobile/risk-assessment/{riskAssessmentId}/sections/clone`

- **Path:** `riskAssessmentId` = `Risk_Assessment_Master.RiskAssessmentID`.
- **Auth:** Bearer JWT (same as `complete-hierarchy`).

### Request body

| Field | Required | Notes |
|--------|----------|--------|
| `sourceRiskAssessmentSectionId` | Yes | Must belong to path `riskAssessmentId`. |
| `targetSectionName` | No | Server may assign a unique name (e.g. `Building (2)`). Whitespace-only → **422**. |
| `clientMutationId` | No | **Must be a valid UUID** for idempotency; invalid format → **422**. Mobile generates via `expo-crypto` `randomUUID()`. |

### Success response (`200`)

Canonical shape matches **`GET .../complete-hierarchy` section object**: read the cloned subtree from **`data.section`** (not a flat `data.categories` list at the top level).

```json
{
  "success": true,
  "data": {
    "section": {
      "riskAssessmentSectionId": 999001,
      "sectionName": "Building (2)",
      "sectionOrder": 4,
      "categories": [
        {
          "riskAssessmentCategoryId": 888001,
          "riskTemplateCategoryId": 174,
          "categoryName": "HOUSING CATEGORY",
          "items": [ { "riskAssessmentItemId": 777001, "syncVersion": 0 } ]
        }
      ]
    },
    "idempotentReplay": false
  }
}
```

- **`data.idempotentReplay`:** `true` when the server replayed an earlier successful clone for the same `clientMutationId` (no duplicate rows). Mobile uses **`INSERT OR REPLACE`** for items, so SQLite stays consistent on replay.
- **`syncVersion`:** Server-created clone rows may use **`0`**. The client preserves `0` in SQLite (does not coerce to `1`).
- **`location`:** API may copy structural `location` from the **source** item; do not assume it is always empty.
- **`riskTemplateCategoryId`:** Include per category when present for dynamic UI / config resolution.

**Legacy fallback:** If `data.categories` is ever returned as a flat array, the client can still parse it; prefer **`data.section.categories`** as the source of truth.

### Error responses

Typical body: `{ "success": false, "error": "Human-readable message" }` (some stacks use `message`; mobile normalizes both).

| HTTP | When |
|------|------|
| **401** | Missing or invalid JWT. |
| **404** | Assessment/section not found or not visible; or idempotent replay but stored section row missing. |
| **409** | Same `clientMutationId` already used with a **different** `riskAssessmentId` or `sourceRiskAssessmentSectionId`. |
| **422** | Bad path id, invalid/missing source section id, **invalid UUID**, empty `targetSectionName`. |
| **500** | Server failure. |

### Post-clone

1. Persist SQLite from **`data.section`** (`risk_assessment_items`; server-authoritative → `pending_sync = 0`, `issynced = 1` as implemented).
2. Refresh **`GET /mobile/risk-assessment/{orderId}/complete-hierarchy`** and invalidate local hierarchy cache.

### Batch sync

**Not required:** dedicated clone endpoint creates server rows in one transaction. Mobile uses **`pending_section_clones`** when offline, then POSTs the same body (including UUID) when online.

### Ops (API host)

Idempotency storage: migration `create_risk_assessment_section_clone_mutation.sql` / table `Risk_Assessment_Section_Clone_Mutation` — see API repo doc.

---

## Mobile implementation (reference)

- **Client:** `api/hierarchy.ts` → `cloneRiskAssessmentSection`; `services/sectionCloneService.ts`; `services/offlineSectionMaterialization.ts` (offline copy + reconcile).
- **Offline:** Prefer **`offline_materialized_section_clones`** + provisional items (work onsite, then sync + remap). **Legacy** `pending_section_clones` may still be drained for older rows. Non-UUID `client_mutation_id` (`cm_*`) may receive **422** until cleared.
- **Optional batch:** `BACKEND_OFFLINE_SECTION_CLONE_SYNC.md`

---

## Swagger / OpenAPI

API: tag **Mobile APIs - Risk Assessment** — `RiskAssessmentSectionCloneRequest`, `RiskAssessmentSectionCloneResponse` (see API `swagger.ts`).
