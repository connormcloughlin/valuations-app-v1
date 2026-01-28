# CODE STRUCTURE & MAINTAINABILITY AUDIT (CODE-DERIVED)

Scope: Project organization, modularity, layering, typing discipline, test surface, dependency hygiene for `valuations-app/mobile-tablet`. Evidence from live source tree, `package.json`, `tsconfig.json`, representative modules previously analyzed (API, context, utils, services, components). No existing docs consulted.

---
## 1. Directory Topography Snapshot
```
mobile-tablet/
  api/            (Multiple clients + domain wrappers)
  app/            (Expo Router routes/layouts)
  components/     (UI primitives, dashboard, sync indicators)
  constants/      (Runtime config & static keys)
  context/        (Auth context, likely others)
  hooks/          (Custom hooks – not fully inspected here)
  services/       (Azure AD, possibly future abstraction points)
  utils/          (db, storage, network, request manager, formatting)
  tests/ & test-* scripts (ad hoc integration scripts)
  src/            (Legacy or transitional folder - potential duplication)
  types/          (Global TS type declarations)
  dist/           (Built artifacts) 
```
Observation: Coexistence of both `src/` and top-level domain folders suggests incremental refactor; risk of drift & duplicate assets.

---
## 2. Layering & Boundaries
| Layer | Current State | Issues | Suggested Target |
|-------|---------------|--------|------------------|
| Presentation (app/, components/) | Mix of feature-specific & generic UI; some business logic leaking into components (e.g., connectivity logging embedded in status widgets). | Tight coupling of UI & fetch triggers; limited separation for testing. | Adopt feature module pattern: `features/<domain>/{components,hooks,state}`. |
| State / Context | AuthContext handles auth + DB init + retry loops. | Context overburdened (lifecycle, storage, network fallback). | Split into `AuthSessionContext`, `AppBootstrapContext`. |
| Data Access / API | Multiple clients (legacy axios, enhanced client, index.ts aggregator) plus ad hoc domain modules. | Redundancy; no central contract registry; inconsistent response shapes. | Single `transport/` + per-domain `repositories/`. |
| Offline / Persistence | `utils/db.ts`, `offlineStorage.ts`, plus scattered AsyncStorage fallback logic. | Mixed responsibilities (schema creation, performance tests, batch perf in same file). | Restructure into `persistence/{db,offlineCache,schemas}`. |
| Sync & Background | Sync logic embedded inside API aggregator & database utilities. | Hidden complexity; hard to test independently. | Extract `sync/` orchestrator with explicit interfaces. |
| Cross-cutting (logging, error normalization) | Console scattered; heuristics repeated. | No consistent interface; low testability. | Introduce `infrastructure/logging`, `infrastructure/errors`. |

---
## 3. Typing & Type Safety
| Aspect | Observed | Risk | Recommendation |
|--------|----------|------|----------------|
| TS Coverage | Mix of TS (`.ts/.tsx`) & JS in critical API modules. | Runtime-only issues undetected. | Incremental migration with strict mode + domain type modules. |
| Global Types | Some interfaces defined in `db.ts` not exported centrally. | Duplicated shape redefinitions likely elsewhere. | Move data models into `types/domain/*.ts`. |
| Runtime Validation | None before persistence or caching. | Silent data drift. | zod schemas per endpoint + thin validator middleware. |
| Path Aliasing | Only `@/*` generic alias. | Ambiguous imports; flat namespace. | Domain-scoped aliases: `@api/*`, `@features/*`, etc. |

---
## 4. Coupling & Cohesion
| Example | Coupling Issue | Impact | Refactor Direction |
|---------|---------------|--------|--------------------|
| `AuthContext` -> DB initialize + token validation + Azure flows | Multi-domain concerns | Hard to isolate auth tests | Split responsibilities, inject services. |
| `db.ts` includes perf tests & CRUD & migrations | Low cohesion | Increases cognitive load | Separate `db/migrations.ts`, `db/perfTest.ts`, `db/repositories/*.ts`. |
| Media upload logic sits with risk template functions in `index.ts` | Horizontal sprawl | Hard to find relevant code | Create `mediaRepository.ts`. |
| Fallback logic inside domain fetch functions | Algorithm + orchestration collision | Reduces readability | Strategy object / policy registry. |

---
## 5. Complexity Hotspots (Qualitative)
| Area | Signals |
|------|---------|
| `db.ts` | >1000 lines responsibilities: open/init, migrations, CRUD, perf benchmarking, sync helpers, batch logic, test utilities. |
| `api/index.ts` | Monolithic aggregator with overlapping endpoints, offline caching duplication, media & sync mixture. |
| `AuthContext.tsx` | Sprawling initialization chain (DB + retries + token decode + fallback acceptance). |
| Risk Template Module | Multi-endpoint fallback arrays + caching side-effects inline. |

---
## 6. Testing & Observability
| Aspect | Observed | Gaps |
|--------|----------|------|
| Formal Unit Tests | Minimal evidence (presence of `__tests__` folder but not enumerated here). | Missing per-service tests; logic mostly side-effect heavy. |
| Integration Scripts | Many ad hoc `test-*.js` at root of mobile-tablet. | Not automated in CI; unstructured asserts. |
| Logging | Console prints with emojis; environment gating inconsistent. | Lacks structured levels & correlation IDs. |
| Metrics | Manual timing in batch insert; no global instrumentation. | Introduce metrics adapter (timers, counters). |

---
## 7. Dependency Hygiene
| Dependency | Note | Action |
|-----------|------|--------|
| Multiple Navigation libs | Standard React Navigation stack ok. | No action. |
| Expo SDK 53 + RN 0.79 | Current; ensure alignment with secure modules. | Monitor upgrade path. |
| `metro` pinned in deps (not devDep) | Potentially inflates production bundle context. | Move to devDependencies. |
| Lack of lint toolchain packages | No eslint/prettier listed. | Add standardized lint/format pipeline. |
| No test runner config (jest) visible | React-test-renderer only. | Add jest + coverage reporting. |

---
## 8. Structural Anti-Patterns
| Anti-Pattern | Evidence | Risk | Fix |
|--------------|---------|------|-----|
| God Modules | `db.ts`, `api/index.ts`, `AuthContext.tsx` | Hard to test & evolve | Decompose into focused files. |
| Stringly-Typed Endpoints | Scattered path literals | Typos & drift | Central endpoint registry (enum). |
| Inline Fallback Arrays | Risk templates | Mutable hidden contract complexity | Policy configuration object. |
| Side-Effectful Imports | Some modules log & mutate on import (env debug). | Order dependency | Guard side-effects; export init functions. |
| Mixed JS/TS for Core Logic | API modules partly JS | Type drift | Convert critical path first (auth, transport, persistence). |

---
## 9. Recommended Target Architecture (Concise)
```
mobile-tablet/
  app/ (routes)
  features/
    appointments/
      components/
      hooks/
      repository.ts
      types.ts
    riskAssessments/
    media/
  core/
    transport/ (single client, policies, interceptors)
    auth/ (session service, context slim)
    persistence/
      db/
        migrations.ts
        connection.ts
        repositories/*.ts
      offlineCache/
    logging/
    config/
  shared/
    components/
    hooks/
    utils/
    types/
  tests/
```
Key principles: Feature first, vertical slicing; core provides shared runtime services; no business logic in core.

---
## 10. Migration Phases
Phase 0 (Prep):
- Introduce `core/transport` + `core/auth` service wrappers (facade only).
- Add endpoint registry & path enums.
- Add ESLint + Prettier + basic formatting script.

Phase 1 (Decouple):
- Extract DB connection + migrations from `db.ts` into `persistence/db/`.
- Move CRUD sets into repository files per entity.
- Replace imports to new repositories (facade shim keeps old exports temporarily).

Phase 2 (Feature Modules):
- Create `features/appointments` & `features/riskAssessments` structure; relocate UI + repository usage.
- Introduce domain hooks (e.g., `useAppointmentsList` encapsulating fetch + caching + normalization).

Phase 3 (Cleanup & Hardening):
- Remove deprecated legacy API clients (`client.js`, large parts of `api/index.ts`).
- Delete fallback arrays post instrumentation metrics.
- Enforce path import restrictions via lint rule (no deep relative into core internals).

Phase 4 (Optimization):
- Introduce memoized selectors / react-query (or lightweight cache) if needed.
- Add codegen for types (OpenAPI) feeding zod validators.

---
## 11. Concrete Refactor Tickets (CS-*)
| ID | Ticket | Rationale | Effort |
|----|--------|-----------|--------|
| CS-01 | Create `core/transport` & unify clients | Reduces redundancy | Med |
| CS-02 | Extract DB connection + migrations | Decrease module weight | Med |
| CS-03 | Introduce endpoint registry + enums | Prevent typos, central metadata | Low |
| CS-04 | Decompose `AuthContext` into session + bootstrap | Single responsibility | Med |
| CS-05 | Move repository logic out of UI components | Testability | Med |
| CS-06 | Add ESLint + Prettier config & CI step | Consistency | Low |
| CS-07 | Migrate high-churn API modules to TS | Type safety | Med |
| CS-08 | Implement schema validation layer | Data integrity | Med |
| CS-09 | Replace ad hoc test scripts with Jest suites | Automation | Med |
| CS-10 | Introduce logging service (levels, redaction) | Observability | Low |
| CS-11 | Split `db.ts` perf tests into separate script | Clarity | Low |
| CS-12 | Feature folderization for appointments & risk | Cohesion & discovery | High |

---
## 12. Quality & Tooling Enhancements
| Area | Recommendation |
|------|---------------|
| Linting | Add `.eslintrc.cjs` with TypeScript + import/order + unused vars rules. |
| Formatting | Prettier + enforce via pre-commit hook (lint-staged + husky). |
| Testing | Add Jest config; snapshot for UI primitives; integration tests for repositories against in-memory mock DB. |
| CI | Add GitHub Action: install, type-check, lint, test, bundle size diff. |
| Documentation | Auto-generate dependency graph (madge) and module size report in CI artifact. |

---
## 13. Metrics for Ongoing Structural Health
- Avg lines per module (target < 400 for non-aggregated logic files).
- Percentage of API calls going through unified transport (target 100%).
- Type coverage (% files .ts/.tsx) (target >90%).
- ESLint error count (target 0 blocking).
- Test coverage (line/function) incremental baseline + +10% per sprint.

---
## 14. Fast Wins (Next 48h)
1. Add endpoint registry file + refactor two endpoints to use it.
2. Extract `decodeJWT` + token logic into `core/auth/session.ts` (even if API key mode only) to shrink `AuthContext`.
3. Create `repositories/appointmentsRepository.ts` moving CRUD callers (wrap existing DB functions).
4. Add ESLint config + script in `package.json` (no code changes needed for logic).
5. Introduce `logging.ts` with wrapper (console passthrough) and replace 5 high-noise logs.

---
## 15. Summary
Structure shows organic growth: overlapping clients, god modules, and mixed JS/TS. Introducing a vertical feature architecture and consolidating cross-cutting concerns via `core/` reduces cognitive overhead, enables test isolation, and prepares for stricter validation & security improvements. Early emphasis on a unified transport, DB decomposition, and enforced typing will yield immediate maintainability gains.

Prepared solely from source code; no prior docs used.
