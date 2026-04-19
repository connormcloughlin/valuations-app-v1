# Mobile client: gzip response compression

This app aligns with the API contract described in the backend repo:

**Canonical reference:** `valuations-api/api/docs/mobile-response-compression.md` (path in the API repository).

## What the client does

**No manual gunzip.** The stack (Axios on React Native) negotiates compression via `Accept-Encoding` and decompresses the body before JSON is parsed. Application code consumes **normal JavaScript objects** from `response.data`.

Do **not** strip or override `Accept-Encoding` with an empty value. If you set it explicitly anywhere, include at least **`gzip`** (e.g. `gzip, deflate`).

Default request headers for the shared Axios instance are set in [`core/transport/transportClient.ts`](../core/transport/transportClient.ts), including `Accept-Encoding` so compression can be negotiated consistently.

Auth headers from [`core/auth/sessionService.ts`](../core/auth/sessionService.ts) add `Authorization` and `X-User-Context` only; they do not remove encoding negotiation.

## Endpoints that benefit most

Large JSON responses (prefetch / survey):

- `GET /api/mobile/risk-assessment/{orderId}/complete-hierarchy`
- `GET /api/mobile/config/order/{orderId}/categories/complete`
- `GET /api/mobile/config/categories/all/complete` (global catalog)

Other JSON endpoints may also be compressed when the server chooses to.

## Logged `dataSize` (important for profiling)

Successful responses log `dataSize` as **`JSON.stringify(response.data).length`** — that is the **decoded** payload size after automatic decompression, **not** wire bytes. To see transfer savings, inspect **`Content-Encoding: gzip`** and response size in a proxy or the optional dev log line (see below).

## How to verify compression

1. **In development:** After a successful GET to a large `/mobile/` route, look for a line like `[HTTP] … content-encoding=gzip` (only in `__DEV__`).
2. **Proxy tools** (Charles, Proxyman, Flipper, etc.): On a GET, response headers should include **`Content-Encoding: gzip`** when the API compresses. The decoded body in the app matches expected JSON; wire size is smaller.
3. **`HEAD` requests** may not report `Content-Encoding` the same way as **`GET`**; prefer GET when testing.

## Brotli (`br`)

If a CDN in front of the API sends `Content-Encoding: br`, typical clients still decompress automatically. Same rules as gzip.

## If something looks wrong

- **Binary garbage or JSON parse errors:** Something may be reading the raw body before decompression. Use the standard Axios path in `transportClient`, not a low-level client without decompression.
- **No `Content-Encoding: gzip`:** Response may be below the server compression threshold, not compressible, or a proxy stripped headers — coordinate with backend/infra.

## Related

- Prefetch performance and further API ideas: [PREFETCH_BACKEND_API_RECOMMENDATIONS.md](./PREFETCH_BACKEND_API_RECOMMENDATIONS.md)
