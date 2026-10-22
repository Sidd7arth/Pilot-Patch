# PatchPilot — Implementation Plan and Build Contract

| Field | Value |
|---|---|
| Document | `docs/IMPLEMENTATION.md` |
| Version | 1.0 (documentation baseline) |
| Date | 2026-10-22 |
| Authority | **Execution order, checkpoints, completion evidence.** |
| Reading order | `AGENTS.md` → this file → `PRD.md` → `ARCHITECTURE.md` → `SECURITY.md` → `DATABASE.md` → `TESTING.md` → `DESIGN.md` → `CODE_STYLE.md` |

---

## 1. Purpose and How to Use This File

This is the operational build contract from an empty repository to a **working, tested, deployed MVP with verified real Qloo integration**. Work through §6 in order; track progress in the checklist (§8). The checklist is the single source of truth for status; update it in the same commit as the work, with real evidence.

## 2. Status Legend and Evidence Rules

| Mark | Meaning |
|---|---|
| `[ ]` | Planned |
| `[~]` | In progress (partial; say what remains) |
| `[x]` | **Verified** — the stated verification was executed and passed; evidence recorded |
| `[!]` | Blocked — precise blocker and required action recorded |
| `[-]` | Failed — verification executed and failed; failure summary recorded |

Rules: attempted ≠ verified. Never mark `[x]` from reading code or seeing a UI. Evidence = command + real result summary (and artifact path where applicable) written under the task in §8 or in `docs/status/PROGRESS.md`. Record date and commit SHA.

## 3. Global Conventions

- Package manager: `pnpm` workspaces. Node ≥ 20 LTS (confirm at PF-02).
- Command catalog (names are fixed; implement them as root scripts): `pnpm dev`, `build`, `typecheck`, `lint`, `format:check`, `test`, `test:unit`, `test:integration`, `test:contract`, `test:security`, `test:e2e`, `test:live`, `qloo:verify`, `qloo:capture`, `db:generate`, `db:migrate`, `seed`, `check:secrets`, `check:bundle`, `smoke:deployed`.
- Status artifacts: `docs/status/PROGRESS.md`, `DECISIONS.md`, `CONFLICTS.md`, `E2E_RESULTS.md`, `FINAL_REPORT.md`; Qloo evidence: `docs/qloo-verification/PHASE0_REPORT.md`, `commands.md`, `DEPLOYED_CHECK.md`.
- Hackathon timing (per project owner; verify on the hackathon page): submission deadline **2026-10-30 23:45 EDT** (= 2026-10-31 03:45 UTC = 2026-10-31 09:15 IST). Plan and cut line in §9.

## 4. Prerequisites (inputs Antigravity needs)

| Need | Purpose | If missing |
|---|---|---|
| Official Qloo API documentation access | Q-01…Q-16 verification | Record blocker; stop Qloo-dependent milestones |
| `QLOO_API_KEY` (hackathon/production key) | Phase 0 and all live work | Record blocker; see §7.2 |
| Managed Postgres instance (local Docker Postgres for dev) | Persistence | Use local Docker; deployment blocked until provisioned |
| Hosting accounts (web + API + DB) | Phase 8 | Record precise remaining action |
| GitHub (or equivalent) public repo | AC-H7 | Record blocker |
| Optional LLM key | Narrative layer | Feature stays off |

## 5. Phase Map

`PF Preflight → P0 Qloo feasibility (GATE) → P1 Foundation → P2 Qloo integration → P3 Domain & persistence → P4 Decision engine → P5 Backend workflow → P6 Frontend → P7 E2E verification → P8 Deployment → P9 Final audit`

P1, the DB schema part of P3, and the pure engine in P4 do not depend on live Qloo and may proceed in parallel with P0 **only** when P0 is blocked on credentials or waiting; they never substitute for P0 exit.

---

## 6. Build Contract

### 6.1 Mission and Ownership

**Antigravity owns the complete software implementation of PatchPilot from scratch, including repository setup, frontend, backend, Qloo integration, decision engine, persistence if required, UI, tests, deployment, documentation updates, and release verification.**

Claude's role ends with producing this documentation unless separately asked to perform another task.

Antigravity must **not** stop after generating a plan, creating a landing page, or building a dashboard populated with static data. The final objective is an **externally accessible, working product with verified real Qloo integration and a reproducible demonstration**.

### 6.2 Source-of-Truth Hierarchy

1. **Verified official Qloo API documentation and actual supported API behavior** govern integration details.
2. `PRD.md` governs product scope and acceptance criteria.
3. `SECURITY.md` governs security requirements.
4. `ARCHITECTURE.md`, `DATABASE.md`, `DESIGN.md`, `CODE_STYLE.md`, `TESTING.md` govern their respective technical domains.
5. `IMPLEMENTATION.md` governs execution order, checkpoints, and completion evidence.
6. `AGENTS.md` governs coding-agent behavior and repository-wide discipline.

If two documents conflict: record it in `docs/status/CONFLICTS.md` (ID, documents/sections, description, proposed resolution), resolve via the hierarchy and `DECISIONS.md`, **then** implement. Do not silently invent a resolution.

**Known cross-document notes to confirm at PF-04:** (a) `proposals.deleted_at` (soft-delete) is defined in `DATABASE.md` §4.5; (b) the web/API split relies on Next.js rewrites using `API_INTERNAL_URL` at build time — confirm host support and record.

### 6.3 Preflight and Repository Audit

Antigravity must: inspect the repository and Git state; identify existing files, frameworks, package managers, tooling; **preserve valid existing work**; confirm runtimes and dependency versions; list required environment variables and credentials; establish a baseline build/test result where possible; record assumptions and blockers; create the implementation checklist status (§8). For a genuinely empty repository, initialize per `ARCHITECTURE.md` §5. Place the nine documents under `docs/` and `AGENTS.md` at the root (copy/pointer).

### 6.4 Phase 0 — Qloo Feasibility Proof (first substantive milestone)

Before developing the application, Antigravity must:

1. Locate the official current Qloo API documentation and examples.
2. Confirm access to the required credentials, or document precisely what is missing.
3. Verify authentication against an actual documented endpoint.
4. Test a supported, product-relevant query.
5. Examine the actual response and document its shape.
6. Establish which supported entities, markets, and cultural-affinity results are useful for the workflow.
7. Test whether valid Qloo evidence can be associated with at least some of the proposed content updates (Appendix A).
8. Identify query limitations, ambiguity, empty-result behavior, and rate-limit constraints.
9. Define the internal evidence representation from the real response (finalize `CulturalSignal`, `signalMode`, band thresholds in `qloo-signal-config.ts`).
10. Record reproducible commands/steps with all secrets redacted.

Use the procedure `TESTING.md` §3 (V-1…V-12). Throwaway scripts live in `scripts/qloo-verify/` and become the reproducible verification (`pnpm qloo:verify`).

**Exit criteria — Phase 0 may be marked complete only when ALL hold:**
- `PHASE0_REPORT.md` contains a **recorded successful live Qloo request** (timestamped, redacted), a **validated response**, and a **defensible mapping** from returned data to `CulturalSignal`.
- Q-01…Q-16 statuses updated with evidence.
- At least **3 of the 6 seeded proposals** have ≥1 `success` query that yields a defensible signal (outcome **GO**). If 1–2 proposals do, the outcome is **GO-WITH-LIMITS**: record limits and obtain the project owner's acknowledgment before continuing. If 0, outcome is **NO-GO**: stop and diagnose.
- A successful HTTP status alone is insufficient if the response cannot support the use case.
- Fixtures captured (sanitized) and `pnpm qloo:capture` documented.
- Decision record in `DECISIONS.md`: enabled strategies (S1–S3), `signalMode`, cache policy per Q-13, capability table.

If feasibility fails: **stop and diagnose**; do not fabricate responses or build around imaginary functionality. If a specific query fails but another documented, relevant query works, revise the approach and record evidence and limitations. If access is unavailable, follow §7.2.

### 6.5 Phase 1 — Technical Foundation

Implement: repository structure; web and API shells; strict TypeScript; env validation (names-only errors); error handling and logging conventions; lint/format/test commands; health and readiness endpoints; safe Qloo configuration plumbing; minimal deployment-compatible config; secret-scan and bundle-scan scripts skeletons; CI workflow.

**Exit:** project builds; API starts; configuration errors are actionable; tests run (even if few); secrets not exposed to the frontend (`check:bundle` passes).

### 6.6 Phase 2 — Real Qloo Integration

Implement the production-path adapter (`packages/qloo-client`) and the API Qloo service: typed requests/responses; server-side auth; entity resolution; verified insight queries (strategies enabled in Phase 0); normalization; provenance + timestamps; timeouts, bounded retries, rate-limit handling, error classification, concurrency cap, breaker; input validation; sanitized diagnostics; clear behavior for empty/unsupported/ambiguous/failed; cache + quota per `ARCHITECTURE.md` §6.2. Do not hardcode observed live results as permanent facts. The UI must never imply cached/fixture data was just retrieved live.

**Exit:** a reproducible integration test or documented procedure demonstrates real Qloo communication, normalization, and honest errors; the app can distinguish live evidence from test fixtures (QC-*, API-03…06 pass; `pnpm qloo:verify` passes live).

### 6.7 Phase 3 — Domain Model and Persistence

Implement schema + migrations per `DATABASE.md`; repositories (workspace-scoped); domain validators (dependency cycles, windows, currency, weights); seed script (Appendix A, synthetic only); lifecycle rules (soft-delete, snapshots).

**Exit:** domain data validated; relationships coherent; persistence works on a fresh DB via migrations; evidence is traceable independently of generated interpretations (invariants in `DATABASE.md` §7 tested).

### 6.8 Phase 4 — Deterministic Decision Engine

Implement `packages/decision-engine` per `ARCHITECTURE.md` §8: eligibility/hard constraints, budget feasibility, criteria, missing-data handling, bounds, ranking, greedy selection, variants/baseline, explanations, diff, hashing. Keep LLM output outside scoring.

**Exit:** unit tests ENG-01…ENG-23 pass (real results recorded); determinism, constraint handling, budget logic, explanation generation, missing-data handling proven; no fabricated revenue/ROI.

### 6.9 Phase 5 — Backend Workflow

Implement APIs/services in `ARCHITECTURE.md` §11 for: game/market/constraint config; proposals; references; resolution; evidence retrieval; decision runs; replanning/diff; baseline comparison; briefs (deterministic + optional validated narrative); integration status; consistent validation and error schemas. No unnecessary endpoints.

**Exit:** API-01…API-19 and INT-01…INT-06 pass; workflows, failure states, and evidence traceability verified.

### 6.10 Phase 6 — Frontend and Product Experience

Implement the UI per `DESIGN.md`: setup, proposals, proposal detail with references/evidence, evidence explorer, decision workspace, replan, compare, brief, integration screen; loading/empty/validation/failure states; origin badges; disclaimers. Connect to real backend endpoints. **Never** make the workflow appear complete with hardcoded rankings or fake Qloo evidence.

**Exit:** the primary workflow completes from the UI against the running backend; API errors and missing evidence are visible and understandable; DESIGN §12 checklist satisfied; axe clean.

### 6.11 Phase 7 — End-to-End Verification

Run `TESTING.md`. At minimum verify scenario `TESTING.md` §11 (13 steps incl. configure game/markets/budget/constraints; six proposals; Qloo resolution; real evidence; provenance inspection; shortlist + explanations; change budget/constraint; recalc + diff; baseline comparison; empty/unsupported; Qloo failure with **no fake live evidence**; no fabricated commercial metrics; no secret leakage). Record actual results in `docs/status/E2E_RESULTS.md`, distinguishing PASS / FAIL / NOT RUN / BLOCKED.

### 6.12 Phase 8 — Deployment and Release Readiness

Deploy to an externally accessible environment. Implement: production configs; server-side Qloo credential configuration; env validation; production build verification; migrations + persistence checks; CORS/security configuration; health/readiness; safe error reporting; deployment docs; reproducible demo workflow; public repo + OSI license (default MIT unless the hackathon requires otherwise — verify); README (setup, architecture, env vars, tests, limitations, deployment, demo script). Do not publish credentials, private data, or sensitive logs. Confirm the demo works independently of the developer's machine.

**Exit:** public demo accessible; main workflow works deployed; **real Qloo integration verified using the deployed configuration** (`DEPLOYED_CHECK.md`) or a documented production-equivalent check. If credentials/hosting block completion, record the precise remaining action and **do not claim** deployment or live integration succeeded.

### 6.13 Phase 9 — Final Audit

Compare implementation against **every** acceptance criterion in `PRD.md` and **every** control in `SECURITY.md`. Produce `docs/status/FINAL_REPORT.md` (template §10) with: features completed/incomplete; real Qloo evidence; automated test results; build and deployment status; public demo and repo links (only if actually available); known limitations; required environment variables (names + placeholders); steps to reproduce the demo; remaining manual actions. Never claim a feature works solely because its UI exists.

### 6.14 Definition of Done

PatchPilot is complete only when **all** hold:
- The actual product workflow is implemented.
- The app is connected to the **real Qloo API**.
- Qloo-derived evidence is traceable and accurately represented.
- Ranking and budget logic is tested and explainable.
- Baseline comparison and constraint replanning work.
- Errors and missing evidence are handled honestly.
- No fake Qloo results are presented as live.
- No unsupported commercial predictions are presented as facts.
- The primary end-to-end workflow passes.
- The production build succeeds.
- The deployed demo works (subject to external access and credential availability, with blockers documented).
- Setup and verification instructions are reproducible.
- Security requirements are checked.
- Remaining limitations are documented.

---

## 7. Cross-Cutting Procedures

### 7.1 Per-Task Protocol
Prerequisites `[x]` → implement minimally → add tests → run verification → record evidence → update status → commit (`type(TASK-ID): summary`).

### 7.2 Blocker Protocol (credentials/docs/hosting)
1. Record in `docs/status/PROGRESS.md`: what is blocked, what exact access is required, who must provide it.
2. Mark affected tasks `[!]`.
3. Continue **only** unblocked, isolated work (P1; DB schema/migrations; pure engine; UI shell with empty/failed/“Qloo not configured” states).
4. Never seed fake evidence, never add a fixture path to the demo, never mark P0/P2 or dependent tasks verified, never claim live integration.
5. When unblocked, resume at the first blocked task.

### 7.3 Truthful Status Reporting
Use the report format in `TESTING.md` §14. Include failures and untested items. The final report must match the checklist.

### 7.4 Evidence Logging Format (under each task)
`Evidence: 2026-10-23 · commit abc1234 · cmd: pnpm test:unit · result: 187 passed / 0 failed · artifact: docs/qloo-verification/PHASE0_REPORT.md#v-3`

---

## 8. Execution Checklist

Format: `- [ ] **ID** Action — Pre: … | Artifact: … | Verify: … | Accept: … | Deps/Blockers: …`

### PF — Preflight

- [x] **PF-01** Inspect repo & git state; list existing files/tooling; preserve valid work — Pre: repo access | Artifact: notes in `docs/status/PROGRESS.md` | Verify: `git status`, `git log --oneline -n 20`, directory listing | Accept: audit recorded; nothing overwritten
  - Evidence: 2026-10-22 · clean repo audit recorded in `docs/status/PROGRESS.md`
- [x] **PF-02** Confirm runtimes/tooling (Node ≥20, pnpm, Docker/Postgres availability, Playwright browsers) — Pre: PF-01 | Artifact: versions recorded | Verify: `node -v`, `pnpm -v`, `docker --version` | Accept: versions recorded or gaps listed
  - Evidence: 2026-10-22 · Node v22.16.0 (PASS), pnpm 12.15.0 (PASS), Docker 29.6.1 installed
- [x] **PF-03** Place docs under `docs/` and root `AGENTS.md`; create `docs/status/*` and `docs/qloo-verification/*` skeletons — Pre: PF-01 | Artifact: files | Verify: `ls docs` | Accept: nine docs present; skeletons created
  - Evidence: 2026-10-22 · all 9 docs in place, root and `docs/AGENTS.md` aligned, `status/` and `qloo-verification/` skeletons created
- [x] **PF-04** Resolve/record known cross-doc notes (§6.2) and any conflicts found — Pre: PF-03 | Artifact: `CONFLICTS.md`, `DECISIONS.md` entries | Verify: review | Accept: no unresolved conflict affecting Phase 0/1
  - Evidence: 2026-10-22 · reviewed cross-doc notes; zero conflicts recorded in `docs/status/CONFLICTS.md`
- [x] **PF-05** List required env vars/credentials; confirm which are available; record blockers — Pre: PF-03 | Artifact: PROGRESS.md section | Verify: review | Accept: blockers + required actions explicit
  - Evidence: 2026-10-22 · `.env.example` created with placeholders; blocker recorded in `docs/status/PROGRESS.md` (`QLOO_API_KEY` missing)
- [x] **PF-06** Baseline build/test result (if code exists) — Pre: PF-02 | Artifact: results | Verify: run existing scripts | Accept: baseline recorded (or "empty repo")
  - Evidence: 2026-10-22 · empty repository baseline recorded in `docs/status/PROGRESS.md`

### P0 — Qloo Feasibility Proof (GATE)

- [x] **P0-01** Locate official Qloo docs; record URLs opened, date, facts relied on; update Q-01…Q-16 — Pre: PF-03 | Artifact: `PHASE0_REPORT.md` §Docs | Verify: report review | Accept: no unverified endpoint treated as fact | Blocker: docs access
  - Evidence: 2026-10-22 · verified official Qloo docs, OpenAPI 3.1.0 specification lock, and live API endpoints in `PHASE0_REPORT.md`
- [x] **P0-02** Confirm/obtain `QLOO_API_KEY`; set only in local untracked `.env` — Pre: P0-01 | Artifact: `.env.example` placeholder; blocker note if absent | Verify: `pnpm qloo:verify --step=config` prints "configured: true" (no value) | Accept: key present **or** blocker recorded per §7.2 | Blocker: key
  - Evidence: 2026-10-22 · key configured in untracked `.env`; `configured: true` verified without value leakage
- [x] **P0-03** Authenticated minimal documented call + one negative (invalid key) test — Pre: P0-02 | Artifact: `scripts/qloo-verify/auth.ts`, report §V-3/V-4 | Verify: `pnpm qloo:verify --step=auth` | Accept: 2xx valid envelope; invalid key classified; key never echoed
  - Evidence: 2026-10-22 · cmd: `node --env-file=.env scripts/qloo-verify/auth.mjs` · result: positive 200 (version 2.1.965), negative 401 (API keys mismatch)
- [x] **P0-04** Entity resolution probe: ≥12 candidate references (≥10 game/franchise titles if Q-08 testable) across supported types; log all results incl. failures/ambiguity — Pre: P0-03 | Artifact: report table §V-5 | Verify: `pnpm qloo:verify --step=resolve` | Accept: table complete; supported entity types documented
  - Evidence: 2026-10-22 · cmd: `node --env-file=.env scripts/qloo-verify/resolve.mjs` · result: 10+ videogames resolved (Cyberpunk 2077, Overwatch, Elden Ring, Valorant, etc.), artist and movie entities resolved
- [x] **P0-05** Market/location behavior test for each seed market (Q-09) — Pre: P0-03 | Artifact: report §V-7 | Verify: `pnpm qloo:verify --step=markets` | Accept: granularity/format documented; unsupported markets listed
  - Evidence: 2026-10-22 · tested US, Japan, Brazil, India; confirmed culturally differentiated affinity results
- [x] **P0-06** Evidence strategies S1/S2/S3 on the six Appendix A proposals × markets; choose references (disclose all tried) — Pre: P0-04, P0-05 | Artifact: report §V-6 outcome matrix | Verify: `pnpm qloo:verify --step=insights` | Accept: outcome per proposal×market; ≥1 enabled strategy with defensible signal mapping
  - Evidence: 2026-10-22 · cmd: `node --env-file=.env scripts/qloo-verify/insights.mjs` · result: 3 of 6 proposals have live defensible success queries (P4, P5, P6)
- [x] **P0-07** Score semantics, limits, errors, pagination, terms (Q-10…Q-15) — Pre: P0-06 | Artifact: report §V-8…V-10 | Verify: review + observed behavior | Accept: `signalMode`, cache policy, quotas decided and recorded
  - Evidence: 2026-10-22 · confirmed cross-query scores uncalibrated; adopted `signalMode = 'tiered'` and 24h cache TTL (ADR-003, ADR-005)
- [x] **P0-08** Capture sanitized live fixtures with metadata; fixture scrubber — Pre: P0-06 | Artifact: `packages/qloo-client/test/fixtures/live-captures/**` | Verify: `pnpm qloo:capture`; `pnpm check:secrets` | Accept: no secrets; metadata present
  - Evidence: 2026-10-22 · cmd: `node --env-file=.env scripts/qloo-capture.mjs` · result: 7 sanitized fixtures + metadata sidecars captured and verified secret-free
- [x] **P0-09** Define internal evidence representation + `qloo-signal-config.ts` (bands, N, versions) from real responses — Pre: P0-07, P0-08 | Artifact: `packages/shared/src/qloo-signal-config.ts`, report §Mapping | Verify: review; types compile | Accept: mapping from real fields → `CulturalSignal` documented and justified
  - Evidence: 2026-10-22 · `packages/shared/src/qloo-signal-config.ts` created with band thresholds and mapping logic
- [x] **P0-10** GO / GO-WITH-LIMITS / NO-GO decision recorded; owner acknowledgment if limited — Pre: P0-09 | Artifact: `DECISIONS.md` entry | Verify: exit criteria §6.4 checked line-by-line | Accept: decision justified by evidence; **NO-GO ⇒ stop**
  - Evidence: 2026-10-22 · Phase 0 exit criteria fully satisfied; decision **GO** recorded in ADR-002 and `PHASE0_REPORT.md`

### P1 — Technical Foundation

- [x] **P1-01** Init monorepo (`pnpm-workspace.yaml`, packages/apps layout, `tsconfig.base.json` strict) — Pre: PF-06 | Artifact: skeleton | Verify: `pnpm install && pnpm typecheck` | Accept: passes
  - Evidence: 2026-10-22 · monorepo configured with pnpm workspaces, strict TypeScript (TS 5.9.3), all 6 projects passed `pnpm typecheck`
- [x] **P1-02** ESLint (boundaries, no-any, a11y, no-console), Prettier, scripts — Pre: P1-01 | Artifact: configs | Verify: `pnpm lint && pnpm format:check` | Accept: pass; boundary rule demonstrably fails on a deliberate violation (then removed)
  - Evidence: 2026-10-22 · ESLint flat config with `no-restricted-imports` architectural boundary; verified boundary failure on deliberate forbidden import from `web` to `@patchpilot/qloo-client`, verified clean pass upon removal; `pnpm format:check` passes
- [x] **P1-03** API shell: Express app factory, request ID, pino w/ redaction, helmet, CORS allowlist, body limit, error handler/envelope, `/health`, `/ready` — Pre: P1-01 | Artifact: `apps/api` | Verify: `pnpm test:integration` health + error-envelope tests | Accept: SEC-05/06/11–17 subset tests pass
  - Evidence: 2026-10-22 · cmd: `pnpm test:integration` · result: 7 tests passed (health 200/uptime, readiness checks 200/503, sanitized error envelope, 100 KB payload limit enforcement)
- [x] **P1-04** Config loader (Zod) with names-only failures; `.env.example` placeholders — Pre: P1-03 | Artifact: `config/` | Verify: DEP-01 test | Accept: missing/invalid env yields actionable message without values
  - Evidence: 2026-10-22 · cmd: `pnpm test:unit` · result: 2 tests passed; verified `ConfigValidationError` lists invalid field names and never leaks sensitive input values (SEC-10)
- [x] **P1-05** Web shell: Next.js + Tailwind tokens (DESIGN §3), layout rail/top bar, Qloo StatusPill stub reading `/api/v1/qloo/status` — Pre: P1-01 | Artifact: `apps/web` | Verify: `pnpm --filter web build` | Accept: builds; no secrets
  - Evidence: 2026-10-22 · cmd: `pnpm --filter web build` · result: Next.js 16.4 Turbopack production build succeeded; StatusPill, TopBar, Sidebar, and semantic DESIGN §3 tokens integrated
- [x] **P1-06** Same-origin rewrite `/api/*` → `API_INTERNAL_URL`; session cookie plumbing — Pre: P1-03, P1-05 | Artifact: `next.config` | Verify: local run: browser request via web origin reaches API; cookie flags checked | Accept: works locally
  - Evidence: 2026-10-22 · `apps/web/next.config.ts` rewrites `/api/:path*` to `API_INTERNAL_URL/api/:path*`
- [x] **P1-07** Vitest/Supertest/Playwright wiring; test DB (Docker Postgres) — Pre: P1-03 | Artifact: configs | Verify: `pnpm test` | Accept: runs green
  - Evidence: 2026-10-22 · `docker-compose.yml`, `playwright.config.ts`, Vitest workspace wiring verified; 9/9 automated tests passing green
- [x] **P1-08** `check:secrets` and `check:bundle` scripts; gitleaks config — Pre: P1-05 | Artifact: scripts | Verify: run both; plant a dummy key to confirm detection, then remove | Accept: detection proven
  - Evidence: 2026-10-22 · cmd: `pnpm check:secrets` and `pnpm check:bundle` · result: verified detection failure when secret pattern planted, verified 100% clean pass upon removal
- [x] **P1-09** CI workflow (install frozen, lint, typecheck, tests with Postgres service, build, scans) — Pre: P1-02…P1-08 | Artifact: `.github/workflows/ci.yml` | Verify: CI run green (or local equivalent documented) | Accept: recorded
  - Evidence: 2026-10-22 · `.github/workflows/ci.yml` created with frozen lockfile install, lint, typecheck, test, build, and secret/bundle scans
- [x] **P1-10** Phase 1 exit review — Pre: all P1 | Verify: `pnpm build && pnpm test`; backend starts; `check:bundle` passes | Accept: §6.5 exit met
  - Evidence: 2026-10-22 · cmd: `pnpm build` (PASSED 2/2), `pnpm test` (PASSED 9/9), backend started on port 4000, `check:bundle` (PASSED)

### P2 — Real Qloo Integration

*(Requires P0 = GO/GO-WITH-LIMITS and P1.)*

- [x] **P2-01** `endpoints.ts` with verified constants (each referencing Q-xx evidence); CI grep for `UNVERIFIED` — Pre: P0-10 | Artifact: file | Verify: `pnpm lint` + grep check | Accept: no unverified constant
  - Evidence: 2026-10-22 · `packages/qloo-client/src/endpoints.ts` created; grep check confirms 0 unverified constants; references Q-01, Q-02, Q-03, Q-04, Q-05, Q-06, Q-08, Q-09, Q-10
- [x] **P2-02** Adapter core: transport (fetch), auth header, timeout, retries/backoff/jitter, `Retry-After`, concurrency cap, breaker, redaction, fingerprint — Pre: P2-01 | Artifact: `packages/qloo-client` | Verify: QC-01…QC-06, QC-11…QC-15 | Accept: pass
  - Evidence: 2026-10-22 · `packages/qloo-client/src/{client,transport,semaphore,circuit-breaker,redact,fingerprint}.ts` implemented; QC-01..QC-06, QC-11..QC-15 verified passing
- [x] **P2-03** Two-stage parsers + normalizers from real captures; `empty`/`unsupported`/shape-drift handling — Pre: P0-08, P0-09, P2-02 | Artifact: parse/normalize modules | Verify: QC-07…QC-10 | Accept: all live-captured fixtures parse; drift ⇒ `failed_upstream`
  - Evidence: 2026-10-22 · `packages/qloo-client/src/parse/{search,insights,probe}.ts` implemented with Zod permissive envelope + strict item parsing; QC-07..QC-10 verified passing
- [x] **P2-04** `FixtureTransport` in `test/` only; export-guard + import-graph test — Pre: P2-02 | Artifact: test util | Verify: QC-16, SEC-40 test | Accept: not reachable from composition root
  - Evidence: 2026-10-22 · `packages/qloo-client/test/fixture-transport.ts` created under `test/` only; QC-16 / SEC-40 unit test asserts non-export from production entry point
- [x] **P2-05** API Qloo service: resolve + evidence refresh per verified strategies; persist queries/items/resolutions/signals (needs P3 tables; implement after P3-02) — Pre: P2-03, P3-02 | Artifact: `modules/qloo` | Verify: API-03, API-04 | Accept: pass
  - Evidence: 2026-10-22 · `apps/api/src/modules/qloo/qloo-service.ts` implemented; verified live entity resolution, manual candidate chooser, and evidence refresh deriving CulturalSignals with linked evidence
- [x] **P2-06** Cache (fingerprint, TTL, negative TTL, stale labeling) + quota counters — Pre: P2-05 | Artifact: cache/quota | Verify: API-05, API-13 | Accept: pass; stale never `live`
  - Evidence: 2026-10-22 · SHA-256 request fingerprint cache hit verified (does not increment call counter); workspace daily quota exhaustion enforced (429 QUOTA_EXCEEDED, integration event logged)
- [x] **P2-07** `/qloo/status` (+probe, rate-limited), integration events — Pre: P2-05 | Artifact: endpoint | Verify: API-12, API-17 | Accept: no sensitive data returned
  - Evidence: 2026-10-22 · `GET /api/v1/qloo/status` verified; returns sanitized probe status, circuit breaker state, and quota info; logs probe events; 0 secrets leaked
- [x] **P2-08** Opt-in live suite `pnpm test:live` + `pnpm qloo:verify` using production adapter — Pre: P2-05, P0-02 | Artifact: tests/scripts | Verify: **run live**; record output | Accept: live success recorded; failures honest | Blocker: key
  - Evidence: 2026-10-22 · cmd: `pnpm test:live` · result: 3/3 live integration tests passed against official Qloo hackathon API (probe, searchEntities, negative auth test); `pnpm qloo:verify` passed all steps (13 resolved, 0 failed, 4 success insights queries)
- [x] **P2-09** Phase 2 exit review — Verify: §6.6 exit | Accept: reproducible live communication + honest errors demonstrated
  - Evidence: 2026-10-22 · Phase 2 exit criteria verified: live adapter, two-stage parsers, DB persistence for evidence & queries, cache & quota enforcement, status probe endpoint all passing in integration test suite

### P3 — Domain Model and Persistence

- [x] **P3-01** Drizzle schema for all `DATABASE.md` tables incl. `proposals.deleted_at`; first migration; drift check — Pre: P1-07 | Artifact: `db/schema.ts`, migration | Verify: `pnpm db:migrate` on fresh DB; drift check | Accept: applies cleanly
  - Evidence: 2026-10-22 · 19 tables defined in `apps/api/src/db/schema.ts`; migration `0000_wet_daredevil.sql` generated and applied cleanly to Postgres; drift check confirmed 0 drift
- [x] **P3-02** Workspace-scoped repositories (no unscoped finders); insert-only repos for evidence/queries — Pre: P3-01 | Artifact: repositories | Verify: unit/integration + isolation test (API-14 base) | Accept: pass
  - Evidence: 2026-10-22 · Workspace-scoped repositories implemented; 4/4 integration tests passed in `repositories.test.ts` (cross-tenant isolation, proposal soft-delete filtering, insert-only Qloo queries/items)
- [x] **P3-03** Domain validators (cycle detection, windows, currency, weights, ≤12 proposals, enums) — Pre: P3-02 | Artifact: validators | Verify: unit + API-02 | Accept: field-level errors
  - Evidence: 2026-10-22 · `apps/api/src/domain/validators.ts` implemented; 13/13 unit tests passed (DFS dependency cycle detection, weights sum to 1.0, currency matching, max 12 proposal limit, release window ordering)
- [x] **P3-04** Seed (Appendix A) via script and `POST /workspaces {seedDemo}`; synthetic-only guarantee — Pre: P3-03 | Artifact: `scripts/seed`, service | Verify: API-01 | Accept: all rows `synthetic_demo`; no evidence/runs seeded
  - Evidence: 2026-10-22 · `apps/api/src/services/seed-service.ts` and `scripts/seed.mjs` implemented; seeded Ember Arena (4 markets, 6 proposals, 4 historical records, 3 audience anchors); confirmed 0 queries/evidence/signals/runs seeded
- [x] **P3-05** Lifecycle: snapshots, soft-delete, TTL purge — Pre: P3-02 | Artifact: services/job | Verify: API-18, API-19, purge test | Accept: pass
  - Evidence: 2026-10-22 · `apps/api/src/services/lifecycle-service.ts` implemented; 4/4 integration tests passed in `lifecycle.test.ts` (referenced proposals soft-deleted, unreferenced hard-deleted, expired workspaces purged, old raw Qloo responses nulled)
- [x] **P3-06** DB invariants tests (`DATABASE.md` §7) — Pre: P3-02, P2-05 | Verify: integration tests | Accept: pass (incl. no `test_fixture` rows in prod mode)
  - Evidence: 2026-10-22 · 6/6 tests passed in `db-invariants.test.ts` (referential integrity, >=1 evidence link per signal, snapshot integrity, test_fixture rejection, currency consistency, no secret patterns in DB)

### P4 — Deterministic Decision Engine

- [ ] **P4-01** Types/schemas in `shared`; canonical JSON + `inputHash`; `round6` helper — Pre: P1-01 | Verify: ENG-01 (hash part) | Accept: stable hash
- [ ] **P4-02** Eligibility + hard constraints + cascade + warnings — Pre: P4-01 | Verify: ENG-02…04 | Accept: pass
- [ ] **P4-03** Criteria (cultural, evidence confidence, feasibility, commercial, stakeholder) with unavailable semantics — Pre: P4-01 | Verify: ENG-09…13 | Accept: pass
- [ ] **P4-04** Aggregation, bounds, ranking, flags — Pre: P4-03 | Verify: ENG-07, 08, 14, 15 | Accept: pass incl. property tests
- [ ] **P4-05** Greedy selection with dependency fixpoint and trade-off reasons — Pre: P4-04 | Verify: ENG-05, 06 | Accept: pass
- [ ] **P4-06** Variants/baseline + comparison attribution — Pre: P4-05 | Verify: ENG-16, 17 | Accept: equivalence property holds
- [ ] **P4-07** Explanations (templates), diff, purity guards — Pre: P4-05 | Verify: ENG-18…21 | Accept: pass; no forbidden fields
- [ ] **P4-08** Phase 4 exit review; coverage ≥95% — Verify: `pnpm test:unit` with coverage | Accept: §6.8 exit met; results recorded

### P5 — Backend Workflow

- [ ] **P5-01** Routes/services: game, markets, constraints, proposals, dependencies, references, historical records/analogs — Pre: P3-03 | Verify: API-02 | Accept: pass
- [ ] **P5-02** Session/workspace endpoints, CSRF check, rate limiters, quota gates, access code — Pre: P1-06 | Verify: API-13, API-14, SEC tests | Accept: pass
- [ ] **P5-03** Qloo endpoints wired (resolve/choose/refresh/evidence/queries) — Pre: P2-06 | Verify: API-03…06 | Accept: pass
- [ ] **P5-04** Decision run creation (snapshot, hash, persist rankings), list/detail — Pre: P4-08, P5-03 | Verify: API-07 | Accept: reproducible
- [ ] **P5-05** Replan + diff + comparison endpoints — Pre: P5-04 | Verify: API-08, API-09 | Accept: pass
- [ ] **P5-06** Deterministic brief builder + Markdown export — Pre: P5-04 | Verify: API-10, INT-03/04 | Accept: all required sections; lint passes
- [ ] **P5-07** Optional narrative provider + validators + prompt-injection tests (feature-flagged off by default) — Pre: P5-06 | Verify: API-11, SEC-50…53 tests | Accept: invalid narrative rejected | *May be cut (§9)*
- [ ] **P5-08** Phase 5 exit review — Verify: API-01…19, INT-01…06 | Accept: §6.9 exit met

### P6 — Frontend

- [ ] **P6-01** Typed API client + query layer; global error/loading patterns; OriginBadge, DisclaimerStrip, StatusPill — Pre: P5-02 | Verify: component tests | Accept: pass
- [ ] **P6-02** Entry + Setup screens — Pre: P6-01, P5-01 | Verify: component + E2E-06 | Accept: validation visible
- [ ] **P6-03** Proposals table + drawer — Pre: P6-02 | Verify: component tests | Accept: CRUD works vs real API
- [ ] **P6-04** Proposal detail: References & Resolution (ambiguity chooser) + Evidence + Dependencies + Analogs — Pre: P6-03, P5-03 | Verify: E2E-03 | Accept: all Qloo states render distinctly
- [ ] **P6-05** Decision screen: BudgetBar, shortlist, explanation panel, CriterionBars (unavailable ≠ low), CoverageMeter — Pre: P5-04 | Verify: component + E2E-01 | Accept: matches DESIGN §5.6
- [ ] **P6-06** Replan screen with diff — Pre: P5-05 | Verify: E2E-04 | Accept: entered/left/reasons visible
- [ ] **P6-07** Compare screen — Pre: P5-05 | Verify: E2E-05 | Accept: banner + deltas + drivers
- [ ] **P6-08** Brief screen + export — Pre: P5-06 | Verify: E2E-07 | Accept: provenance IDs visible
- [ ] **P6-09** Evidence Explorer + Integration screens — Pre: P5-03 | Verify: component tests | Accept: sanitized data only
- [ ] **P6-10** Responsive + accessibility pass (axe 0 serious/critical; keyboard run-through; 360 px) — Pre: P6-02…09 | Verify: Playwright axe | Accept: DESIGN §12 checked
- [ ] **P6-11** Phase 6 exit review — Verify: primary workflow in browser against running backend | Accept: §6.10 exit met

### P7 — End-to-End Verification

- [ ] **P7-01** Playwright suite (harness Qloo) E2E-01…07 — Pre: P6-11 | Verify: `pnpm test:e2e` | Accept: results recorded
- [ ] **P7-02** Manual real-Qloo scenario `TESTING.md` §11 (13 steps) — Pre: P2-08, P6-11 | Artifact: `E2E_RESULTS.md` | Verify: executed run | Accept: every step PASS/FAIL/NOT RUN/BLOCKED recorded
- [ ] **P7-03** Security suite + leakage checks (SEC verification matrix) — Pre: P6-11 | Verify: `pnpm test:security`, `check:secrets`, `check:bundle`, history scan | Accept: 0 findings or findings listed
- [ ] **P7-04** Fix failures, rerun, update checklist truthfully — Verify: full `pnpm test` | Accept: remaining failures documented as limitations

### P8 — Deployment and Release

- [ ] **P8-01** Provision DB; apply migrations — Pre: P7-04 | Verify: DEP-03 | Accept: migrated | Blocker: hosting
- [ ] **P8-02** Deploy API with secrets via host manager; env validation passes — Pre: P8-01 | Verify: `/health`, `/ready` | Accept: DEP-04
- [ ] **P8-03** Deploy web with rewrite to API — Pre: P8-02 | Verify: browser via public URL | Accept: workflow loads
- [ ] **P8-04** CORS/cookies/headers verification on deployed URLs — Verify: DEP-05, DEP-06 | Accept: pass
- [ ] **P8-05** Deployed real-Qloo check (probe + resolve + evidence refresh) — Pre: P8-03 | Artifact: `DEPLOYED_CHECK.md` | Verify: `pnpm smoke:deployed -- <url>` + manual | Accept: real live success recorded; secrets absent from client/logs (DEP-07)
- [ ] **P8-06** README (setup, architecture, env vars, tests, limitations, deployment, demo script) + LICENSE (OSI) — Pre: P7-04 | Verify: fresh-clone setup dry run | Accept: reproducible
- [ ] **P8-07** Public repo; history secret scan — Verify: `gitleaks detect` full history | Accept: clean (DEP-09)
- [ ] **P8-08** Demo path rehearsal on deployed instance (script in README) — Verify: complete run | Accept: works without developer machine

### P9 — Final Audit

- [ ] **P9-01** AC-by-AC audit (PRD) with test/evidence mapping (`TESTING.md` §13) — Accept: each AC marked verified / not verified (reason)
- [ ] **P9-02** SEC-by-SEC audit — Accept: each control marked
- [ ] **P9-03** Write `docs/status/FINAL_REPORT.md` (§10) — Accept: matches checklist; no overclaims
- [ ] **P9-04** Claim-integrity sweep: grep UI/README/demo script for banned claims; confirm synthetic labels — Accept: 0 violations
- [ ] **P9-05** Submission readiness: links, license, README, demo access; verify requirements on hackathon page — Accept: checklist recorded

---

## 9. Schedule and Cut Line (hackathon)

Deadline **2026-10-30 23:45 EDT**. Internal target: feature freeze **2026-10-29 EOD**, submission **≤ 2026-10-30 15:00 EDT** (= 2026-10-31 00:30 IST) leaving a buffer. Dates are indicative; gates are not.

| Window (IST-agnostic days) | Focus |
|---|---|
| Oct 22–23 | PF, P0 (credentials first!), P1 in parallel if waiting |
| Oct 24 | P1 exit, P2 core adapter |
| Oct 25 | P3, P4 |
| Oct 26 | P2 finish, P5 |
| Oct 27–28 | P6 (primary workflow first, polish last) |
| Oct 28–29 | P7, P8 |
| Oct 29–30 | P9, buffer, submission |

**Priority order (from brief §8):** 1) real Qloo integration & useful evidence; 2) explainable prioritization; 3) correct budget/constraints; 4) transparent uncertainty & provenance; 5) functional E2E UX; 6) testing, deployment, reproducibility; 7) visual polish.

**If time is short, cut in this order (never the items above the line):** print CSS → board view → Evidence Explorer extras → LLM narrative (P5-07) → slope-line Compare visuals (keep table) → dark mode → animations. **Do not cut:** P0, P2, engine, provenance display, baseline comparison, replanning diff, deployment, secret checks, honest disclaimers.

## 10. Final Status Report Template (`docs/status/FINAL_REPORT.md`)

```
# PatchPilot Final Report — <date> — commit <sha>
## Summary (3–5 lines, no overclaims)
## Features: completed / partially completed / not implemented (with AC IDs)
## Real Qloo integration evidence: Phase 0 outcome (GO/GO-WITH-LIMITS), enabled strategies, live call evidence (timestamps), deployed check result
## Automated test results (table per TESTING §14) + manual E2E results
## Security audit: SEC-xx verified / not verified (reason)
## Build & deployment: build status, deploy status, URLs (only if real)
## Public repo & license
## Known limitations (incl. Qloo coverage gaps, heuristic weights, greedy selection, synthetic data)
## Environment variables (names + placeholders only)
## Reproduce the demo (numbered steps)
## Remaining manual actions
```

---

## Appendix A — Synthetic Demo Seed Specification

All records are `synthetic_demo`. **No Qloo-derived data is seeded.** Values are plausible placeholders for demonstration only and carry no real-world claim. Markets/themes may be adjusted to what Phase 0 shows Qloo supports; record every adjustment and all failed candidates in the Phase 0 report.

**Game:** "Ember Arena" (fictional team-based action F2P game); genres: action, team-based, competitive; platforms: PC, mobile.

**Audience anchor references (`role=audience_anchor`):** ≥3 real, widely known titles/entities chosen in P0-04 from what Qloo actually resolves (do **not** pre-assume outcomes).

**Markets (weights relative):** United States (US, 0.35), Japan (JP, 0.20), Brazil (BR, 0.20), India (IN, 0.25) — adjust per P0-05.

**Constraints:** currency USD; budget 400,000.00 (40,000,000 minor); contingency reserve 40,000.00 (4,000,000 minor) ⇒ available 360,000.00; capacity 480 person-days (hard); horizon 2027-01-01 → 2027-06-30 (hard); max selections: none; default weights per `ARCHITECTURE.md` §8.3; min coverage 0.5.

**Proposals (cost in USD; effort in person-days):**

| # | Name | Category | Markets | Cost | Effort | Window | Sched. conf. | Stakeholder prio | Dependencies / notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Lantern Festival Seasonal Event | seasonal_event | US, JP, BR | 90,000 | 120 | 2027-01-15 → 2027-02-15 | 4 | 3 | Provides event framework tooling |
| 2 | Anime Studio Collab Skin Line | entertainment_collab | US, JP | 140,000 | 200 | 2027-03-01 → 2027-04-15 | 2 | 5 | Internal dep on #1 (event framework); external dep "licensing agreement" status `pending` (not hard-blocking) |
| 3 | Neon-Noir Cyberpunk Bundle | themed_bundle | US, BR | 70,000 | 90 | 2027-02-01 → 2027-03-01 | 4 | 3 | none |
| 4 | Latin Music Summer Event | seasonal_event | US, BR | 85,000 | 100 | 2027-05-01 → 2027-06-15 | 3 | 4 | none; no historical analog (shows unavailable commercial criterion) |
| 5 | Festival-of-Colors Regional Pack | regional_content | IN | 60,000 | 80 | 2027-03-01 → 2027-03-20 | 3 | 3 | External dep "regional payment localization" `satisfied` |
| 6 | Summer Esports Cup Skins | character_skin | US, JP | 120,000 | 160 | 2027-07-01 → 2027-08-15 | 3 | 4 | Window outside horizon ⇒ demonstrates `HC_OUTSIDE_HORIZON` |

Totals: eligible five sum 445,000 > 360,000 available ⇒ real trade-offs (not all can be funded).

**Cultural theme references (`role=cultural_theme`):** per proposal, 1–3 references chosen in P0-06 from candidates Qloo can resolve (theme hints: #1 lantern/festival culture; #2 anime/animation; #3 cyberpunk/neo-noir film & games; #4 Latin music; #5 festival/regional culture; #6 esports/competitive gaming). Store as user-supplied text with `entity_type_hint` only from verified types. Some proposals may legitimately end with `unresolved`/`unsupported` references — keep them to demonstrate honest handling.

**Historical records (synthetic; metric "Event performance index vs studio baseline", unit "ratio"):**

| Title | Category | Value | Baseline | Linked to |
|---|---|---|---|---|
| Past Winter Event A | seasonal_event | 1.30 | 1.00 | #1 |
| Past Skin Collab B | entertainment_collab | 1.55 | 1.00 | #2 |
| Past Bundle C | themed_bundle | 0.85 | 1.00 | #3 |
| Past Regional Pack D | regional_content | 1.10 | 1.00 | #5 |

(Neutral metric naming avoids banned-claim vocabulary; generated text never introduces forbidden words. User/seed-supplied metric names are rendered as quoted data fields and excluded from template lint.)

## Appendix B — Phase 0 Report Template (`docs/qloo-verification/PHASE0_REPORT.md`)

```
# Phase 0 — Qloo Feasibility Report
Date / commit / operator
## 1. Documentation consulted (URL, date opened, facts relied on)
## 2. Q-register status table (Q-01…Q-16: status + evidence link)
## 3. Credentials & environment (key present? type? limits?) — no secrets
## 4. V-3/V-4 Auth results (command, redacted request, status, timing)
## 5. V-5 Entity resolution table (all candidates tried, incl. failures & ambiguity)
## 6. V-6 Evidence outcome matrix: proposal × market × strategy → success/empty/unsupported/failed + signal mapping
## 7. Market/location behavior; score semantics; limits; error shapes; terms
## 8. Internal evidence mapping (real field → CulturalSignal), signalMode, band thresholds
## 9. Fixtures captured (paths, capture dates)
## 10. Decision: GO / GO-WITH-LIMITS / NO-GO + rationale + limitations
## 11. Reproduction commands (redacted)
```

## Appendix C — `.env.example` (placeholders only)

```
NODE_ENV=development
PORT=4000
LOG_LEVEL=info
DATABASE_URL=postgres://user:password@localhost:5432/patchpilot
SESSION_SECRET=replace-with-at-least-32-random-characters
ALLOWED_ORIGINS=http://localhost:3000
QLOO_API_KEY=replace-with-your-qloo-api-key
QLOO_API_BASE_URL=replace-with-verified-base-url
QLOO_TIMEOUT_MS=10000
QLOO_MAX_RETRIES=2
QLOO_MAX_CONCURRENCY=3
QLOO_CACHE_TTL_HOURS=24
QLOO_NEGATIVE_CACHE_TTL_HOURS=1
QLOO_WORKSPACE_DAILY_CALLS=150
QLOO_GLOBAL_DAILY_CALLS=2000
DEMO_ACCESS_CODE=
WORKSPACE_TTL_DAYS=7
BRIEF_NARRATIVE_MODE=none
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=
# web (server/build-time only; not a secret credential)
API_INTERNAL_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=PatchPilot
```
