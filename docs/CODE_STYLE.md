# PatchPilot — Code Style and Engineering Conventions

| Field | Value |
|---|---|
| Document | `docs/CODE_STYLE.md` |
| Version | 1.0 (documentation baseline) |
| Date | 2026-10-22 |
| Authority | TypeScript conventions, structure, module boundaries, error handling, tooling, dependency discipline. |

---

## 1. TypeScript Baseline

`tsconfig.base.json` (extended by each package) must enable:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  }
}
```

Rules:
- **No `any`** (ESLint `@typescript-eslint/no-explicit-any: error`). Use `unknown` + narrowing/Zod. `// eslint-disable` requires a reason comment and is reviewed.
- **No non-null assertions (`!`)** except in tests with justification. No `@ts-ignore`; `@ts-expect-error` only with explanation in tests.
- No type assertions (`as`) to silence the compiler on external data; allowed only after validation or for branded types.
- Prefer `type` aliases for unions/DTOs; `interface` for object contracts meant to be implemented.
- Discriminated unions for results/states (`{ok:true,...}|{ok:false,...}`); exhaustive `switch` with `assertNever`.
- Branded types for IDs and money where helpful (`WorkspaceId`, `Minor` = integer cents). Money arithmetic only through helper functions on integers; no floating point for currency.
- Dates: ISO strings at boundaries; parse to `Date`/temporal helpers inside modules; engine receives ISO date strings and compares lexicographically (YYYY-MM-DD).
- ESM modules; Node target aligned with runtime (≥20).

## 2. Naming

| Item | Convention |
|---|---|
| Files/folders | `kebab-case` (`decision-run.service.ts`); React components `PascalCase.tsx` |
| Types/interfaces/classes/components | `PascalCase` |
| Variables/functions | `camelCase`; booleans `is/has/can/should…` |
| Constants | `UPPER_SNAKE_CASE` for true constants; enum-like objects via `as const` + union type |
| DB columns | `snake_case`; mapped to `camelCase` in repositories |
| Env vars | `UPPER_SNAKE_CASE`; Qloo vars prefixed `QLOO_` |
| Reason/flag codes | `UPPER_SNAKE_CASE` strings with prefixes (`HC_`, `WARN_`, `REM_`) |
| Test files | `*.test.ts` next to source or in `test/`; E2E `*.spec.ts` |

Avoid abbreviations except domain-standard (`id`, `url`, `api`). Name by domain meaning (`cultureSignal`, `budgetRemainingMinor`), not by mechanics.

## 3. Folder and Module Structure

```
apps/api/src/
  config/            # env schema (zod), constants
  http/              # app.ts, middleware/, error-handler.ts, routes/ (thin)
  modules/<domain>/  # <domain>.service.ts, <domain>.repository.ts, <domain>.routes.ts, <domain>.types.ts
  db/                # schema.ts, client.ts, migrations/
  observability/     # logger.ts, metrics.ts
  composition-root.ts# the ONLY place that wires real dependencies
apps/web/src/
  app/               # Next routes (App Router)
  components/        # ui/ (primitives), evidence/, decision/, layout/
  lib/               # api client, formatters, hooks
packages/shared/src/ # schemas/, enums.ts, errors.ts, banned-claims.ts, qloo-signal-config.ts
packages/qloo-client/src/  # client.ts, endpoints.ts, parse/, normalize/, errors.ts, redact.ts
packages/decision-engine/src/ # index.ts, eligibility.ts, criteria/, aggregate.ts, select.ts, explain.ts, diff.ts, hash.ts
```

**Module boundary rules (lint-enforced via `no-restricted-imports`/`eslint-plugin-boundaries`):**
- `apps/web` imports only `packages/shared` (types/schemas) — never `qloo-client`, `decision-engine`, `db`, or `apps/api`.
- `packages/decision-engine` imports only `packages/shared`; **no** `fs`, `http`, `fetch`, `Date.now()`, `Math.random`, `crypto.randomUUID` (hashing uses a pure function over canonical JSON; `crypto` hashing import allowed in `hash.ts` only).
- `packages/qloo-client` imports only `packages/shared` and Node built-ins; **no DB**.
- Routes call services; services call repositories and adapters; repositories are the only code touching the DB; services never construct SQL.
- Only `composition-root.ts` instantiates the real Qloo client/transport. Tests construct their own.

## 4. Error Handling

- Typed error classes extending `AppError` with `code` (from `shared/errors.ts`), `httpStatus`, `safeMessage`, `retryable`, `details?`, `cause?`.
- **Expected failures** (validation, Qloo outcomes, quota) are modeled as values (`Result`) at module boundaries where the caller must branch; **unexpected** failures throw and reach the central error handler.
- Never swallow errors; never `catch {}` without handling/logging. Rethrow with `cause`.
- Never include secrets, upstream bodies, SQL, or stack traces in `safeMessage`/`details`.
- The adapter returns `QlooResult` — it does not throw for upstream conditions. It throws only for programmer errors (invalid config at construction).
- Async: always `await` or return promises; no floating promises (`@typescript-eslint/no-floating-promises`). Use `Promise.allSettled` for batch isolation.

## 5. Validation

- Zod schemas in `packages/shared`, used for: HTTP input, HTTP output (in tests), DB-adjacent DTOs, engine input, LLM narrative output, env config.
- `.strict()` on input objects (reject unknown keys). Parse, don't validate-and-cast: use the parsed output type.
- Server-assigned fields (`dataOrigin` of Qloo/derived records, IDs, timestamps) are **not** accepted from clients.
- Business-rule validators are pure functions with unit tests (dependency cycle detection, window ordering, currency match, weight sums).

## 6. Backend Patterns (Express)

- `app.ts` builds the app from injected dependencies (`createApp(deps)`) to enable Supertest without network.
- Route handler pattern: `validate(schema) → service call → map to DTO → res.json`. Handlers contain no business logic and no DB calls.
- Middleware order: request-id → logger → helmet → CORS → body parser (limit) → session → CSRF check → rate limiters → routes → 404 → error handler.
- Transactions: service-level `withTransaction` for multi-row writes (seeding, evidence persist + signal derive).
- Idempotency: resolve/refresh endpoints are safe to repeat (fingerprint caching; unique constraints).
- Config: single `loadConfig()` validated once at startup; passed down; no `process.env` access outside `config/`.
- Logging via injected pino instance; no `console.log` (lint `no-console` except scripts).
- Time and IDs injected (`Clock`, `IdGenerator`) into services for testability.

## 7. Frontend Patterns (Next.js + React)

- Server Components by default; Client Components only for interactivity; mark with `'use client'`.
- Typed API client in `lib/api` built on `packages/shared` schemas; all responses parsed (Zod) in dev/test builds, trusted shape in production only if schemas are enforced at the API.
- Server state via TanStack Query (or equivalent minimal approach); local UI state with `useState/useReducer`; no Redux/Zustand unless justified.
- Forms: controlled components + shared Zod schemas for client-side validation messages (server remains authoritative).
- Styling: Tailwind utility classes with design tokens; extract repeated patterns into components, not `@apply` sprawl.
- No `dangerouslySetInnerHTML`; no inline secrets; no direct `fetch` to third-party hosts.
- Every data component implements loading/empty/error states (DESIGN §8). Component props typed explicitly; no prop drilling beyond two levels (use composition/context).
- Accessibility rules in DESIGN §9 are part of code review.
- File size guidance: components < 250 lines; split otherwise.

## 8. Decision Engine Conventions

- Pure functions, immutable inputs (`readonly` types; `Object.freeze` in dev tests), no mutation of arguments.
- Sort with explicit comparator over a total order; never rely on object key order or `Array.sort` stability assumptions without full comparator.
- Floating-point: compute in a defined order; round outputs to 6 decimals via a single `round6` helper at output boundaries only; hash over rounded outputs; never compare floats with `===` except via helper.
- All reason/flag/explanation strings come from template tables in `explain.ts` (no string concatenation scattered in logic).
- Public API surface minimal and versioned (`ENGINE_VERSION`); any formula change bumps the version and updates `ARCHITECTURE.md` §8 and tests.

## 9. Qloo Adapter Conventions

- All endpoint paths/param names/enums only in `endpoints.ts`; each constant has a comment linking to its **verification record** (`Q-xx`, Phase 0 report anchor). Unverified constants are not allowed in main (CI check greps for `UNVERIFIED` markers).
- Two-stage parsing; unknown fields never trusted.
- No retries inside parsing; retries only at transport wrapper.
- Never log request URLs with query strings; use `sanitizedParams`.
- Public exports limited to client factory, types, and error/status enums.

## 10. Formatting and Linting

- Prettier: 100 cols, single quotes, trailing commas `all`, semicolons on. Enforced in CI (`format:check`).
- ESLint flat config with: `typescript-eslint` strict-type-checked, `eslint-plugin-import` ordering, `eslint-plugin-boundaries` (module boundaries), `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `no-console` (error outside scripts), `no-restricted-syntax` for `dangerouslySetInnerHTML`, `no-restricted-imports` for fixtures in prod code.
- Commit hygiene: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`); small, reviewable commits per checklist task; reference task IDs (`P2-03`).
- Husky/lint-staged optional; CI is the authority.

## 11. Dependency Discipline

1. Prefer platform features (`fetch`, `AbortController`, `crypto`, `URL`) over libraries.
2. Allowed baseline set: `next`, `react`, `react-dom`, `tailwindcss`, `express`, `zod`, `drizzle-orm`, `drizzle-kit`, `pg` (or `postgres`), `pino`, `pino-http`, `helmet`, `cors`, `express-rate-limit`, `cookie-parser` (or signed-cookie helper), `vitest`, `supertest`, `msw` (or undici MockAgent), `@playwright/test`, `@axe-core/playwright`, `eslint` stack, `prettier`, `typescript`, `tsx`, `@tanstack/react-query` (optional), `lucide-react` (optional), Radix primitives (optional).
3. Any other dependency requires a `DECISIONS.md` entry (reason, size, maintenance, alternatives, license).
4. No packages with copyleft licenses incompatible with the chosen OSI license; check licenses (`pnpm licenses list`).
5. Prefer versions published ≥14 days earlier; pin via lockfile; no `latest` ranges in manifests; no `postinstall` scripts from unvetted packages.
6. No LLM SDK unless `BRIEF_NARRATIVE_MODE=llm` is being implemented; wrap behind `NarrativeProvider` interface.

## 12. Unsafe Shortcuts — Prohibited

Hardcoding rankings/scores/Qloo content in UI; catching and ignoring Qloo errors; returning fixtures from production code paths; `any`/`as any`; disabling lint/type checks to pass CI; skipping validation "for the demo"; storing secrets in code/DB/fixtures; logging bodies/headers; using `NEXT_PUBLIC_` for anything sensitive; mutating stored runs/evidence; computing money with floats; using `Math.random`/`Date.now` inside the engine; marking tasks done without verification; deleting failing tests instead of fixing them; copying observed live Qloo values into source as constants.

## 13. Documentation in Code

- Public functions in `qloo-client`, `decision-engine`, and `shared` have TSDoc describing contract, units, and failure modes.
- Non-obvious formulas reference `ARCHITECTURE.md` section numbers.
- README, `.env.example`, and `docs/status/*` updated in the same PR as behavior changes.

## 14. Review Checklist (self-review before marking a task verified)

- [ ] Types strict; no `any`.
- [ ] Inputs validated; errors typed and redacted.
- [ ] Boundaries respected (lint passes).
- [ ] Tests added/updated and run; results recorded.
- [ ] No secrets/PII in code, logs, fixtures.
- [ ] Origin labels and provenance preserved.
- [ ] Docs/checklist updated truthfully.
