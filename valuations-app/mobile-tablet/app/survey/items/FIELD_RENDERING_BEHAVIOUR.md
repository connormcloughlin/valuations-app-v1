# Survey Items – Field Rendering Behaviour

This document describes how fields are configured, filtered, and rendered in the survey items flow: from API/config through to `DynamicFieldRenderer` and special cases like comma-separated lists and grouping.

---

## 1. Where field configuration comes from

- **Primary source:** Category configuration is loaded via **ConfigurationService** (`services/configurationService.ts`).
- **API used for order-level config:** `getOrderCategoryFieldConfigurations(orderId)` in `api/hierarchy.ts` calls  
  `GET /mobile/config/order/{orderId}/categories/complete` (transport key: `config.order.categories`). The response is cached and then passed to `configurationService.cacheOrderFieldConfigurations(orderId, configData)`.
- **Alternative path:** Configuration can also come from:
  - Prefetched/SQLite data (e.g. `prefetchService.getCategoryConfigurationByIdFromSQLite(categoryId)`), or
  - The composite endpoint `/mobile/config/category/{riskTemplateCategoryId}/complete` when no cached config exists.
- **Items screen:** `app/survey/items.tsx` calls `fetchFieldConfiguration(categoryId)`, which uses `configurationService.getCategoryConfiguration()`. The returned **visible** fields (`display_on_ui === 1`) are stored as `dynamicFieldConfig` and passed into `PredefinedItemsList` as `dynamicFieldConfig`.

So field configurations are **not** fetched inside `DynamicFieldRenderer` or `PredefinedItemsList`; they are provided from the items screen as `dynamicFieldConfig`.

---

## 2. Field configuration shape (backend → UI)

- Backend field names are mapped to UI field names in **ConfigurationService** (and in `convertPrefetchedConfigToCategoryConfiguration`):

| Backend name | UI `item_fields` |
|--------------|-------------------|
| Description  | description       |
| Model        | model             |
| Qty          | quantity          |
| Price        | price             |
| Location     | room              |
| Notes        | notes             |
| HasPhoto     | photos            |
| ItemPrompt   | type              |

- **Field type** is set as follows:
  - If the API sends `fieldType`, it is used (with overrides below).
  - **Photos:** `item_fields === 'photos'` is always forced to `field_type: 'photo'`.
  - If the API does **not** send `fieldType`, it is inferred by UI field name:
    - `quantity` → `number`
    - `price` → `currency`
    - `notes` → `textarea`
  - **Normalization:** The types `checkbox`, `date`, `percentage`, `email`, and `phone` are normalized to lowercase so the renderer sees a single casing (e.g. `Checkbox` → `checkbox`).
  - Otherwise the type stays as from the API or defaults to `'text'`.
- **Visibility:** `display_on_ui` is set from the API’s `isVisible`: `1` = visible, `0` = hidden.
- **Dropdown options:** `dropdownOptions` are taken directly from the API (`field.dropdownOptions || []`). No extra fetching is done in `processFields`; options are expected in the category/order config response.
- **Multi-select:** `fieldType` values `multiselect`, `multi_select`, or `multiselect_dropdown` are normalised to `multiselect`. Alternatively, `allowsMultipleSelection` / `allows_multiple_selection` or `validationRules` with `allowMultiple` / `multiSelect: true` sets `allows_multiple_selection` on the field (see §6).
- **Radio group:** `radio_group`, `radioGroup`, `radio-group`, `radiogroup`, or `radio` are normalised to **`radio_group`** (see §6.2c).
- **Category metadata:** `CategoryConfiguration` may include:
  - **`sectionName`** — from `sectionName`, `section_name`, `parentSectionName`, or envelope-level section fields on the category/order payload; shown as the **header subtitle** on the items screen (`AppLayout` / `AppHeader`).
  - **`layoutMode`** — Parsed from API for future use; list layout uses fixed **two-fields-per-row** pairing (§7).

### 2.1 `groupingStrategy` normalisation (order API parity)

The order/cached payload sometimes sends `groupingStrategy` in shapes the UI did not previously understand:

- **Numeric keyed object:** e.g. `{ "0": { strategy_type, strategy_config, ... } }` — the service **unwraps** to the inner object (lowest numeric key first).
- **Single-element array:** the first element is used.
- **`strategy_config` as JSON string:** it is **parsed** to an object for `groupingStrategy.strategy_config` and for `parsedStrategyConfig`.

This is applied in **`configurationService`** in:

- Live category fetch → `CategoryConfiguration`
- `getCachedConfiguration` (order pre-cache `parsed.data` shape)
- `convertPrefetchedConfigToCategoryConfiguration`

---

## 3. Which fields are rendered (visibility and grouping)

In **PredefinedItemsList**, for each item the list of fields that actually get a control is computed as follows.

1. **Visible only:** Start from `dynamicFieldConfig` and keep only fields with `display_on_ui === 1`.
2. **Exclude grouping fields:** Remove any field whose `item_fields` is in the “grouping fields” list (see below). This avoids showing an editable field for the same attribute that is already used as the group header.
3. **Sort:** Sort the remaining fields by `display_order`.

So only **visible, non-grouping** fields are passed into `renderField` and then to `DynamicFieldRenderer`.

### Grouping fields (excluded from per-item form when grouping is on)

- **When there is no grouping strategy:** no fields are excluded.
- **New items** (IDs starting with `custom-new-` or `duplicate-`): grouping fields are **not** excluded so the user can set e.g. Room and Item type.
- **Existing items** when a grouping strategy is set:
  - **Single-tier** (by `strategy_type`):
    - `by_type` → exclude `type` (ItemPrompt)
    - `by_location` → exclude `room` (Location)
    - `by_brand` → exclude `model` (Model)
    - `by_value_range` → exclude `price` (Price)
  - **Two-tier** (when `strategy_config` has `primary_group` and `secondary_group`): both primary and secondary are resolved via the same mapping (ItemPrompt→type, Location→room, Model→model, Price→price) and those `item_fields` are excluded.

So the same field config can define e.g. `room`, but if the category is grouped by location, `room` will not be rendered as an editable field for existing items.

---

## 4. Display-only vs input for the field prompt (type / ItemPrompt)

The app decides whether the **field prompt** (Item Type / `type` / ItemPrompt) is **display-only** (read-only text) or an **input** (editable) using two things: **presence of a grouping strategy** and **new vs existing item**.

### 4.1 When there is **no** grouping strategy

- In the dynamic field rows, the field with `item_fields === 'type'` or `'ItemPrompt'` is **never** rendered as an input. It is rendered as **display-only**: a bold `<Text>` showing the current value (`currentValue`). No `DynamicFieldRenderer` is used for that field.
- **All other fields** use a **visible label** (`field.field_label` + `:`) and `DynamicFieldRenderer` with `hideLabel={true}`. Layout: label and control are in a **horizontal row** (label ~38% width on the left, control flexes on the right—web table parity) for **both grouped and non-grouped** templates; **notes/textarea** use **top-aligned** labels in that row. The only exception is the **non-grouped item prompt** row (`type` / `ItemPrompt`), which stays a **bold full-width title** with no side-by-side control.

So with no grouping, the type prompt is display-only in the grid; other fields are **labeled** inputs (web parity for flat templates such as Header Info).

### 4.2 When there **is** a grouping strategy

- **Existing items:** The grouping field (e.g. `type` for `by_type`, `room` for `by_location`) is **excluded** from the per-item form by `getGroupingFields()`. So it does **not** appear in the field rows at all. Its value is shown only in the **group header** (e.g. section title). Effectively display-only for that item.
- **New items** (IDs starting with `custom-new-` or `duplicate-`): Grouping fields are **not** excluded (`getGroupingFields()` returns `[]`). So the type (and other grouping fields) **are** in the list of visible fields and are rendered as **full inputs** via `DynamicFieldRenderer` (with label). The user can set Item Type, Room, etc. for the new entry.

So: with grouping, the field prompt is **input on new entries** (so the user can set it) and **display-only for existing entries** (value only in the group header, no input in the row).

### 4.3 New items: dedicated “Item Type (Required)” row

- For **new items only** (`item.id` starts with `custom-new-`), a **separate row** is rendered at the top of the item card: label **“Item Type (Required):”** and a **`PaperTextInput`** for `type`. This is always an **input**, independent of grouping.
- The dynamic field rows (from `visibleFields` / `fieldRows`) are rendered below. So for a new item with no grouping, type can also appear in those rows as **display-only** (bold text) as in 4.1; with grouping, type appears in the rows as an input (DynamicFieldRenderer) as in 4.2.

**Summary**

| Scenario | Type / ItemPrompt in field rows | Type elsewhere |
|----------|---------------------------------|----------------|
| No grouping, any item | Display-only (bold text) | — |
| Grouping, **existing** item | Not rendered (excluded; value in group header) | — |
| Grouping, **new** item | Input (DynamicFieldRenderer) | — |
| **New** item (any) | As above | Top row: “Item Type (Required)” is always an input (`PaperTextInput`) |

So “display only” is determined by: (1) no grouping → type/ItemPrompt in rows is display-only; (2) grouping + existing item → grouping field not in rows (display in header); (3) grouping + new item → grouping field in rows is input; (4) new items always get the extra Item Type input at the top.

---

## 5. Comma-separated list and `selectedanswer` (dropdown from item data)

- Each **item** can have a property **`commaseparatedlist`** (string). This is **per item**, not from the global field config.
- In **PredefinedItemsList**, inside `renderField`, when the field being rendered is **`selectedanswer`** and the current item has a non-empty `item.commaseparatedlist`:
  1. The string is split on commas, trimmed, and empty entries are removed.
  2. These values are turned into **dropdown options** with `option_value` and `option_label` set to the same string, `is_active: true`, and sorted alphabetically by label.
  3. The field passed to `DynamicFieldRenderer` is **replaced** for that item with an **enhanced** field object: same as the original config but with:
     - `dropdownOptions` = these derived options
     - `field_type` = **`'multiselect'`** if any of: `field.allows_multiple_selection`, `item.multiSelectAnswer`, or `item.multiSelectSelectedAnswer === true` (string `"true"` accepted); otherwise **`'dropdown'`**.

So:

- If **no** `commaseparatedlist`**:** the `selectedanswer` field is rendered with whatever is in `dynamicFieldConfig` (e.g. text, dropdown, or multiselect if the API already provided `dropdownOptions` and flags).
- If **`commaseparatedlist` is present:** for that item only, `selectedanswer` uses those options as either a **single-select modal dropdown** or a **multi-select checkbox list** (comma-separated `selectedanswer` value), per the flags above.

This only applies to the **`selectedanswer`** field; no other field type is driven by `commaseparatedlist` in this way.

---

## 6. How each field type is rendered (`DynamicFieldRenderer`)

- **Visibility:** If `field.display_on_ui === 0`, the component returns `null` and nothing is rendered.
- **Control choice** is based on `field.field_type` and on whether `dropdownOptions` exist. Logic below.

### 6.1 Photo

- **When:** `field_type === 'photo'` or (`item_fields === 'photos'` and `itemId` and `onTakePhoto` are provided).
- **Behaviour:** Renders the photo button/count UI; no text input. Does not use `dropdownOptions`.

### 6.2 Dropdown

- **When:** `field_type === 'dropdown'`.
- **If `allows_multiple_selection` is true** and `dropdownOptions` is non-empty: behaves like **§6.2b Multiselect** (checkbox list; value is comma-separated `option_value`s).
- **If `dropdownOptions` is missing or empty:** Renders as a **text field** (same as `field_type === 'text'`).
- **Otherwise:** Renders **ModalDropdown**: a touchable that opens a modal list of options (sorted alphabetically by `option_label`). Selection writes one `option_value` into the field value; `onChange(fieldName, value)` is called with that value.

So a config with `field_type: 'dropdown'` but no options is effectively rendered as text.

### 6.2b Multiselect

- **When:** `field_type === 'multiselect'`, or `field_type === 'dropdown'` with `allows_multiple_selection` and options.
- **If `dropdownOptions` is missing or empty:** Renders as a **text field**.
- **Otherwise:** Renders a scrollable list of rows with checkboxes; toggling adds/removes `option_value` from the stored string, which is **comma-separated** (no spaces required; join uses `", "`). Same `onChange` / immediate save path as single-select `selectedanswer`.

### 6.2c Radio group

- **When:** `field_type === 'radio_group'` (API may send `radioGroup`, `radio-group`, or `radio`; **ConfigurationService** maps to `radio_group`).
- **If `dropdownOptions` is missing or empty:** Renders as a **text field**.
- **Otherwise:** Renders a **vertical list** of tappable rows with radio icons (`radiobox-marked` / `radiobox-blank`); one `option_value` stored at a time. `onBlur` runs after selection (same pattern as other pickers). **Validation** uses the same rules as **dropdown** (value must be one of active options; `is_active !== false`).

### 6.3 Combobox / auto_suggest / auto_suggest_box

- **When:** `field_type === 'combobox'`, `'auto_suggest'`, or `'auto_suggest_box'`. The last two are implemented by calling the same logic as combobox.
- **If `dropdownOptions` is missing or empty:** Renders as a **text field**.
- **Otherwise:** Renders a text input plus a list of suggestions filtered by what the user types; options are sorted alphabetically by `option_label`. Choosing a suggestion sets the value to that option’s `option_value`.

### 6.4 Location group

- **When:** `field_type === 'location_group'`.
- **If `dropdownOptions` is missing or empty:** Renders as a **text field**.
- **Otherwise:** Renders a grid of buttons (room/location options), with `option_label` on each button and `option_value` as the stored value. Options with `is_active === false` are filtered out; the rest are sorted by `option_label`.

### 6.5 Text, textarea, number, currency

- **When:** `field_type === 'text'`, `'textarea'`, `'number'`, or `'currency'`.
- **Behaviour:** Single-line text input (text), multiline (textarea), numeric keyboard (number), or currency with “R” prefix (currency). No use of `dropdownOptions`.

### 6.6 Unknown or missing `field_type`

- **When:** Any other or missing `field_type` (e.g. from API).
- **Behaviour:** A message is logged and the field is rendered as a **text field**.

---

## 7. Layout of fields in the list (rows)

- Visible (non-grouping) fields are sorted by **`display_order`**, then a **tie-break** so **`quantity` → `selectedanswer` → `notes`** when orders match (so **SelectedAnswer + Notes** bundle below works), then alphabetical by `item_fields`.
- **`selectedanswer` immediately followed by `notes`** in that list is rendered as one **bundle** (web-style): label for the answer field on the left; on the right, the answer control with a **comment icon**, then a **grey callout** under the control with a small **upward caret**, multiline **Notes…** input, and validation error under the box. **`notes` without an adjacent preceding `selectedanswer`** uses the same grey callout + **icon to the right** of the box.
- They are chunked **two fields per row** (sequential pairs). Each cell is **label left | control right** (`dynamicFieldRowSideBySide`). **Notes/textarea** can share a row with another field (e.g. SelectedAnswer + Notes), matching a compact web-style grid.
- A **trailing odd field** occupies a row alone and still grows with `flex: 1` (effectively half row width unless you add a full-width style later).
- **`layoutMode` / `inline_row`** on `CategoryConfiguration` is still accepted from the API but **no longer changes** this list layout (pairing is always used).

---

## 8. Validation

- **ValidationService** (`services/validationService.ts`) only runs for fields with `display_on_ui === 1`.
- It validates by **field_type** and **required**:
  - **Required:** Empty value (after trimming for strings) produces a “is required” error.
  - **number:** Checks numeric format and optional min/max from `validation_rules`.
  - **dropdown:** If value is non-empty, checks that it exists in `field.dropdownOptions` (by `option_value`).
- Other types (text, textarea, currency, etc.) have no extra validation beyond required.

---

## 9. Summary table

| Aspect | Behaviour |
|--------|-----------|
| **Config source** | Category config from ConfigurationService (order categories complete API or prefetch/SQLite); items screen passes `dynamicFieldConfig`. |
| **Visibility** | Only fields with `display_on_ui === 1` are considered; then grouping fields are excluded for existing items. |
| **Dropdown from API** | `field_type === 'dropdown'` + non-empty `dropdownOptions` → modal dropdown. No options → text field. |
| **Radio group** | `field_type === 'radio_group'` + `dropdownOptions` → vertical radio list; validated like dropdown. No options → text field. |
| **Comma-separated list** | Only for **`selectedanswer`**: if item has `commaseparatedlist`, options are parsed from it; field becomes `dropdown` or `multiselect` per item/API flags; value stored in `selectedanswer` (comma-separated for multi). |
| **Grouping strategy** | Normalised from `{ "0": {...} }`, arrays, and string `strategy_config` in **ConfigurationService**. |
| **Header subtitle** | `categoryConfig.sectionName` when provided by API. |
| **Field rows** | Two fields per row (sequential pairs); each field is label-left + control. |
| **Multi-select answer** | `multiselect` type, `allows_multiple_selection`, or item `multiSelectAnswer` + `commaseparatedlist`. |
| **Combobox / auto_suggest** | Same as dropdown: needs `dropdownOptions`; otherwise falls back to text. |
| **Location group** | Needs `dropdownOptions`; otherwise falls back to text. |
| **Unknown type** | Rendered as text. |
| **Grouping** | By strategy type, one or two of `type` / `room` / `model` / `price` are excluded from the per-item form for existing items. |
| **Field prompt display vs input** | No grouping → type/ItemPrompt in rows is display-only (bold text); **other fields show labels**. Grouping + existing item → grouping field not in rows (value in group header). Grouping + new item → grouping field is input. New items always get a dedicated “Item Type (Required)” input row at the top. |

This describes the full behaviour of how fields become dropdowns (or not), how the comma-delimited field is used, how visibility and grouping affect what is rendered, and how the field prompt is display-only vs input for new and existing entries.

---

## 10. QA checklist (web parity)

| Path | What to verify |
|------|----------------|
| **CONSTRUCTION (~category 140)** | With order config that used to send `groupingStrategy: { "0": { ... } }`, accordions/group headers appear; `strategy_config` string parses; per-item Qty visibility follows `itemFieldConfigs`. |
| **CONSTRUCTION grid** | Pairs follow `display_order` (e.g. Qty + SelectedAnswer, then Notes + …); notes can sit beside another field. |
| **Flooring-style multi** | Item with `commaseparatedlist` + `multiSelectAnswer` (or field `allows_multiple_selection`) stores multiple selections as comma-separated `selectedanswer`; sync still works. |
| **Header Info (~category 73)** | No grouping: item prompt bold; other fields **label left** in a **two-column** pair layout. |
| **Section header** | When category payload includes `sectionName` / parent section fields, subtitle appears under the survey items title. |
