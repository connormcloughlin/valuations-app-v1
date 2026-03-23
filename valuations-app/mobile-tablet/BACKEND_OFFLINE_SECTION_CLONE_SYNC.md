# Offline materialized section clone — backend contract (optional batch extension)

The mobile app can **copy a section while offline** by:

1. Reading the source section subtree from the **cached** `complete-hierarchy` snapshot for the order.
2. Creating **provisional** category IDs in SQLite in the numeric range **[8×10¹², 9×10¹²)** and **provisional item IDs** (≥ 1.8×10¹²) in `risk_assessment_items` with `pending_sync = 1`.
3. Storing metadata in **`offline_materialized_section_clones`** (`structure_json`, `client_mutation_id`, `local_section_id` = `L-{uuid}`).
4. On sync, calling the **existing** `POST /mobile/risk-assessment/{riskAssessmentId}/sections/clone` with the same **`clientMutationId`** (UUID), then **remapping** provisional SQLite rows to server IDs using the clone response (ordered category/item walk).

No backend change is **required** for the current mobile implementation if the clone endpoint behaves as documented in `BACKEND_SECTION_CLONE_API_SPEC.md` and the API repo `MOBILE_RISK_ASSESSMENT_SECTION_CLONE.md`.

---

## Optional: `POST /sync/batch` extension (`offlineSectionClones[]`)

For **atomic** reconciliation with other entities in one request, the API team may add:

### Request (alongside existing batch fields)

```json
{
  "deviceId": "...",
  "userId": "...",
  "offlineSectionClones": [
    {
      "clientMutationId": "550e8400-e29b-41d4-a716-446655440000",
      "riskAssessmentId": 123,
      "sourceRiskAssessmentSectionId": 456,
      "targetSectionName": "Building (2)",
      "provisionalSectionId": "L-550e8400-e29b-41d4-a716-446655440000",
      "categories": [
        {
          "provisionalCategoryId": 8000000000001,
          "riskTemplateCategoryId": 174,
          "categoryName": "HOUSING CATEGORY",
          "categoryOrder": 1,
          "items": [
            {
              "_localId": 18000000001234,
              "itemprompt": "Region",
              "itemType": 4,
              "rank": 1,
              "commaSeparatedList": "",
              "selectedanswer": "",
              "qty": 0,
              "price": 0
            }
          ]
        }
      ]
    }
  ]
}
```

### Response (suggested)

Under `results` (mirror existing batch shape):

```json
{
  "results": {
    "offlineSectionClones": [
      {
        "clientMutationId": "550e8400-e29b-41d4-a716-446655440000",
        "success": true,
        "section": {
          "provisionalSectionId": "L-550e8400-...",
          "riskAssessmentSectionId": 999001
        },
        "categories": [
          { "provisionalCategoryId": 8000000000001, "riskAssessmentCategoryId": 888001 }
        ],
        "items": [
          { "_localId": 18000000001234, "riskAssessmentItemId": 777001, "riskAssessmentCategoryId": 888001 }
        ]
      }
    ]
  }
}
```

### Rules

- **Idempotency:** Same as clone API — duplicate `clientMutationId` returns the **same** remap without creating duplicate sections.
- **Provisional IDs** are correlation keys only; persisted rows use server IDs.
- **Validation:** Source section must belong to `riskAssessmentId`; structure must match **structure-only** clone rules (no requirement to trust client `items` field values for security-sensitive rules — server may still derive shells from source section).
- After success, **`complete-hierarchy`** must include the new section.

Mobile **today** does not require this batch field; it uses **dedicated clone + client-side remap** after a successful response.

---

## SQLite reference (mobile)

| Table | Role |
|-------|------|
| `offline_materialized_section_clones` | Tracks offline copies until reconcile completes; then row deleted. |
| `risk_assessment_items` | Provisional rows excluded from normal item sync until category IDs leave the provisional range (after remap). |

---

## QA hints

- Offline copy → section appears → categories load → edit items → go online → sync → hierarchy shows server section → SQLite IDs match server → no duplicate sections on retry (same `clientMutationId`).
