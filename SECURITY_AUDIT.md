# SECURITY AUDIT (CODE-DERIVED)

Scope: Mobile client (`valuations-app/mobile-tablet`) runtime & data-layer security posture. Evidence strictly from code review: `api/client.js`, `api/enhancedClient.js`, `api/index.ts`, `api/auth.js`, `context/AuthContext.tsx`, `constants/apiConfig.ts`, `utils/offlineStorage.ts`, `utils/db.ts`, `utils/apiRequestManager.ts`, risk template & sync modules. No existing docs consulted.

---
## 1. Authentication & Session Handling
| Aspect | Observed | Risk | Notes |
|--------|----------|------|-------|
| Modes | Hard‑forced API key mode (`isApiKeyMode() => true`) while JWT code remains | Stale conditional paths & false sense of multi-mode support | JWT refresh logic present but effectively unreachable. |
| API Key Exposure | API key read from `expoConfig.extra.apiKey` without obfuscation | Key embedded in app build → easy extraction | No dynamic rotation or key derivation. |
| User Context Header | JSON serialized full user object in `X-User-Context` | Potential PII leakage & header bloat | No hashing/minification. |
| Token Handling (JWT path) | In-memory cache + AsyncStorage; no signature verification | Accepting unverified JWT enables tampering risk if ever re-enabled | `decodeJWT` uses `atob` only. |
| Token Expiry Enforcement | Client-side exp claim check only (JWT) | Replay window if clock skew exploited | No NTP sync / leeway logic. |
| Azure AD Flow (loginWithAzure) | Stores Azure access token in AsyncStorage plain text | Token theft on compromised device | No secure storage (Keychain/EncryptedStorage). |
| Session Validation | `/auth/verify` used; fallback accepts client validation silently | Weak server trust anchor | Attackers could bypass verify if endpoint unreachable. |
| Logout | Removes tokens & context, leaves SQLite data intact | Residual sensitive data exposure | No secure purge of cached domain data. |
| Token Exchange | Temporarily overwrites Authorization header globally | Race conditions with concurrent calls | Should isolate per request. |

---
## 2. Transport & Network Security
| Aspect | Observed | Risk | Notes |
|--------|----------|------|-------|
| Protocol | All base URLs HTTPS | OK | Assumes valid certificates, no pinning. |
| Certificate Pinning | Not implemented | MiTM possible on compromised networks | Consider `react-native-cert-pinner` alternative for Expo-ejected only. |
| Retry Logic | Retries on network & 5xx; exponential/backoff (enhanced)/linear (legacy) | Request storm amplification under outage | Add jitter + cap concurrency per host. |
| Circuit Breaker | Domain grouping naive (splits by first path segment) | Over-broad or under isolation | Could suppress healthy endpoints if shared segment fails. |
| Error Normalization | 404→empty via substring heuristic | Data integrity & silent failure | Attackers could craft chosen error messages to mask issues. |
| Sensitive Logging | User email, file names, token length, item counts logged | PII leakage in logs | No log level gating / redaction. |

---
## 3. Data Storage & Persistence
| Layer | Observed | Risk | Notes |
|-------|----------|------|-------|
| AsyncStorage | Stores: authToken, azureToken, userData, userContext, cached API payloads | Plaintext accessible on rooted/jailbroken devices | Use secure storage abstraction + minimal token scope. |
| SQLite | Stores appointments, risk assessments, media metadata, category config | Potential sensitive business data at rest unencrypted | Consider SQLCipher or OS encrypted storage. |
| Media Handling | Base64 data posted; local `LocalPath` optional; no checksum | Tampering & integrity risk | Add hashing (SHA-256) & signature if high-value. |
| Offline Cache TTL | Mixed TTL/none; fallback caching indefinite | Stale sensitive data linger | Centralize expiry policy. |
| Deleted Items | Soft delete flags retained until sync | Residual data exposure if device lost | Secure wipe after confirmed sync. |

---
## 4. Input / Response Validation
| Aspect | Observed | Risk | Notes |
|--------|----------|------|-------|
| Schema Validation | None before caching or DB insert | Poisoned cache / injection vectors | Attackers can craft oversized or malicious payload fields. |
| SQL Interaction | Parameterized inserts/updates generally used | OK for injection | Some dynamic queries (DELETE IN (...)) built with placeholders correctly. |
| Size Limits | No explicit max on arrays or strings before persisting | Memory pressure / DoS risk | Add guardrails & truncation. |
| Media Upload | No file size/type enforcement client-side beyond MIME heuristic | Oversized upload attempts | Add size & type whitelist policy. |

---
## 5. Authorization (App-Level)
| Aspect | Observed | Risk | Notes |
|--------|----------|------|-------|
| Role/Scope Handling | None in client (no claims-based gating) | Over-permission access | Relying solely on server. |
| Endpoint Access Controls | Uniform header injection only | Lack of least-privilege abstraction | Could accidentally leak admin endpoints if added. |
| Data Filtering | Client fetches broad datasets, filters locally | Excess exposure & enumeration risk | Narrow queries + server-side filtering. |

---
## 6. Secrets & Configuration
| Aspect | Observed | Risk | Notes |
|--------|----------|------|-------|
| API Key in Build | Present in static bundle | Reverse engineering exposure | Use per-user tokens or ephemeral session keys. |
| Environment Loading | `Constants.expoConfig.extra` fallback chain | Misconfiguration leak | Validate required keys on boot with fail-fast. |
| Key Rotation | No mechanism | Long-lived credential risk | Automate rotate + invalidation. |

---
## 7. Logging & Monitoring
| Aspect | Observed | Risk | Notes |
|--------|----------|------|-------|
| Verbosity | Extensive console logs including PII & domain data | Privacy & compliance breach | Introduce structured + redaction. |
| Anomaly Detection | None | Breach undetected | Add telemetry events for auth failures, fallback spikes. |
| Security Metrics | Not captured | Blind spots | Track token refresh failures, cache hits, 404 reinterpret counts. |

---
## 8. Threat Model Snapshot
| Vector | Likelihood | Impact | Notes |
|--------|-----------|--------|------|
| Extract API key from bundle | High | Medium | Grants backend access if IP not restricted. |
| Device theft → token + cached data access | Medium | High | No encryption / wipe control. |
| MiTM (captive portal) modifies 404 body text | Low-Med | Medium | 404 substring -> empty hides tampering. |
| Log exfiltration (debug build distributed) | Medium | Medium | Contains emails & structural info. |
| Cache poisoning (malformed large payload) | Low | High | No size or schema validation. |

---
## 9. Prioritized Findings (SEC-*)
| ID | Finding | Risk | Priority |
|----|---------|------|----------|
| SEC-01 | Hard-coded API key auth with no rotation & exposed in build | High | P1 |
| SEC-02 | Tokens & user context stored in plaintext AsyncStorage | High | P1 |
| SEC-03 | No response schema validation before persistence | High | P1 |
| SEC-04 | 404→empty substring heuristic enabling silent data masking | Medium | P2 |
| SEC-05 | JWT path retains insecure `atob` decode (no signature) | Medium | P2 |
| SEC-06 | Verbose PII logging (emails, file metadata) | Medium | P2 |
| SEC-07 | Lack of secure deletion / residual data after logout | Medium | P2 |
| SEC-08 | No file size/type validation for media uploads | Medium | P3 |
| SEC-09 | Weak circuit breaker grouping could hide targeted failures | Low | P3 |
| SEC-10 | No certificate pinning or network integrity checks | Low | P3 |

---
## 10. Recommendations (SEC-REC)
ID | Recommendation | Addresses | Effort | Impact
- SEC-REC-01 Replace static API key mode with short-lived bearer tokens (device attested) or signed requests; implement rotation endpoint. | SEC-01 | High | High
- SEC-REC-02 Migrate secret & token storage to secure storage (e.g., `expo-secure-store` or platform Keychain) with fallback warnings. | SEC-02 | Med | High
- SEC-REC-03 Add schema & size validation (zod) before cache/store; reject + log anomalies. | SEC-03 | Med | High
- SEC-REC-04 Centralize controlled 404 handling; remove message substring logic—require explicit backend code or 204. | SEC-04 | Low | Med
- SEC-REC-05 Remove or hard-disable JWT legacy code until full signature verification & key rotation implemented. | SEC-05 | Low | Med
- SEC-REC-06 Introduce structured logger: redact emails, token hints, remove base64 size except hashed checksum; add log levels. | SEC-06 | Med | Med
- SEC-REC-07 On logout & critical auth failure, securely clear sensitive SQLite rows + AsyncStorage keys (shredding strategy). | SEC-07 | Med | Med
- SEC-REC-08 Enforce media constraints (max size, allowed MIME, checksum) pre-upload. | SEC-08 | Low | Med
- SEC-REC-09 Improve circuit breaker keying (host + two segments) & emit security anomaly events. | SEC-09 | Low | Low
- SEC-REC-10 Optional: Implement SSL pinning (post-EAS build) & network trust score (NetInfo + DNS). | SEC-10 | High | Med
- SEC-REC-11 Add config bootstrap validator (fail-fast if required keys absent, no silent fallback). | SEC-01 | Low | High
- SEC-REC-12 Introduce data retention policy TTL & auto purge for stale sensitive caches. | SEC-02,07 | Med | Med

---
## 11. Phased Remediation Plan
Phase 0 (Hardening Quick Wins – 1 Sprint):
1. Remove substring 404 heuristic -> explicit error mapping util.
2. Add bootstrap validator for required config (API base URL, key/token strategy flag).
3. Introduce structured logger & redact PII.
4. Lock out dormant JWT code path (feature flag guard) until secure.

Phase 1 (Core Security Posture – 1–2 Sprints):
5. Secure storage migration for tokens & userContext.
6. Schema & payload size validation before persistence.
7. Media upload constraints + checksum logging.
8. Unified circuit breaker key grouping update.

Phase 2 (Credential Strategy Overhaul – 2 Sprints):
9. Replace static API key with per-device ephemeral token exchange (signed with backend-issued secret, refresh ≤24h).
10. Implement rotation & invalidate old tokens on logout.
11. Start emitting telemetry for auth failures & fallback counts.

Phase 3 (Advanced Hardening – Ongoing):
12. Optional certificate pinning + network trust scoring.
13. Add encrypted local DB solution or field-level encryption for highly sensitive columns.
14. Wipe residual stale data via rolling purge job (app start + interval).

---
## 12. Security Test Cases (Minimal Set)
| Case | Scenario | Expected |
|------|----------|----------|
| ST-01 | Simulate 404 with crafted message not on whitelist | Not transformed to empty success |
| ST-02 | Oversized JSON payload (> configured max) | Rejected before cache |
| ST-03 | Logout then inspect storage keys | Tokens & context removed + sensitive tables truncated |
| ST-04 | Force offline then replay expired token | Denied; no silent acceptance |
| ST-05 | Media upload with disallowed MIME | Client-side blocked | 

---
## 13. Metrics to Track After Fixes
- Token rotation rate & token age distribution.
- 404 reinterpret count (should → 0).
- Validation rejection count (schema/size).
- Secure storage adoption (% tokens not in AsyncStorage).
- PII log leakage count (automated grep pipeline).
- Average fallback variant usage (post registry unification).

---
## 14. Summary
Current security posture reflects evolutionary layering: static API key reliance, permissive caching, verbose logs, and absence of schema validation or secure storage. Immediate gains: remove brittle 404 heuristics, secure token persistence, centralize validation & logging. Strategic uplift centers on credential lifecycle modernization (ephemeral tokens) and adding structured telemetry to shift from reactive to observable security.

Prepared solely from code; no external docs referenced.
