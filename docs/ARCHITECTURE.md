# PatchPilot — Architecture

| Field | Value |
|---|---|
| Document | `docs/ARCHITECTURE.md` |
| Version | 1.0 (documentation baseline) |
| Date | 2026-10-22 |
| Authority | System design, component boundaries, data flow, API contracts, failure modes, technology decisions. |
| Related | `PRD.md` (scope), `DATABASE.md` (schema), `SECURITY.md` (controls), `TESTING.md`, `DESIGN.md`, `CODE_STYLE.md`, `IMPLEMENTATION.md` |

---

## 1. Principles

1. **Qloo is the core intelligence layer.** The adapter is a first-class package, not a plugin or stub.
2. **Evidence integrity over polish.** No invented evidence; no silent fallbacks; provenance everywhere.
3. **Deterministic core.** The decision engine is a pure function; LLMs are optional and strictly downstream.
4. **Simple enough to finish.** Two deployable apps, one database, one external intelligence API. No microservices, queues, vector DBs, or multi-agent systems.
5. **Server-side secrets only.** The browser never sees Qloo or LLM credentials.

## 2. Technology Decisions

| Concern | Decision | Notes / justification |
|---|---|---|
| Language | TypeScript (strict) everywhere | Shared types/schemas across web, API, engine |
| Monorepo | **pnpm workspaces** (no Turborepo/Nx) | Minimal tooling; Node ≥ 20 LTS (confirm at preflight) |
| Frontend | **Next.js (App Router) + React + Tailwind CSS** | Per brief default |
| Backend | **Node.js + Express + TypeScript** | Per brief default |
| Validation | **Zod** (shared schemas in `packages/shared`) | Runtime validation at every boundary |
| Database | **PostgreSQL** (managed) | Justified: relational integrity (proposals↔evidence↔runs), JSONB for sanitized raw responses/snapshots, reproducible runs, multi-session demo persistence |
| DB access | **Drizzle ORM + drizzle-kit migrations** (default) | Typed SQL + versioned SQL migrations. A justified alternative (Kysely/node-pg-migrate) is allowed if recorded in `docs/status/DECISIONS.md` |
| Logging | **pino** (JSON, redaction paths) | See `SECURITY.md` |
| HTTP hardening | helmet, express-rate-limit, cors (allowlist) | See `SECURITY.md` |
| Unit/integration tests | **Vitest** (+ Supertest for API, MSW or `undici` MockAgent for HTTP mocking) | Mocks only in isolated tests |
| E2E | **Playwright** | Runs against real API + test DB; Qloo via test harness only |
| Lint/format | ESLint (typescript-eslint, strict) + Prettier | `CODE_STYLE.md` |
| LLM (optional) | Provider-agnostic `NarrativeProvider` interface, **off by default** | Strictly downstream; validated |
| Hosting (defaults, any equivalent allowed) | Web: Vercel-class host. API: Render/Railway/Fly-class container host. DB: Neon/Supabase/Render-class managed Postgres | Hosting is **not verified** by the author; Antigravity verifies availability and records it |

Deviation protocol: any deviation is recorded in `docs/status/DECISIONS.md` (ID, date, reason, alternatives, impact on other docs) **before** being implemented.

## 3. Qloo Verification Register (authoritative list of unverified assumptions)

**Provenance of this register.** The author performed a single web search. It returned only *third-party* material (a community MCP server repository built for the Qloo Agentic Hackathon, `NoBanks/qloo-mcp`, as indexed by glama.ai) and generic Qloo marketing pages. The author did **not** open or verify official Qloo API documentation. Items below marked "reportedly" come from that third-party description and **must be treated as unverified hypotheses**. The third-party README cites a hackathon developer guide at `https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide`; that URL is recorded here *as cited by the third-party source* and has **not** been opened by the author.

| ID | Item | What is assumed (unverified) | Must be verified in Phase 0 by |
|---|---|---|---|
| Q-01 | Base URL(s) | Hackathon host reportedly `https://hackathon.api.qloo.com`; production host unknown | Official docs + live call; record in `docs/qloo-verification/PHASE0_REPORT.md` |
| Q-02 | Authentication | Reportedly API key sent in an `X-Api-Key` request header | Authenticated call + negative test with invalid key |
| Q-03 | Entity search | Reportedly `GET /search` with a text query returning entity candidates with IDs/types | Live call; record params (type filter, limit) |
| Q-04 | Tag search | Reportedly `GET /v2/tags` resolving keyword/genre names to tag IDs | Live call |
| Q-05 | Insights | Reportedly `GET /v2/insights` with an entity-type filter and signals (entities, tags, demographics, location) | Live call; record exact parameter names, required/optional |
| Q-06 | Demographic insights | Reportedly insights with a demographics type returning age/gender affinity | Live call |
| Q-07 | Tag insights | Reportedly insights with a tag type describing taste of entities/audience/location | Live call |
| Q-08 | Video-game entity support | Unknown whether games are a supported entity type and how well covered | Live resolution of ≥10 game/franchise titles; record |
| Q-09 | Market/location semantics | Unknown granularity (country vs city), format, and effect on results | Live calls for each seed market |
| Q-10 | Score semantics | Unknown meaning/scale of any affinity/score fields; within- vs cross-query comparability | Inspect fields; docs; empirical checks; decide `signalMode` |
| Q-11 | Rate limits/quotas | Unknown | Docs + observed headers/behavior; set `QLOO_*` budgets |
| Q-12 | Error shapes/status codes | Unknown | Provoke 400/401/404/429-like cases safely; record |
| Q-13 | Terms of use | Whether caching, storing, redisplaying, and public demo use are permitted for the key type | Read terms; record; set cache TTL accordingly |
| Q-14 | Key type | Hackathon key vs production key: scope, expiry, quotas | Credential acquisition notes |
| Q-15 | Pagination/limits | Unknown result-size parameters and maximums | Live calls |
| Q-16 | Provenance fields | Which response fields (IDs, versions, timestamps, explanations) exist | Inspect real responses |

**Rule:** Antigravity updates this table (status → `VERIFIED`, `VERIFIED-WITH-LIMITS`, `REFUTED`, `BLOCKED`) with a link to evidence in the Phase 0 report. Until then, endpoint-level code is written against the *documented-after-verification* behavior only. If an item is `REFUTED`, the affected design sections are revised via `DECISIONS.md`.

## 4. System Context and Topology

```
                         ┌──────────────────────────────────────────┐
  Browser ──HTTPS──▶     │  apps/web  (Next.js, SSR/CSR UI)         │
  (no secrets)           │  - same-origin /api/* → rewrite to API   │
                         └───────────────┬──────────────────────────┘
                                         │ server-side rewrite (API_INTERNAL_URL)
                         ┌───────────────▼──────────────────────────┐
                         │  apps/api  (Express)                     │
                         │  ├─ http layer: validation, auth/session,│
                         │  │   rate limit, error envelope          │
                         │  ├─ modules: workspace, proposals,       │
                         │  │   qloo, decision, briefs, history     │
                         │  ├─ packages/qloo-client  (adapter)      │──HTTPS──▶ Qloo API
                         │  ├─ packages/decision-engine (pure)      │
                         │  ├─ narrative (optional LLM, validated)  │──HTTPS──▶ LLM provider (optional)
                         │  └─ db (Drizzle)                         │
                         └───────────────┬──────────────────────────┘
                                         │ TLS
                         ┌───────────────▼──────────────────────────┐
                         │  PostgreSQL (managed)                    │
                         └──────────────────────────────────────────┘
```

**Why same-origin rewrite:** the session cookie is first-party (`SameSite=Lax`, `HttpOnly`, `Secure`), CORS surface is minimal, and no API URL is exposed via `NEXT_PUBLIC_*`. `API_INTERNAL_URL` is a build/server-time variable on the web host (private; not a secret credential). The API additionally enforces a CORS allowlist for direct access.

**Secrets live only on the API host:** `QLOO_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, optional `LLM_API_KEY`, optional `DEMO_ACCESS_CODE`.

## 5. Repository Layout (target)

```
patchpilot/
├─ AGENTS.md                 # copy/pointer of docs/AGENTS.md at repo root
├─ README.md  LICENSE  .env.example  .gitignore  pnpm-workspace.yaml
├─ docs/                     # the nine documents + status/ + qloo-verification/
│  ├─ status/ (PROGRESS.md, DECISIONS.md, CONFLICTS.md, FINAL_REPORT.md)
│  └─ qloo-verification/ (PHASE0_REPORT.md, commands.md)
├─ apps/
│  ├─ web/                   # Next.js App Router
│  └─ api/                   # Express (src/http, src/modules/*, src/db, src/config, src/observability)
├─ packages/
│  ├─ shared/                # zod schemas, enums, DTO types, error codes, banned-claims list
│  ├─ qloo-client/           # adapter (+ test/fixtures/live-captures)
│  └─ decision-engine/       # pure TS, no I/O
├─ scripts/                  # qloo-verify, seed, check-secrets, check-bundle
└─ e2e/                      # Playwright
```

Dependency direction (enforced by lint `no-restricted-imports`): `shared` ← `decision-engine`, `qloo-client` ← `apps/api` ; `shared` ← `apps/web`. `apps/web` **must not** import `qloo-client`, `decision-engine` internals, or `db`. `decision-engine` imports only `shared`.

## 6. Components and Responsibilities

### 6.1 `packages/qloo-client` (first-class Qloo adapter)

Responsibilities: HTTP to Qloo; authentication; typed requests; two-stage response parsing; normalization into the internal evidence model; error classification; timeouts; bounded retries; rate-limit handling; concurrency cap; request fingerprinting; sanitization/redaction.

**Public interface (TypeScript signature level; types finalized after Phase 0):**

```ts
interface QlooClient {
  searchEntities(req: EntitySearchRequest, ctx: CallContext): Promise<QlooResult<EntityCandidate[]>>;
  searchTags(req: TagSearchRequest, ctx: CallContext): Promise<QlooResult<TagCandidate[]>>;
  getInsights(req: InsightsRequest, ctx: CallContext): Promise<QlooResult<InsightItem[]>>;
  probe(ctx: CallContext): Promise<QlooResult<ProbeInfo>>; // minimal documented call for status
}

type QlooResult<T> =
  | { ok: true;  status: 'success' | 'empty'; data: T; provenance: QlooProvenance }
  | { ok: false; status: QlooFailureStatus; error: QlooErrorInfo; provenance: QlooProvenance };

type QlooFailureStatus =
  | 'unsupported' | 'invalid_request' | 'failed_auth' | 'failed_rate_limited'
  | 'failed_timeout' | 'failed_network' | 'failed_upstream' | 'not_configured';

interface QlooProvenance {
  endpoint: string;                 // path only
  sanitizedParams: Record<string, string | string[]>;  // no secrets
  requestFingerprint: string;       // sha256 of canonical endpoint+params
  httpStatus: number | null;
  retrievedAt: string;              // ISO-8601 UTC, time of live retrieval
  durationMs: number;
  attempts: number;
  adapterVersion: string;
  qloo: { requestId?: string; apiVersion?: string };  // only if Q-16 verifies presence
  rawResponse?: unknown;            // redacted, size-capped; stored by caller
  schemaMismatch?: boolean;         // envelope drift detected
}
```

Rules:
- Endpoint paths, parameter names, and enum values are **constants in one file** (`endpoints.ts`) populated **only from Phase 0 verified behavior**. The author-supplied hypotheses in §3 are not to be copied as truth.
- **Two-stage parsing:** (1) permissive envelope schema (`passthrough`) to detect shape drift → classify `failed_upstream` + `schemaMismatch=true`; (2) strict schema for fields the product consumes. Unknown extra fields are preserved only in the redacted raw payload.
- **Status semantics:** `success` = valid response with ≥1 usable item; `empty` = valid response with zero items; `unsupported` = request rejected by Qloo as unsupported/invalid for that entity type or filter (per Q-12) or locally pre-rejected using verified capability tables; `failed_*` = transport/auth/rate/upstream; `not_configured` = no key.
- **Retries:** GET only; retry on network errors, timeouts, 5xx, and 429 (respect `Retry-After` if present per Q-11/Q-12); max `QLOO_MAX_RETRIES` (default 2), exponential backoff with jitter; **never** retry 400/401/403/404. Total call budget respected.
- **Timeout:** `QLOO_TIMEOUT_MS` (default 10000) per attempt via `AbortController`.
- **Concurrency:** adapter-level semaphore `QLOO_MAX_CONCURRENCY` (default 3).
- **Circuit breaker (light):** after `QLOO_BREAKER_THRESHOLD` (default 5) consecutive `failed_*` results, short-circuit for `QLOO_BREAKER_COOLDOWN_MS` (default 30000) returning `failed_upstream` with `error.code=QLOO_UNAVAILABLE` and `provenance.attempts=0`; never fabricates data.
- **Redaction:** headers and the API key are never present in provenance, logs, errors, or stored raw responses. Unit test enforces.
- The adapter has **no database dependency**. Persistence, caching, and quota accounting live in `apps/api/src/modules/qloo`.
- A `FixtureTransport` exists **only under `packages/qloo-client/test`** for isolated tests; it is not exported from the package entrypoint and the API's composition root cannot select it (§12).

### 6.2 `apps/api/src/modules/qloo` (Qloo service layer)

Orchestrates: reference resolution, evidence retrieval per proposal × market using **verified strategies** (§7), cache lookup/write, quota accounting, persistence of `qloo_queries` / `qloo_evidence_items`, signal extraction, and status reporting.

Cache and freshness policy (subject to Q-13):
- Cache key = `requestFingerprint`. Cache scope: global across workspaces **only if Q-13 permits**; otherwise per workspace.
- TTL `QLOO_CACHE_TTL_HOURS` (default 24; reduce/disable if terms require).
- **Freshness states:** `live` (retrieved during this request), `cached_fresh` (within TTL), `cached_stale` (beyond TTL).
- Normal path: fresh cache hit → return as `cached_qloo` with original `retrievedAt`. Miss/stale → live call.
- Live failure with stale cache available → return stale as `cached_stale` **plus** an explicit failure notice and the failure class; UI shows banner; engine applies freshness factor 0.5 to evidence confidence. Never labeled `live_qloo`.
- User action "Force live refresh" bypasses cache (counted against quota).
- Empty/unsupported results are cached for a shorter TTL (`QLOO_NEGATIVE_CACHE_TTL_HOURS`, default 1) to avoid repeated spend; failures are never cached.

Quota accounting: per-workspace (`QLOO_WORKSPACE_DAILY_CALLS`, default 150) and global (`QLOO_GLOBAL_DAILY_CALLS`, default 2000) counters; exceeding returns `RATE_LIMITED`-class error with explanation (no fabricated fallback).

### 6.3 `packages/decision-engine`

Pure functions. No I/O, no clock reads, no randomness, no LLM. Details in §8. Public API:

```ts
runDecision(input: DecisionInput): DecisionOutput;        // both variants when requested
diffRuns(a: DecisionOutput, b: DecisionOutput): RunDiff;
computeInputHash(input: DecisionInput): string;           // canonical JSON → sha256
ENGINE_VERSION: string;
```

### 6.4 `apps/api/src/modules/decision`

Builds `DecisionInput` snapshots from DB (proposals, constraints, markets, signals, analogs), calls the engine, persists `decision_runs` + `decision_rankings`, links replans (`parent_run_id`), computes diffs.

### 6.5 `apps/api/src/modules/briefs`

1. **Deterministic brief builder**: pure transformation of a stored run + referenced evidence into `DecisionBrief` JSON + Markdown rendering. Contains all facts.
2. **Optional narrative** (`BRIEF_NARRATIVE_MODE=llm`): the `NarrativeProvider` receives *only* a structured, ID-addressed evidence packet and must return JSON of the form `{sections:[{proposalId, text, citedIds[]}]}`. A validator (§9) rejects/discards narrative that cites unknown IDs, contains numbers not present in the packet, or violates banned-claim lint. On failure the brief is delivered with the deterministic content and a visible notice.

### 6.6 `apps/api/src/http`

Express app: request ID, pino-http, helmet, CORS allowlist, JSON body limit, session middleware, rate limiters, Zod validation middleware, central error handler producing the error envelope (§11), 404 handler. **No business logic.**

### 6.7 `apps/web`

Next.js UI per `DESIGN.md`. Uses typed API client from `packages/shared`. Server components may fetch via `API_INTERNAL_URL`; client components call same-origin `/api/v1/*`. No secrets. No direct Qloo calls.

## 7. Qloo Evidence Strategies (candidates; selection is a Phase 0 outcome)

The decision workflow needs, per **proposal × market**, evidence that the proposal's cultural references have a defensible affinity relationship with the **game's audience** in that market. Because Q-05…Q-09 are unverified, three candidate strategies are defined. Phase 0 tests each and records which are usable; the product ships only with strategies that returned valid, interpretable data.

| ID | Strategy | Idea (parameter names are placeholders until verified) | Resulting signal |
|---|---|---|---|
| S1 | **Anchor co-affinity** | Use the game's *audience anchor references* (resolved entities, e.g., titles the audience is known to like) as signal; request entities of the proposal reference's type; check whether the proposal's resolved reference appears and at what rank/score | `supports` with band from rank percentile (or normalized score if Q-10 allows) |
| S2 | **Market-conditioned affinity** | S1 additionally conditioned on market location/demographic signals (Q-09) | per-market `supports` / `not_observed` |
| S3 | **Tag overlap** | Resolve tags for the game and for the proposal reference; compare tag sets from tag-insights (Q-07) | `supports` with band from overlap measure (documented formula after Phase 0) |

Rules:
- A strategy is **enabled** only if Phase 0 shows valid responses and documents how to map results to `strengthBand`.
- `not_observed` (query succeeded, reference not among results) is **not negative evidence**; it contributes nothing to cultural relevance and is displayed as "no supporting evidence observed in top-N results (depth N)".
- Strategy parameters (N, thresholds, band cut-offs) live in a versioned file `packages/shared/src/qloo-signal-config.ts` (`SIGNAL_CONFIG_VERSION`). Changing it bumps the version and is recorded on every signal and run.
- If no strategy is viable for any proposal, Phase 0 outcome is **NO-GO** (stop and diagnose).

**Signal normalization contract (engine input):**

```ts
interface CulturalSignal {
  id: string;                         // uuid
  proposalId: string; marketId: string;
  strategy: 'S1' | 'S2' | 'S3';       // only enabled strategies
  direction: 'supports' | 'not_observed';
  strengthBand: 'strong' | 'moderate' | 'weak' | null;   // null iff not_observed
  strengthValue: number | null;       // 0..1 ONLY when signalMode === 'score_normalized' (Q-10 verified)
  basis: string;                      // human-readable derivation, deterministic template
  evidenceItemIds: string[];          // links to qloo_evidence_items (required, non-empty)
  queryIds: string[];                 // links to qloo_queries
  freshness: 'live' | 'cached_fresh' | 'cached_stale';
  dataOrigin: 'system_derived';
  signalConfigVersion: string;
}
```

`signalMode` ∈ {`tiered` (default), `score_normalized` (only if Q-10 verified as comparable within and across the relevant queries)}.

## 8. Decision Engine Specification

### 8.1 Inputs (`DecisionInput`)

`{ engineVersion, signalConfigVersion, currency, constraints, markets[], proposals[], dependencies[], signals[], analogs[], weights, options{ variants: 'qloo_informed'|'baseline'|'both', minCoverage, tieEpsilon, bandValues, commercialRatioCap, signalMode } }`

All monetary values are **integer minor units**. Dates are ISO dates. The input must contain everything the engine needs; the engine reads no clock.

### 8.2 Step 1 — Eligibility and hard constraints

Reason codes (each excluded proposal lists all that apply; excluded proposals have `rank=null`):

| Code | Condition |
|---|---|
| `HC_STATUS_INELIGIBLE` | status ∈ {`rejected`, `shipped`} |
| `HC_COST_EXCEEDS_BUDGET` | cost > `budgetTotal − contingencyReserve` |
| `HC_EFFORT_EXCEEDS_CAPACITY` | capacity set, `capacityEnforcement='hard'`, effort > capacity |
| `HC_OUTSIDE_HORIZON` | `horizonEnforcement='hard'` and window not fully inside horizon |
| `HC_BLOCKED_DEPENDENCY` | has dependency with `status='blocked'` and `isHardBlocking=true` |
| `HC_DEPENDENCY_EXCLUDED` | internal dependency is excluded (computed to a fixpoint) |

Advisory enforcement for capacity/horizon yields **warnings** (`WARN_EFFORT_EXCEEDS_CAPACITY`, `WARN_OUTSIDE_HORIZON`) and no exclusion. **Budget is always a hard limit on the portfolio** (you cannot allocate more than exists).

### 8.3 Step 2 — Criterion scores (each in [0,1] or `null` = unavailable)

Default weights (sum = 1.00; user-adjustable, validated):

| Key | Criterion | Default weight | Why it matters |
|---|---|---|---|
| `cultural_relevance` | Cultural relevance (Qloo) | 0.30 | Core hypothesis: culturally resonant content is worth investigating |
| `evidence_confidence` | Cultural evidence quality (Qloo) | 0.10 | Keeps *strength of evidence* separate from *strength of affinity* |
| `feasibility` | Operational feasibility | 0.25 | Budget, effort, schedule and dependency risk are real constraints |
| `commercial_evidence` | Historical commercial analog | 0.20 | Uses only studio-supplied history; analog, not forecast |
| `stakeholder_priority` | Stakeholder priority (subjective) | 0.15 | Captures strategic judgment explicitly, labeled subjective |

**`cultural_relevance`** per proposal: for each target market *m* with normalized weight *w_m*, market value *v_m* = mean of band values over that market's `supports` signals (default `strong=1.0, moderate=0.66, weak=0.33`; in `score_normalized` mode use `strengthValue`). If the market has no `supports` signals, *v_m* = `null`. Score = Σ(w_m·v_m)/Σ(w_m) over markets with non-null *v_m*; `null` if none. `not_observed` and failed queries never produce 0.

**`evidence_confidence`** = 0.4·resolutionCoverage + 0.4·marketCoverage + 0.2·freshnessFactor, where resolutionCoverage = resolved references / user-supplied references (references of types marked unsupported count in the denominator), marketCoverage = markets with ≥1 successful query / target markets, freshnessFactor = 1.0 (live/cached_fresh) or 0.5 (any cached_stale used). `null` if no Qloo query for the proposal succeeded (attempted-but-failed ≠ low confidence in culture; it is *no evidence*, shown as uncertainty).

**`feasibility`** = mean of available components: `budgetEfficiency = clamp(1 − cost/(budgetTotal − reserve), 0, 1)`; `effortFit = clamp(1 − effort/capacity, 0, 1)` (if capacity set); `scheduleConfidence = (s−1)/4` (if provided); `dependencyReadiness = satisfied/total` (1 if no dependencies).

**`commercial_evidence`**: from linked analog historical records of the **same metric name and unit**: ratio *r* = mean(value/baselineValue); score = clamp(*r* / `commercialRatioCap`, 0, 1) with default cap 2.0 (ratio 1.0 ⇒ 0.5). `null` if no analog, or mixed metrics. Labeled "analog-based heuristic, not a forecast". Origin label inherited (`user_supplied` / `synthetic_demo`).

**`stakeholder_priority`** = (p−1)/4; `null` if absent. Labeled subjective.

### 8.4 Step 3 — Aggregation, bounds, ranking

For proposal *i* with available criteria set *A_i*:
- `coverage_i = Σ_{k∈A_i} w_k`
- `score_i = Σ_{k∈A_i} w_k·S_k / coverage_i` (if `coverage_i = 0` ⇒ unscored; flagged `NO_EVIDENCE`)
- `scoreLower_i = Σ_{k∈A_i} w_k·S_k` (missing treated as 0); `scoreUpper_i = scoreLower_i + (1 − coverage_i)` (missing treated as 1). Invariant: `lower ≤ score ≤ upper` (property-tested).
- Flags: `LOW_COVERAGE` if `coverage_i < minCoverage` (default 0.5); `NEAR_TIE` if |score difference to adjacent rank| < `tieEpsilon` (default 0.02).
- **Rank order:** score desc → coverage desc → cost asc → proposalId asc (total order ⇒ deterministic).

### 8.5 Step 4 — Budget-constrained selection (greedy in rank order)

Remaining budget = `budgetTotal − reserve`; remaining capacity if hard. Iterate eligible proposals in rank order; select when `cost ≤ remainingBudget`, effort fits (if hard), `maxSelections` not exceeded, and **all internal dependencies are already selected** (or marked satisfied). Proposals blocked only by a not-yet-selected dependency are `deferred` and re-evaluated in repeated passes until no change (fixpoint). Final statuses: `selected`, `not_funded` (with reason `REM_BUDGET_INSUFFICIENT` / `REM_CAPACITY_INSUFFICIENT` / `REM_MAX_SELECTIONS`, including numbers), `deferred_unmet_dependency`, `excluded` (hard constraint codes).

Trade-off visibility: for every `not_funded` proposal the output states which selected proposals consumed the budget it needed (greedy path), and the shortfall amount. Greedy-by-rank is a deliberate explainability choice; optimal knapsack is a **non-goal**.

### 8.6 Variants and baseline fairness

- `qloo_informed`: all criteria above.
- `baseline`: identical proposals, constraints, weights, options; `cultural_relevance` and `evidence_confidence` forced `null`. Remaining weights renormalize via §8.4. Property: `qloo_informed` with weights for those two criteria set to 0 ≡ `baseline`.
- Comparison output: per proposal `baselineRank`, `qlooRank`, delta, selection-status change, and `criterionContribution` showing which criteria account for score differences.

### 8.7 Output (`DecisionOutput`)

`{ engineVersion, inputHash, variants: { baseline?, qloo_informed? }, each: { rankings[], portfolio{selectedIds, budgetUsed, budgetRemaining, effortUsed, utilization}, exclusions[], warnings[], assumptions[], methodology{formulaVersion, weightsUsed} } }`

Each ranking: `{ proposalId, rank|null, score|null, scoreLower, scoreUpper, coverage, criteria:{key:{value|null, available, weight, contribution, origin, notes}}, flags[], status, reasonCodes[], explanation: ExplanationNode[] }`. Explanations are generated from **fixed templates** (no free text from LLM).

### 8.8 Re-plan diff (`RunDiff`)

`{ parameterChanges[], enteredShortlist[], leftShortlist[], rankChanges[{proposalId, from, to}], allocationChange{budgetUsedFrom,To, ...}, reasonChanges[] }` — each entry carries reason codes and a deterministic sentence.

### 8.9 Limitations (must appear in UI and brief)

Heuristic weights are defaults, not learned or validated; affinity ≠ purchase intent; analog commercial ratios are descriptive; greedy selection is not globally optimal; evidence depth is limited by Qloo coverage and top-N cut-offs.

## 9. LLM Narrative Validation (optional layer)

Packet: JSON of run facts with stable IDs. Output schema validated with Zod. Validators: (1) all `citedIds` exist in the packet; (2) every numeric token in text appears in the packet (after formatting normalization) or is an ordinal; (3) banned-claim lint (`packages/shared/src/banned-claims.ts`) passes; (4) text does not reference entities absent from the packet; (5) length caps. Any failure ⇒ narrative discarded (`narrative=null`, `narrativeMeta.status='rejected'`, reasons stored). LLM is never invoked on the scoring path. Prompt text instructs: use only supplied facts; no causal claims about sales.

## 10. Data Flow (end-to-end)

1. **Input** → API validates (Zod) → persists proposals/references/constraints (`user_supplied` or `synthetic_demo`).
2. **Resolve** → `qloo` module → adapter `searchEntities` → persist `qloo_queries` + `reference_resolutions` (candidates, chosen entity or `ambiguous`/`unresolved`/`unsupported`/`failed`). Ambiguous ones await user choice.
3. **Retrieve evidence** → for each proposal × market × enabled strategy: cache check → adapter call → persist query + normalized `qloo_evidence_items` → derive `cultural_signals` (+ links).
4. **Decide** → decision module snapshots inputs → engine → persist run + rankings (+ both variants).
5. **Brief** → deterministic builder → persist `briefs` (+ optional validated narrative).
6. **Replan** → new run with `parent_run_id` → diff computed on read (pure) and cached in run row.
7. **UI** renders from API; every number links to its source IDs.

## 11. API Contract

Base path `/api/v1`. JSON only. Auth: anonymous workspace session cookie `pp_session` (HttpOnly, Secure, SameSite=Lax, signed). All resources are **scoped to the session's workspace**; cross-workspace access returns `NOT_FOUND`. Money fields are `...Minor` integers + `currency`. Dates ISO-8601.

### 11.1 Error envelope (all non-2xx)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human-readable, safe message",
  "details": [{ "path": "estimatedCostMinor", "issue": "must be >= 0" }],
  "requestId": "req_...", "retryable": false } }
```

Codes → HTTP: `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `UNPROCESSABLE` 422 (semantic, e.g. dependency cycle, `DECISION_INPUT_INVALID`) · `RATE_LIMITED` 429 · `QLOO_NOT_CONFIGURED` 503 · `QLOO_AUTH_FAILED` 502 · `QLOO_RATE_LIMITED` 503 (with `retryAfterSeconds` if known) · `QLOO_TIMEOUT` 504 · `QLOO_UPSTREAM_ERROR` 502 · `QLOO_UNSUPPORTED_QUERY` 422 · `QLOO_UNAVAILABLE` 503 · `QUOTA_EXCEEDED` 429 · `BRIEF_NARRATIVE_REJECTED` (not an error response; reported in brief metadata) · `INTERNAL_ERROR` 500. Messages never contain secrets, stack traces, raw upstream bodies, or SQL.

### 11.2 Endpoints

| Method & path | Purpose | Notes |
|---|---|---|
| `GET /health` | Liveness | No dependencies |
| `GET /ready` | Readiness | DB check + config validity; **does not require live Qloo** |
| `POST /workspaces` | Create anonymous workspace, set cookie; body `{seedDemo: boolean, accessCode?}` | Seeds synthetic demo data when `seedDemo` |
| `GET /workspace` | Current workspace summary + quota usage | |
| `GET/PUT /game` | The single game | |
| `GET/POST /markets` · `PUT/DELETE /markets/:id` | Target markets | |
| `GET/PUT /constraints` | Planning constraints | |
| `GET/POST /proposals` · `GET/PUT/DELETE /proposals/:id` | Proposals (incl. nested `markets`, `dependencies`) | |
| `POST /proposals/:id/references` · `PUT/DELETE /references/:refId` | User-supplied references (proposal- or game-owned) | |
| `GET/POST /historical-records` · `PUT/DELETE /historical-records/:id` · `PUT /proposals/:id/analogs` | Studio historical performance + analog links | |
| `GET /qloo/status?probe=false\|true` | Integration status; `probe=true` makes one live minimal call (rate-limited) | |
| `POST /qloo/resolve` | Body `{referenceIds?: string[], forceLive?: boolean}` → resolution results | |
| `POST /references/:refId/resolution/choose` | Body `{qlooEntityId}` — user picks among ambiguous candidates | |
| `POST /qloo/evidence/refresh` | Body `{proposalIds?, marketIds?, forceLive?}` → per-query outcomes | |
| `GET /proposals/:id/evidence` | Queries, evidence items, signals, outcomes | Includes provenance |
| `GET /qloo/queries` | Query log (sanitized) | |
| `POST /decision-runs` | Body `{label?, variants:'qloo_informed'\|'baseline'\|'both', weights?, constraintsOverride?, parentRunId?}` | Snapshots inputs |
| `GET /decision-runs` · `GET /decision-runs/:id` | List/detail | |
| `GET /decision-runs/:id/diff/:otherId` | Run diff | |
| `POST /decision-runs/:id/replan` | Body overrides → new linked run + diff to parent | |
| `GET /decision-runs/:id/comparison` | Baseline vs Qloo-informed view model | requires variants `both` |
| `POST /decision-runs/:id/briefs` | Body `{narrative: 'none'\|'llm'}` → brief | |
| `GET /briefs/:id` · `GET /briefs/:id/export?format=md` | Brief JSON / Markdown | |

Each response includes `dataOrigin` for every record and `requestId` in headers (`X-Request-Id`). Request/response Zod schemas live in `packages/shared` and are the single contract used by API validation, web client types, and contract tests.

## 12. Environment Configuration

Validated at API startup by a Zod schema; failure ⇒ process exits with an actionable message listing missing/invalid **names** (never values).

| Variable | Where | Required | Description |
|---|---|---|---|
| `NODE_ENV` | api, web | yes | `development`/`test`/`production` |
| `PORT` | api | no (default 4000) | Listen port |
| `LOG_LEVEL` | api | no (`info`) | pino level |
| `DATABASE_URL` | api | yes | Postgres connection string (placeholder in `.env.example`) |
| `SESSION_SECRET` | api | yes (≥32 chars) | Cookie signing |
| `ALLOWED_ORIGINS` | api | yes in prod | Comma-separated CORS allowlist |
| `QLOO_API_KEY` | api | yes for live Qloo | Server-side secret |
| `QLOO_API_BASE_URL` | api | yes (value from Phase 0, Q-01) | No default shipped as truth |
| `QLOO_TIMEOUT_MS` · `QLOO_MAX_RETRIES` · `QLOO_MAX_CONCURRENCY` | api | no | Defaults above |
| `QLOO_BREAKER_THRESHOLD` · `QLOO_BREAKER_COOLDOWN_MS` | api | no | Defaults above |
| `QLOO_CACHE_TTL_HOURS` · `QLOO_NEGATIVE_CACHE_TTL_HOURS` | api | no | 24 / 1 (adjust per Q-13) |
| `QLOO_WORKSPACE_DAILY_CALLS` · `QLOO_GLOBAL_DAILY_CALLS` | api | no | 150 / 2000 (adjust per Q-11) |
| `DEMO_ACCESS_CODE` | api | no | If set, required to create workspaces / force live refresh |
| `WORKSPACE_TTL_DAYS` | api | no (7) | Purge expired workspaces |
| `BRIEF_NARRATIVE_MODE` | api | no (`none`) | `none` or `llm` |
| `LLM_PROVIDER` · `LLM_API_KEY` · `LLM_MODEL` | api | only if `llm` | Optional narrative layer |
| `API_INTERNAL_URL` | web (server/build) | yes | Where Next rewrites `/api/*` |
| `NEXT_PUBLIC_APP_NAME` | web | no | Non-secret label. **No other `NEXT_PUBLIC_*` variable may carry anything secret; none may start with `QLOO`.** |

There is **no** environment flag that switches the production/demo path to fixtures. `FixtureTransport` is importable only from test files.

## 13. Validation and Authorization Boundaries

- **Boundary 1 (HTTP):** Zod validation of body/query/params; body size limit (100 KB); string length caps; enum checks.
- **Boundary 2 (domain):** semantic validation (currency consistency, date ordering, dependency graph acyclicity, ≤12 proposals, market weights).
- **Boundary 3 (engine):** `DecisionInput` re-validated; invalid ⇒ `DECISION_INPUT_INVALID` (422).
- **Authorization:** workspace scoping on every query (`WHERE workspace_id = $session`); repository layer functions require `workspaceId` parameter (no unscoped finders). Optional `DEMO_ACCESS_CODE`. No admin endpoints in MVP.

## 14. Failure Modes and Isolation

| Failure | Behavior | User-visible result |
|---|---|---|
| Qloo not configured | `QLOO_NOT_CONFIGURED`; Qloo-dependent actions disabled; non-Qloo workflow still available | Banner listing affected features; baseline ranking still runnable |
| Qloo auth failure | `QLOO_AUTH_FAILED`; breaker; status shows `failed_auth` | Banner; no evidence produced |
| Timeout/5xx/network | Bounded retries; then `failed_*` stored in query log | Per-query failure rows; partial evidence retained |
| Rate limited (Qloo or local quota) | Backoff/`Retry-After`; else surface | Message with retry guidance |
| Empty result | Stored as `empty` | "No results returned" (distinct from failure) |
| Unsupported query/type | Stored as `unsupported` | "Not supported by Qloo for this entity type/market" |
| Ambiguous resolution | `ambiguous` with candidates | Chooser UI |
| Schema drift | `failed_upstream` + `schemaMismatch` | Integration status warning |
| Stale cache served after failure | Labeled `cached_stale` + failure notice | Banner + timestamp |
| DB unavailable | `/ready` fails; 503 for dependent requests | Error state |
| LLM failure/rejection | Narrative omitted | Notice; deterministic brief intact |
| Partial evidence for run | Engine treats missing as unavailable | Coverage/uncertainty shown |

Failures in one proposal's Qloo retrieval do not abort others (per-item isolation with `Promise.allSettled` semantics inside the concurrency limit).

## 15. Observability and Safe Logging

- Structured pino logs with `requestId`, route, status, duration, workspace short-hash. **Never** log request bodies by default, Qloo headers, API keys, cookies, raw upstream bodies, or full prompts.
- Qloo call log fields: endpoint path, status class, duration, attempts, cache state, fingerprint prefix (8 chars).
- In-process counters/gauges (calls by status, latency p50/p95 over recent window) surfaced via `GET /qloo/status`.
- Pino redaction paths configured for `*.apiKey`, `headers.authorization`, `headers.cookie`, `headers['x-api-key']`, `QLOO_API_KEY`, `SESSION_SECRET`, `DATABASE_URL`.
- No third-party analytics/error-tracking in MVP unless redaction is verified and recorded in `DECISIONS.md`.

## 16. Provenance Preservation (summary)

Every Qloo call → `qloo_queries` row (endpoint, sanitized params, fingerprint, status, retrievedAt, duration, attempts, adapterVersion, cache state, redacted raw). Normalized items → `qloo_evidence_items` referencing `query_id` with Qloo entity IDs. Derived signals → `cultural_signals` + join table to evidence items. Runs snapshot signal IDs + `signalConfigVersion` + `inputHash`. Briefs reference run + ranking IDs + evidence IDs. See `DATABASE.md`.

## 17. Deployment Topology and Pipeline

- Environments: `local`, `ci`, `production-demo` (optionally `preview`).
- Web and API deployed separately; API container built from a Dockerfile or the host's Node buildpack; migrations run as a release/pre-deploy step (`pnpm db:migrate`), never at request time.
- Secrets configured via host secret managers only. `.env` files are gitignored; `.env.example` has placeholders.
- CI (GitHub Actions or equivalent): install → lint → typecheck → unit + integration (Postgres service) → contract tests → build → secret scan → bundle scan. Live Qloo tests are **not** in default CI (opt-in workflow with a repository secret, manual dispatch).

## 18. Explicit MVP Exclusions

See `PRD.md` §10. Additionally: no queues, no websockets, no background workers (Qloo retrieval runs in request scope with concurrency cap and a progress-friendly API; if a refresh exceeds a safe duration, the API returns per-query outcomes incrementally via polling `GET /proposals/:id/evidence`), no Redis (in-process counters + DB-backed quotas), no vector store, no multi-tenant org model.

## 19. Open Architectural Decisions (resolve in Phase 0/1; record in `DECISIONS.md`)

1. `signalMode` (`tiered` vs `score_normalized`) — from Q-10.
2. Enabled evidence strategies (S1–S3) — from Q-05…Q-09.
3. Cache scope (global vs per-workspace) and TTL — from Q-13.
4. Hosting providers actually used.
5. Final Qloo capability table (entity types × markets) → drives pre-rejection of unsupported queries.
