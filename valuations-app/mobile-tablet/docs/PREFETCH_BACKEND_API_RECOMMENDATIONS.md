# Prefetch — backend API recommendations (Phase 2+)

These items are **server-side** changes that reduce network time for:

- `GET /mobile/risk-assessment/{orderId}/complete-hierarchy`
- `GET /mobile/config/order/{orderId}/categories/complete`

The mobile client already deduplicates requests and caches responses for 4 hours (`api/hierarchy.ts`).

## 1. Compression (gzip / br)

**Server:** Response compression is implemented and documented in the API repo (`valuations-api/api/docs/mobile-response-compression.md`). Ensure gzip/br is enabled end-to-end (API → reverse proxy → CDN) and proxies do not strip `Content-Encoding`.

**Mobile client:** No manual decompression — Axios/React Native handle negotiation automatically. See **[MOBILE_RESPONSE_COMPRESSION.md](./MOBILE_RESPONSE_COMPRESSION.md)** for client behavior, how to verify `Content-Encoding: gzip`, and why logged `dataSize` is decoded JSON length, not wire bytes.

## 2. Conditional requests (ETag / If-None-Match)

- Emit `ETag` (or `Last-Modified`) derived from contributing row versions (e.g. max `updated_at`).
- Honour `If-None-Match` / `If-Modified-Since` with **304 Not Modified** and empty body when unchanged.
- Once available, the mobile client can send conditional headers on repeat loads within the cache window.

## 3. Trim payload fields

- Mobile prefetch maps item fields in `mapItemPayloadToSqlite` (`services/prefetchService.ts`) and reads embedded items from `items` / `Items` / `riskAssessmentItems` only.
- Omit display-only / audit-only / duplicate blobs from the **mobile** routes to shrink JSON (target: materially smaller than ~1.6 MB raw for large orders).

## 4. Optional: `?include=items` on complete-hierarchy

- Allow a **structure-only** response (sections/categories without item arrays) for fast first paint, with a follow-up call for items if needed.

## 5. Longer-term: single bootstrap endpoint

- `GET /mobile/order/{orderId}/bootstrap` returning `{ hierarchy, fieldConfig }` saves one round-trip vs two parallel calls.

---

## Verification (manual)

After mobile Phase 2 bulk insert:

1. Cold prefetch: expect **one** log line `✅ Bulk batch insert completed in …ms (N items)` with large `N`, and `📦 PREFETCH SUMMARY … elapsedMs=` dominated by network + one SQLite transaction, not 100+ per-category inserts.
2. Re-open same appointment: expect `✅ Prefetch signature match` when applicable and short `elapsedMs`.
3. After backend compression/ETag: confirm `Content-Encoding` / `304` in proxy or API logs.
