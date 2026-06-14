# Sync Staleness Remediation — Mobile/Tablet App (`valuations-app-v1/mobile-tablet`)

> **Scope of this document:** the Expo / React Native mobile app (expo-sqlite). It is one of three
> coordinated documents. See the identical **Cross-cutting design** section at the bottom for the
> end-to-end fix shared by all three teams.

## Problem statement

A surveyor loads an appointment + its risk assessment on this app (cached into SQLite). Someone then
amends those details in the **web** app. Nothing tells this app the server data changed, so it keeps
showing/working from its stale SQLite copy and never re-pulls from the API.

## 1. How caching / sync works today (mobile)

**Two cache layers:**
- **SQLite** (`expo-sqlite`, DB file `valuations.db`) — the durable working store
  ([utils/db.ts:97](utils/db.ts)). Tables: `appointments`, `risk_assessment_master`,
  `risk_assessment_items`, `media_files`, `category_configurations`
  ([utils/db.ts:285-396](utils/db.ts)). Each main table has a `pending_sync INTEGER DEFAULT 0` flag
  marking locally-edited-but-not-yet-pushed rows.
- **AsyncStorage** ("offlineStorage") — a secondary cache for appointment lists/details used mainly as
  an **offline fallback** ([api/appointments.ts](api/appointments.ts)).

**Read path (online vs cache):**
- Appointment list/detail: when **online**, `getAppointments` / `getAppointmentById` fetch from the
  server and only fall back to AsyncStorage when **offline**
  ([api/appointments.ts:22-159](api/appointments.ts), [:166-202](api/appointments.ts)). So the
  appointment *header* is generally refreshed on load.
- **Risk assessment items/masters: read directly from SQLite**, not the network. Survey screens load
  via `getAllRiskAssessmentItems` / `getAllRiskAssessmentMasters`
  ([app/survey/components/SurveyDataProvider.tsx:458](app/survey/components/SurveyDataProvider.tsx),
  [app/survey/items.tsx:67,263](app/survey/items.tsx),
  [app/survey/summary/hooks/useSurveySummaryData.ts:208](app/survey/summary/hooks/useSurveySummaryData.ts),
  [components/survey/items/dynamic/useItemPersistence.ts:30,68](components/survey/items/dynamic/useItemPersistence.ts)).
  Once items are in SQLite, the UI is driven by SQLite — the API is not consulted for freshness.

**How SQLite gets populated from the server — `prefetchService`:**
- On going online for an appointment, `prefetchService` builds a queue and fetches risk-assessment
  items per category (`/risk-assessment-items/category/:categoryId`
  [services/prefetchService.ts:473](services/prefetchService.ts)) and the order hierarchy, inserting
  into SQLite.
- **Crucially, prefetch short-circuits on a content-blind signature.** The "skip" decision is based on
  a signature of `orderNumber + sorted category IDs` plus per-category **row counts** — not on any
  content hash or modification timestamp:
  - Signature = order + `sortedIds` ([services/prefetchService.ts:622-623](services/prefetchService.ts)).
  - Skip-all when `storedSig === signature && allCategoriesHaveItems`
    ([services/prefetchService.ts:632-638](services/prefetchService.ts)).
  - Per-category skip when SQLite count == payload expected count
    ([services/prefetchService.ts:1016](services/prefetchService.ts)).

**Sync direction — push only:**
- `riskAssessmentSyncService` only **pushes** local `pending_sync = 1` rows up via `api.syncChanges`
  ([services/riskAssessmentSyncService.ts:53,321,531,588](services/riskAssessmentSyncService.ts)).
  There is **no pull** of server-side updates for already-cached entities.
- `syncService.performFullSync` does push-then-`downloadSurveys`, but `downloadSurveys` only refreshes
  the survey **list** via AsyncStorage, not the SQLite risk-assessment rows
  ([services/syncService.js:257-296,303-334](services/syncService.js)).

## 2. This project's contribution to the bug

1. **The pull endpoint is dead code.** `getSyncChanges()` → `GET /sync/changes` is defined
   ([api/sync.ts:44](api/sync.ts)) but **never called anywhere** in the app (verified by full-tree
   search). The app has no consumer of "what changed on the server".
2. **SQLite is treated as source-of-truth once populated.** Survey/assessment screens read from SQLite
   and never re-validate against the server while online.
3. **Prefetch cannot detect in-place edits.** Because the skip logic keys off category-ID set + row
   counts (not content/timestamp), a web amendment that changes a *value* (description, selected
   answer, quantity) without changing the category set or row count is **always skipped** — the data
   is never re-pulled ([services/prefetchService.ts:632-638,1016](services/prefetchService.ts)).

> Confirmed root-cause point **(c)**: the mobile app never calls `/sync/changes` and treats SQLite as
> source-of-truth once loaded.

## 3. Remediation steps (mobile)

Prioritised. Depends on the API maintaining `Sync_Status` (see API doc) and exposing
`GET /sync/changes`.

### A. (Recommended) Add a pull-on-foreground / pull-on-open sync pass
Create a `pullServerChanges` flow that wires up the already-defined `getSyncChanges`:
1. Read `lastSync` from AsyncStorage (per user/device).
2. Call `getSyncChanges({ lastSync, deviceId, entities: ['Appointment','RiskAssessmentMaster','RiskAssessmentItem','MediaFile'] })`
   ([api/sync.ts:44](api/sync.ts)).
3. For each returned change, re-fetch the full entity via existing endpoints (appointment
   with-order; risk-assessment hierarchy / category items) and **upsert** into SQLite using the
   existing helpers (`updateAppointment`/`insertAppointment`,
   `insertRiskAssessmentItem`/`updateRiskAssessmentItem`, `upsertMediaFile`)
   ([utils/db.ts](utils/db.ts)).
4. On a fully successful pass, write the new high-water `lastSync`.

Trigger it from:
- **App foreground** (`AppState` → `active`), and
- **Opening an appointment/assessment** (in `SurveyDataProvider` /
  `prefetchService.startPrefetch`), so the surveyor always sees current data before working.

### B. Respect `pending_sync` to avoid clobbering local edits
In the upsert step, check the local row's `pending_sync`:
- `pending_sync = 0` → overwrite with server data (**server-wins**).
- `pending_sync = 1` → **do not blindly overwrite**. Keep the local edit, mark a conflict (e.g. a
  `conflict` flag / banner), and let the next push reconcile. Never silently discard an unsynced edit.

### C. Make prefetch freshness-aware (so forced refresh actually re-pulls)
The signature/count short-circuit is the reason a re-prefetch won't fix stale rows. Options:
- Have `pullServerChanges` (A) directly upsert changed rows — this bypasses the prefetch skip entirely
  and is the cleanest fix.
- Additionally, incorporate a server `LastModified`/`rowversion` into the prefetch signature or the
  per-category skip check ([services/prefetchService.ts:622,1016](services/prefetchService.ts)) so a
  content change invalidates the cache even when the category set/count is unchanged.

### D. Surface sync state to the user
Add a lightweight "last updated / refreshing" indicator on the appointment + assessment screens, and a
manual "Refresh from server" action that calls `pullServerChanges`. This gives a recovery path while
A–C roll out.

## 4. Effort / risk / migrations

| Item | Effort | Risk | Notes |
|------|--------|------|-------|
| A. `pullServerChanges` + foreground/open triggers | M | Med | Reuses existing `getSyncChanges` + fetch/upsert helpers; main risk is ordering vs in-flight prefetch. |
| B. `pending_sync`-aware upsert / conflict flag | M | Med | Core correctness; must not drop unsynced edits. |
| C. Freshness-aware prefetch | S–M | Low–Med | Either bypass via (A) or add timestamp to signature. |
| D. Sync indicator + manual refresh | S | Low | UX safety net. |

**Migrations:** no SQLite schema change strictly required for A/B. If adding a per-row server
timestamp comparison, consider storing `server_last_modified` on cached rows (additive column via the
existing `migrateDatabase` path [utils/db.ts:511](utils/db.ts)). A `conflict` flag column is optional
but recommended for B.

---

## Cross-cutting design (shared across all three projects)

**Goal:** a web-side amendment must reliably refresh the corresponding rows in the mobile SQLite DB
without clobbering unsynced local edits.

**End-to-end flow (recommended):**
1. **Record the change (API).** Every write endpoint for `Appointment`, `RiskAssessmentMaster`,
   `RiskAssessmentItem`, `MediaFile` calls a shared `recordEntityChange(entity, id, source)` helper
   (wrapping the existing `markEntityAsModified`) that upserts a `Sync_Status` row
   (`LastModified = SYSUTCDATETIME()`, `IsSynced = 0`, `IsDeleted` as appropriate). Centralise it in
   one place (a post-write step in the data layer) so no endpoint is missed, and cover it with a test
   that asserts each write path stamps `Sync_Status`. Because the web app writes **only** through the
   API, the API is the single chokepoint — **no DB triggers required**.
2. **Expose the changes.** `GET /sync/changes?since=<lastSync>&entities=…&excludeDeviceId=<id>`
   returns `{ entityName, entityId, lastModified, isDeleted }` rows from `Sync_Status`.
3. **Mobile pulls.** On app foreground **and** on opening an appointment/assessment, the device calls
   `getSyncChanges({ lastSync })`, then for each changed entity re-fetches the full record via existing
   endpoints and **upserts** it into SQLite. After a successful pass it persists the new high-water
   `lastSync` (per device, in AsyncStorage).
4. **Protect local edits.** Before overwriting a SQLite row, check `pending_sync`. If the local row
   has `pending_sync = 1` (unsynced local edit), do **not** blindly overwrite — flag a conflict
   (see below). Otherwise overwrite (server-wins).

**Conflict handling:**
- **Default: server-wins** for rows with `pending_sync = 0` — simplest and correct for the reported
  scenario (web amends a record the surveyor only viewed).
- **Pending-local-wins / merge** for rows with `pending_sync = 1`: keep the local edit, surface a
  conflict indicator, and let the push reconcile (the API can compare `Version`/`LastModified`).
  At minimum, never silently discard an unsynced local change.

**Where `lastSync` lives:** on the device, in AsyncStorage (e.g. `lastSync_<userId>` or
`lastSync_<deviceId>`), updated only after a fully successful pull+upsert pass so an interrupted sync
re-pulls rather than skips.

**Options compared:**
- **(i) Poll `/sync/changes` on foreground + appointment open** — *Recommended (consumer).* Lowest
  risk, reuses existing endpoint/table, no new infra, works offline-tolerantly. Slight latency (not
  real-time), acceptable for this workflow.
- **(ii) Centralised application-layer change recording in the API write paths** — *Recommended
  (producer).* Every write endpoint calls a shared `recordEntityChange()` / `markEntityAsModified`
  helper that stamps `Sync_Status`. Version-controlled, unit-testable, and observable in normal logs.
  Safe because the web app writes only through the API, so the API is the single chokepoint.
- **(iii) DB triggers maintaining `Sync_Status`** — *Not recommended here.* Although write-source
  agnostic, triggers introduce hidden side effects, are hard to debug, and risk deadlocks / perf
  issues under bulk mobile sync — and the team has had trouble with them in the past. Only reconsider
  if a write path can ever bypass the API.
- **(iv) Push / SignalR invalidation** — Real-time but highest effort/risk (new infra, connection
  management, auth, battery). Defer; can layer on top of (i)+(ii) later if instant refresh is needed.

**Recommendation:** implement **(ii) centralised write-path change recording** (producer) + **(i)
polling on foreground/open** (consumer), with server-wins for clean rows and pending-local-wins for
unsynced rows. This closes the loop with no new infrastructure, no DB triggers, and is the
lowest-risk path that actually fixes the reported bug.
