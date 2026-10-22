# PatchPilot — Testing Strategy

| Field | Value |
|---|---|
| Document | `docs/TESTING.md` |
| Version | 1.0 (documentation baseline) |
| Date | 2026-10-22 |
| Authority | Test expectations, commands, and verification procedures. Traceability keys: `AC-*` (PRD), `SEC-*` (SECURITY), `Q-*` (ARCHITECTURE §3). |

**Honesty rule:** a test counts only if it was executed and its result recorded. Results are classed `PASS`, `FAIL`, `NOT RUN`, or `BLOCKED (reason)`. Never report an unexecuted test as passing.

---

## 1. Test Layers and Commands

| Layer | Scope | Tool | Command | Runs in default CI |
|---|---|---|---|---|
| Static | Types, lint, format | tsc, ESLint, Prettier | `pnpm typecheck`, `pnpm lint`, `pnpm format:check` | Yes |
| Unit | Pure logic: engine, normalizers, validators, formatters | Vitest | `pnpm test:unit` | Yes |
| Integration | API + DB (real Postgres) + Qloo **mocked at HTTP level** | Vitest + Supertest + MSW/MockAgent | `pnpm test:integration` | Yes |
| Contract | Adapter parsing vs **sanitized live-captured fixtures**; API schema conformance | Vitest | `pnpm test:contract` | Yes |
| Security | Secret/bundle/log/error leak checks; headers; isolation | Vitest + scripts | `pnpm test:security`, `pnpm check:secrets`, `pnpm check:bundle` | Yes |
| E2E | Browser → web → API → DB; Qloo via **test harness** | Playwright | `pnpm test:e2e` | Yes (harness mode) |
| **Live Qloo** | Real Qloo API | Vitest tagged `@live` + `scripts/qloo-verify` | `pnpm test:live` / `pnpm qloo:verify` | **No** (manual/opt-in; needs `QLOO_API_KEY`) |
| Deployed smoke | Public demo | Playwright/curl script | `pnpm smoke:deployed -- <url>` | Manual |

`pnpm test` = unit + integration + contract + security. Coverage targets: engine ≥ 95% lines/branches; qloo-client ≥ 90%; API modules ≥ 80%.

## 2. Mocking Policy

- **Allowed:** HTTP-level mocking of Qloo in unit/integration tests; `FixtureTransport` located only in `packages/qloo-client/test`; fake clock/ID generators in engine tests.
- **Forbidden:** mocking the decision engine in API integration tests (use real engine); any fixture/mocked transport reachable from the API composition root (SEC-40); presenting fixture results as live in any UI/test assertion.
- **Fixtures** under `packages/qloo-client/test/fixtures/live-captures/` are **sanitized captures of real Qloo responses** produced during Phase 0 via `pnpm qloo:capture`, each with a sidecar `*.meta.json` (`capturedAt`, endpoint, sanitized params, adapterVersion, `Q-xx` references). Handwritten fixtures are allowed only for **error/edge shapes that cannot be safely provoked live**, must live in `fixtures/synthetic-edge/`, and be labeled so in the file name.
- Test data origin label for anything from fixtures: `test_fixture`.

## 3. Real Qloo Integration Verification Procedure (separate from automated tests)

Executed by Antigravity in Phase 0 and re-executed against the deployed configuration in Phase 8. Results go to `docs/qloo-verification/PHASE0_REPORT.md` (and `DEPLOYED_CHECK.md`). **Do not invent results.**

| Step | Procedure | Pass condition | Records |
|---|---|---|---|
| V-1 | Read official Qloo docs; list URLs opened + date | Q-01…Q-16 statuses updated | URLs, excerpts of *facts relied on* (paraphrased) |
| V-2 | Credentials present (`QLOO_API_KEY` set server-side) | Key available or **BLOCKER recorded** | Blocker text if missing |
| V-3 | Authenticated minimal documented call (`pnpm qloo:verify --step=auth`) | 2xx + valid envelope | status, timing, redacted request line |
| V-4 | Negative auth test with deliberately invalid key (once) | Classified `failed_auth`; no key echo | outcome |
| V-5 | Entity resolution for ≥12 candidate references across types (incl. ≥10 game/franchise titles if Q-08 testable) | Table: query → status → top candidates → ambiguity | full table incl. failures |
| V-6 | Evidence strategies S1/S2/S3 for each of the six seed proposals × markets | Outcome per proposal×market: success/empty/unsupported/failed + mapping to signal | table + sanitized captures |
| V-7 | Market/location behavior (Q-09) | Documented supported granularity | notes |
| V-8 | Score semantics (Q-10) | Decision on `signalMode` with rationale | notes |
| V-9 | Limits: pagination, latency, rate-limit signals, error shapes (Q-11, Q-12, Q-15) | Documented | notes |
| V-10 | Terms review for caching/storage/display (Q-13) | Cache policy set | notes |
| V-11 | Normalization check: captured responses parse through adapter into internal model | contract tests green | test output |
| V-12 | GO / GO-WITH-LIMITS / NO-GO decision | See `IMPLEMENTATION.md` §6.4 exit criteria | decision record |

Reproduction commands (names fixed; implemented in Phase 0/1): `pnpm qloo:verify [--step=auth|resolve|insights|all]`, `pnpm qloo:capture`, `pnpm test:live`. All redact secrets and exit non-zero on failure.

## 4. Unit Tests — Decision Engine (`packages/decision-engine`)

| ID | Case | Traces |
|---|---|---|
| ENG-01 | Determinism: same input ⇒ identical output and `inputHash` across 100 runs and with shuffled input array order | AC-D6 |
| ENG-02 | Hard exclusion per code: cost > available budget; effort > hard capacity; outside hard horizon; blocked dependency; ineligible status | AC-D1 |
| ENG-03 | Cascade: excluded internal dependency ⇒ dependents excluded (`HC_DEPENDENCY_EXCLUDED`), including chains | AC-D1 |
| ENG-04 | Advisory capacity/horizon ⇒ warnings only, no exclusion | AC-D1, AC-A3 |
| ENG-05 | Budget selection greedy path: remaining budget arithmetic exact in integer minor units; `REM_BUDGET_INSUFFICIENT` includes shortfall; contingency reserve respected | AC-D2 |
| ENG-06 | Dependency deferral fixpoint: dependency ranked lower than dependent still selected first when fits; unmet ⇒ `deferred_unmet_dependency` | AC-D2 |
| ENG-07 | Missing criteria ⇒ `null`, weights renormalized, `coverage` correct; missing never equals 0 | AC-D5 |
| ENG-08 | Bounds invariant `lower ≤ score ≤ upper` (property test, random inputs) | AC-D5 |
| ENG-09 | `not_observed` signals and failed queries do not reduce cultural relevance; only create uncertainty | AC-D5, AC-T4 |
| ENG-10 | Cultural relevance market weighting; markets without supports excluded from denominator | AC-D4 |
| ENG-11 | Evidence confidence formula components (resolution coverage, market coverage, freshness 0.5 for stale) | AC-D4 |
| ENG-12 | Feasibility components availability; capacity absent ⇒ `effortFit` unavailable not 1 | AC-D4 |
| ENG-13 | Commercial score: same-metric analogs only; mixed metric/unit ⇒ `null`; ratio cap clamp; no value produced without analog | AC-D4, AC-E5 |
| ENG-14 | Tie-breaking total order (score, coverage, cost, id); `NEAR_TIE` flag | AC-D3 |
| ENG-15 | Weight validation: sum≠1 rejected; negative rejected | AC-D3 |
| ENG-16 | **Baseline equivalence property:** `qloo_informed` with cultural + evidence weights 0 ⇒ rankings, scores, selections identical to `baseline` | AC-G4 |
| ENG-17 | Baseline uses identical shared inputs (assert same proposals/constraints/weights snapshot) | AC-G1 |
| ENG-18 | Explanation completeness: every proposal has explanation nodes for each available criterion and each flag/reason; templates only | AC-D7 |
| ENG-19 | Engine purity: no I/O/clock/random (module import test; `Date.now`/`Math.random` stubs throw) | AC-D9 |
| ENG-20 | `diffRuns`: entered/left, rank changes, allocation delta, parameter changes with reason codes | AC-F2 |
| ENG-21 | No output field named/containing revenue, roi, conversion, profit, forecast (schema/key scan) | AC-E5 |
| ENG-22 | Edge: zero proposals, one proposal, all excluded, budget 0, ties, 12 proposals performance (<100 ms) | AC-B5 |
| ENG-23 | `signalMode=score_normalized` uses numeric values only when provided; otherwise falls back to bands | Q-10 |

## 5. Unit/Contract Tests — Qloo Adapter (`packages/qloo-client`)

| ID | Case | Traces |
|---|---|---|
| QC-01 | Request building: params encoded, only verified params emitted, API key only in header, never in URL | AC-Q2/Q3 |
| QC-02 | Auth failure (401/403 per Q-12) ⇒ `failed_auth`, no retry | AC-C4 |
| QC-03 | 429 ⇒ `failed_rate_limited`; honors `Retry-After`; retries bounded; success after retry returns `attempts>1` | AC-Q3 |
| QC-04 | Timeout ⇒ `failed_timeout` after retries; AbortController used | AC-Q3 |
| QC-05 | 5xx ⇒ retry then `failed_upstream`; 4xx (non-429) not retried | AC-Q3 |
| QC-06 | Network error classification | AC-Q3 |
| QC-07 | Empty valid response ⇒ `empty` (distinct from failure) | AC-C4 |
| QC-08 | Unsupported type/filter (pre-rejected locally or by Qloo error) ⇒ `unsupported` | AC-C4, AC-B3 |
| QC-09 | Malformed/shape-drifted response ⇒ `failed_upstream` + `schemaMismatch=true`; no partial invented items | AC-C6 |
| QC-10 | **Parsing of every live-captured fixture** into internal model; snapshot of normalized output | AC-Q4 |
| QC-11 | Provenance fields complete (endpoint, sanitized params, fingerprint, status, retrievedAt, duration, attempts, adapterVersion); fingerprint stable and order-independent | AC-C3 |
| QC-12 | Redaction: sentinel key never appears in provenance, thrown errors, serialized results | SEC-05/06 |
| QC-13 | Circuit breaker opens after threshold; returns `QLOO_UNAVAILABLE` with zero attempts; closes after cooldown; **never returns data** | AC-C6 |
| QC-14 | Concurrency cap respected (max in-flight) | ARCH §6.1 |
| QC-15 | Not configured ⇒ `not_configured` without network call | AC-C7 |
| QC-16 | `FixtureTransport` not exported from package entry | SEC-40 |

## 6. Integration Tests — API (Supertest + real Postgres + mocked Qloo HTTP)

| ID | Workflow | Traces |
|---|---|---|
| API-01 | Workspace creation (+seed): all seeded rows `synthetic_demo`; **no** Qloo evidence/resolutions/signals/runs created by seed | AC-A4, DB §9 |
| API-02 | CRUD + validation errors (field-level) for game, markets, constraints, proposals, dependencies (cycle, self, cross-workspace), currency mismatch, date order, >12 proposals | AC-B4/B5 |
| API-03 | Resolve references: resolved / ambiguous / unresolved / unsupported / failed each persisted with provenance; user chooses candidate | AC-C1/C4 |
| API-04 | Evidence refresh stores queries, items, signals + links; signal without evidence rejected | AC-C2/C3, DB §7 |
| API-05 | Cache: second refresh returns `cached_fresh` with original `retrievedAt`, no new upstream call; forceLive bypasses; stale + live failure ⇒ `cached_stale` + failure notice (never `live`) | AC-C6 |
| API-06 | Qloo failure mid-batch: other proposals succeed; failed ones recorded; no fabricated evidence rows | AC-C6/C7 |
| API-07 | Decision run: snapshot persisted, `inputHash` stable; rerun same inputs ⇒ same output; run immutability (no update route) | AC-D6, AC-F3 |
| API-08 | Replan: budget change ⇒ new run with parent link and correct diff | AC-F1/F2 |
| API-09 | Variants `both` ⇒ comparison endpoint with identical shared inputs | AC-G1/G2 |
| API-10 | Brief generation deterministic content includes all required sections and provenance IDs; Markdown export | AC-E1/E3 |
| API-11 | Brief narrative: valid narrative accepted; narrative with unknown ID / unseen number / banned claim ⇒ rejected, brief still delivered with notice | AC-E2 |
| API-12 | No Qloo configured ⇒ `QLOO_NOT_CONFIGURED`; baseline run still works; status endpoint accurate | AC-C7, AC-Q6 |
| API-13 | Quota: per-workspace and global exhaustion ⇒ `QUOTA_EXCEEDED`; no upstream call made | SEC-21 |
| API-14 | Two-workspace isolation across every route | SEC-30 |
| API-15 | Error envelope conformity for all error classes; no stack/secret/upstream body | SEC-06 |
| API-16 | `/health` and `/ready` behavior (DB down ⇒ not ready; Qloo down ⇒ still ready) | AC-H2 |
| API-17 | Evidence/query log endpoints return sanitized data only | SEC-83 |
| API-18 | Proposal edited after run ⇒ run unchanged; "inputs changed" detection | DB §6 |
| API-19 | Soft-delete of proposal referenced by runs | DB §6 |

## 7. Missing Evidence, Uncertainty, and Commercial-Metric Integrity

| ID | Test | Traces |
|---|---|---|
| INT-01 | Proposal with zero Qloo evidence: cultural criteria `null`; ranking still produced; `LOW_COVERAGE` flag; brief lists "missing evidence" and follow-up questions | AC-D5, AC-E1 |
| INT-02 | Proposal whose queries succeeded but all `not_observed`: shown as "no supporting evidence observed", not low score | AC-T4 |
| INT-03 | No historical records ⇒ commercial criterion unavailable; brief states "no commercial evidence supplied"; **no** revenue/ROI/conversion/profit fields anywhere in run/brief JSON (deep key + text scan) | AC-E5 |
| INT-04 | Banned-claims lint over all generated text (brief markdown, explanations, narrative) with positive corpus (must fail) and negative corpus (must pass) | AC-T6 |
| INT-05 | Raw scores from different queries never compared: UI/engine only use bands unless `score_normalized` verified; test asserts no cross-query numeric comparison in default mode | AC-C8 |
| INT-06 | Synthetic origin propagates: any ranking influenced by `synthetic_demo` input carries the label in output and brief | AC-T3 |

## 8. Baseline vs Qloo-Informed Comparison

COMP-01 identical inputs/constraints/weights snapshot for both variants; COMP-02 baseline criteria `cultural_relevance` and `evidence_confidence` are `null` with reason `variant=baseline`; COMP-03 comparison view lists rank deltas and attributable criteria; COMP-04 comparison text never contains superiority claims (lint on phrases "better", "superior", "outperforms", "higher revenue"); COMP-05 equivalence property (ENG-16).

## 9. Banned-Claim Lint Corpus

Maintained at `packages/shared/src/banned-claims.ts` with tests. Minimum patterns (case-insensitive, word-boundary): `revenue`, `roi`, `return on investment`, `conversion rate`, `profit`, `guarantee(d)?`, `will (increase|boost|drive|generate)`, `proven`, `predict(s|ed|ion)?` (allowed only in the fixed limitation sentence "not a prediction"), `forecast`, `outperform`, `statistically significant`, `accuracy`. The fixed disclaimer strings are whitelisted by exact match. They are defined once in `packages/shared/src/disclaimers.ts` (e.g., the DisclaimerStrip text in `DESIGN.md` §4: "Decision-support hypothesis based on cultural-affinity evidence and your inputs. Not a forecast of sales, revenue, or profit."); the lint compares against these constants, so any edited or paraphrased variant is checked normally. Generated text contains no free-form claims; only templates and validated narrative.

## 10. Frontend Tests

- **Component tests** (Vitest + Testing Library): data-origin badges; evidence cards render `live`/`cached`/`stale`/`synthetic` distinctly; "unavailable" vs "low" visual distinction; empty/loading/error states per screen; budget bar math; disclaimer presence.
- **Accessibility:** axe-core assertions in Playwright on every main screen (0 serious/critical violations); keyboard navigation of the primary workflow; focus management in drawers/dialogs; contrast tokens verified.
- **E2E scenarios** (Playwright; API real; Qloo via harness mode of API test build — a *test-only build flag* that is **absent from production builds**, verified by `check:bundle`/import-graph test):
  - E2E-01 Primary workflow (see §11).
  - E2E-02 Qloo unavailable: banner shows affected functions; baseline run still possible; no fake evidence.
  - E2E-03 Empty/unsupported evidence display.
  - E2E-04 Replan with diff view.
  - E2E-05 Baseline comparison view.
  - E2E-06 Validation errors displayed field-level.
  - E2E-07 Brief export.

## 11. Primary End-to-End Scenario (Phase 7; real Qloo against deployed or local stack)

Run manually with the **real Qloo key** (not harness) and record results in `docs/status/E2E_RESULTS.md`:

1. Fresh workspace; configure game, markets, budget, constraints (or load labeled seed).
2. Six proposals present.
3. Resolve references with real Qloo; handle ambiguous ones.
4. Refresh evidence; inspect provenance (endpoint, params, timestamp, entity IDs).
5. Run decision; read shortlist and explanations.
6. Reduce budget; replan; inspect diff.
7. Change a hard constraint (e.g., horizon) and replan.
8. Baseline vs Qloo-informed comparison.
9. Induce empty/unsupported (a reference with no Qloo match) and view handling.
10. Induce Qloo failure (invalid key in a non-production instance or blocked network) and confirm **no fake live evidence** appears and banner is correct.
11. Inspect briefs/JSON for fabricated commercial metrics (scan).
12. Secret leakage checks: `check:bundle`, log capture grep, response scan, repository history scan.

## 12. Deployment Configuration Tests

DEP-01 API startup fails with actionable message on missing/invalid env (names only); DEP-02 production build succeeds for web and API; DEP-03 migrations apply to fresh DB and drift check passes; DEP-04 `/health`, `/ready` on deployed URL; DEP-05 CORS preflight from allowed vs disallowed origin; DEP-06 cookie flags on deployed responses; DEP-07 `check:bundle` on production artifact; DEP-08 deployed `qloo:verify` equivalent (probe via `/qloo/status?probe=true` + one resolve + one evidence refresh) with results recorded; DEP-09 public repo contains no secrets (history scan).

## 13. Traceability (AC → tests)

| AC group | Tests |
|---|---|
| AC-A* | API-01/02, E2E-01 |
| AC-B* | API-02, ENG-22 |
| AC-C* | API-03…06, QC-*, INT-05 |
| AC-D* | ENG-*, INT-01…03 |
| AC-E* | API-10/11, INT-03/04 |
| AC-F* | API-07/08, ENG-20, E2E-04 |
| AC-G* | API-09, COMP-*, ENG-16/17, E2E-05 |
| AC-H* | API-16, DEP-*, E2E-*, README review |
| AC-Q* | V-1…V-12, QC-10, SEC-40…43 tests, API-12 |
| AC-T* | INT-02/04/06, component tests |

Phase 9 requires this table to be completed with actual statuses.

## 14. Reporting Format (for `docs/status/PROGRESS.md` and final report)

```
Test run <date> <commit>
- typecheck: PASS | FAIL (n errors)
- lint: ...
- unit: X passed / Y failed / Z skipped
- integration: ...
- contract: ...
- security: ...
- e2e: ...
- live-qloo (manual): PASS | FAIL | NOT RUN | BLOCKED(reason)
Failures: <list with first error line>
Untested: <list>
```
