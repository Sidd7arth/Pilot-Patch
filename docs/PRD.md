# PatchPilot — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Document | `docs/PRD.md` |
| Version | 1.0 (documentation baseline) |
| Date | 2026-10-22 |
| Authority | **Product scope and acceptance criteria.** Governs *what* is built. Qloo API details are governed by verified official Qloo behavior (see `ARCHITECTURE.md` §3). |
| Audience | Antigravity (implementation owner), reviewers, project owner |

> **Status note.** Nothing in this repository has been implemented or tested at the time of writing. No Qloo endpoint, parameter, or capability in these documents has been verified against official Qloo documentation by the author. Every Qloo detail is registered in `ARCHITECTURE.md` §3 as `Q-xx` and is **UNVERIFIED** until Phase 0 of `IMPLEMENTATION.md` records evidence.

---

## 1. Product Summary

**PatchPilot** is a B2B decision-support workspace for live-service and free-to-play (F2P) game studios. It helps a studio decide **which candidate content updates (seasonal events, character skins, themed bundles, entertainment collaborations, regional content) deserve investment under a fixed budget and production capacity**, using:

1. **Cultural evidence** retrieved from the **real Qloo API** (mandatory core intelligence layer).
2. **Operational evidence** (cost, effort, schedule, dependencies, capacity).
3. **Commercial evidence** (only historical performance data the studio supplies; never invented).
4. **Explicit uncertainty** (missing, stale, weak, ambiguous, or unsupported evidence is shown, not hidden).

PatchPilot is **not** an autonomous publisher, **not** a revenue predictor, and **not** a chatbot.

## 2. Problem

Studios have limited budget, capacity, and release windows. Choosing among event/skin/bundle/collab/regional proposals is typically driven by fragmented trend research, subjective opinions, and hard-to-compare proposals. Cultural-fit reasoning is rarely traceable to evidence, and re-planning when the budget changes is manual and opaque.

## 3. Users and Jobs To Be Done

| Persona | Job to be done |
|---|---|
| LiveOps manager | "Pick the content slate for the next two quarters that fits our capacity and that we can defend." |
| Game producer | "See which proposals are feasible in budget/effort/schedule, and what drops out when scope changes." |
| Content strategy lead | "Show cultural evidence for why a theme may resonate with a target market, and where the evidence is thin." |
| Monetization / product manager | "Separate what is evidence from what is hypothesis before committing spend." |
| Regional publishing team | "Check whether a regional content idea has any cultural support in that market." |
| Studio decision-maker | "Get a one-page brief with a clear recommendation, trade-offs, and honest limits." |

Primary JTBD statement: *When I must choose a limited set of content investments, I want a transparent, evidence-first shortlist that shows cultural evidence, feasibility, cost and uncertainty side by side, so I can justify the decision and re-plan quickly when constraints change.*

## 4. Core Workflow

1. **Set up** the game, target markets, total budget, capacity, planning horizon, and constraints.
2. **Add ~6 candidate proposals** (cost, effort, window, dependencies, markets, cultural references).
3. **Resolve references** to Qloo entities (real Qloo search). Unresolved/ambiguous items are surfaced for user action.
4. **Retrieve Qloo evidence** per proposal × market. Inspect normalized evidence and provenance.
5. **Run the decision engine** (deterministic). Receive ranking, budget-constrained shortlist, and per-proposal explanations.
6. **Read the decision brief** (structured; optional validated LLM narrative).
7. **Re-plan**: change budget/constraints/weights; re-run; inspect what entered/left the shortlist and why.
8. **Compare** the baseline (no Qloo evidence) vs Qloo-informed ranking on identical inputs.

## 5. Evidence Model (product-level rules)

Five categories are kept **separate in data, API, and UI**:

| Category | Source | Example | May be used as |
|---|---|---|---|
| **Cultural evidence** | Real Qloo responses only | "Reference entity X resolved by Qloo; appears among results for market M in query Q (retrieved at T)" | Input to cultural criteria |
| **Operational evidence** | User-supplied | Cost, effort, schedule confidence, dependencies | Hard constraints + feasibility criterion |
| **Commercial evidence** | User-supplied historical records only (or clearly labeled synthetic demo records) | "Past event delivered 1.3× the studio's baseline event-revenue index" | Commercial criterion (analog-based, not a forecast) |
| **Hypothesis** | System/user | "Theme may resonate with market M" | Display only, labeled |
| **Uncertainty** | System | Missing, stale, ambiguous, unsupported, failed | Display + coverage metrics; **never** treated as negative evidence |

**Data-origin labels** (mandatory on every record in API and UI): `live_qloo`, `cached_qloo`, `test_fixture`, `synthetic_demo`, `user_supplied`, `system_derived`.

## 6. Claims Policy

**Allowed language:** "cultural affinity evidence", "supports the hypothesis that…", "worth investigating", "evidence-informed priority", "decision-support recommendation", "evidence coverage".

**Prohibited anywhere (UI, brief, LLM output, README, demo script):** predicted/expected revenue, ROI, conversion, profit, LTV, "will perform", "guaranteed", "proven", "increases revenue by X%", "outperforms" (about Qloo-informed vs baseline), statistical significance/accuracy claims without a validation study that does not exist in the MVP.

Enforcement: automated banned-claim lint on generated text (see `TESTING.md` §9) and a persistent disclaimer pattern in the UI (`DESIGN.md`).

## 7. MVP Scope and Acceptance Criteria

IDs (`AC-*`) are the traceability keys used by `TESTING.md` and `IMPLEMENTATION.md`. "Verified" means demonstrated by an executed test or procedure with recorded results.

### F-A. Studio and game setup
- **AC-A1** One game can be created/edited (name, description, genres/tags, platforms).
- **AC-A2** ≥1 target market can be defined (name, country/region code, weight, optional Qloo location hint). Market weights are normalized deterministically.
- **AC-A3** Planning constraints configurable: total budget, contingency reserve, currency, capacity (person-days), planning horizon, enforcement mode for capacity and horizon (`hard`|`advisory`), optional max selections.
- **AC-A4** All seed/demo records carry `synthetic_demo` origin and are visibly labeled as such in UI and brief.

### F-B. Content proposal management
- **AC-B1** CRUD for proposals with: name, description, category (`seasonal_event`, `character_skin`, `themed_bundle`, `entertainment_collab`, `regional_content`, `other`), target markets, estimated cost, effort, release window, schedule confidence (1–5, optional), stakeholder priority (1–5, optional), status, dependencies, open questions, assumptions.
- **AC-B2** Per-proposal **cultural references** (user-supplied text + optional entity-type hint). Schema keeps **user-supplied references separate from Qloo-resolved entities** (distinct tables/fields).
- **AC-B3** The system does not require any Qloo entity type that has not been verified (Q-08); unsupported references remain valid proposal data with status `unsupported`.
- **AC-B4** Server-side validation rejects invalid input (negative cost, window end < start, currency mismatch, dependency cycles, self-dependency) with field-level errors.
- **AC-B5** ~6 proposals are supported in the demo; the system must not hard-code the count (≥1, ≤12 enforced for MVP).

### F-C. Qloo intelligence
- **AC-C1** References are resolved via the real Qloo API; outcome stored as `resolved|ambiguous|unresolved|unsupported|failed` with candidates and query provenance.
- **AC-C2** Evidence retrieved per proposal × market using strategies validated in Phase 0 (`ARCHITECTURE.md` §7), normalized to the typed internal model (`QlooQuery`, `QlooEvidenceItem`, `CulturalSignal`).
- **AC-C3** Provenance preserved: endpoint, sanitized params, request fingerprint, HTTP status, retrieval time, Qloo entity IDs, cache status, adapter version, raw (redacted, size-capped) response.
- **AC-C4** Distinct, user-visible handling of: `success`, `empty`, `unsupported`, `ambiguous`, `unresolved`, `failed_*`, and **stale cache**.
- **AC-C5** Real evidence is displayed **separately from** system-generated interpretation (labeled `system_derived`).
- **AC-C6** A failed live call **never** produces invented or silently substituted evidence. Cached data is shown only when labeled `cached_qloo` with retrieval time.
- **AC-C7** Qloo-unavailable state is disclosed with the specific affected functionality (resolution, evidence refresh, Qloo-informed ranking).
- **AC-C8** Raw Qloo scores are never presented as comparable across queries/proposals unless Phase 0 verified that interpretation (Q-10).

### F-D. Explainable prioritization (deterministic)
- **AC-D1** Hard-constraint exclusion (with reason codes) for: individual cost exceeding available budget; effort exceeding capacity (if `hard`); window outside horizon (if `hard`); blocked hard dependency; excluded internal dependency (cascade); ineligible status.
- **AC-D2** Budget feasibility computed: per-proposal cost vs. remaining budget; portfolio total vs. `budget − contingency`; utilization shown.
- **AC-D3** Documented criteria and default weights with rationale (`ARCHITECTURE.md` §8). Weights user-adjustable, validated to sum to 1.
- **AC-D4** Cultural evidence quality (evidence confidence), cultural relevance, feasibility, commercial evidence, and stakeholder priority are **separate criteria** with separate displayed scores.
- **AC-D5** Missing data ⇒ criterion marked *unavailable* (not zero). Weights renormalized over available criteria; `coverage` and score bounds (lower/upper) exposed.
- **AC-D6** Determinism: identical inputs ⇒ byte-identical output (verified via canonical `inputHash`).
- **AC-D7** Every ranked proposal has a structured explanation (criterion contributions, flags, reason codes).
- **AC-D8** UI/brief explicitly label the ranking as a heuristic, not a validated prediction.
- **AC-D9** The scoring engine is a pure module with no UI, DB, network, or LLM dependency.

### F-E. Decision brief
- **AC-E1** Brief per decision run: recommendation + rank per proposal; why shortlisted/deprioritized/excluded; Qloo evidence with provenance IDs; feasibility; cost/budget impact; commercial evidence (if supplied); assumptions; uncertainty; missing evidence; follow-up questions; fixed "not a guaranteed outcome" statement.
- **AC-E2** The brief's factual content is generated deterministically from stored run data. Optional LLM narrative is downstream and validated (every number and ID traced to run data; banned-claim lint passes) or discarded with a visible notice.
- **AC-E3** Brief export to Markdown.
- **AC-E4** Brief is immutable once generated; regenerating creates a new version tied to a run.
- **AC-E5** No fabricated revenue/ROI/conversion/profit appears in any brief.

### F-F. Re-planning
- **AC-F1** User can change budget, contingency, capacity, horizon, weights, or proposal fields and re-run, producing a **new linked run** (parent reference).
- **AC-F2** A diff view shows: shortlist entered/left, rank changes, allocation changes, parameter changes, and reason codes.
- **AC-F3** Prior runs remain immutable and viewable.

### F-G. Baseline comparison
- **AC-G1** One action produces two variants on **identical proposals, constraints, and shared weights**: `baseline` (cultural + evidence-confidence criteria unavailable) and `qloo_informed`.
- **AC-G2** The comparison view shows rank deltas, shortlist differences, and which criteria drove each delta.
- **AC-G3** The UI never claims the Qloo-informed variant is better, only different and why (extra evidence).
- **AC-G4** Property: `qloo_informed` with cultural weights set to 0 equals `baseline` (tested).

### F-H. Operational completeness
- **AC-H1** Usable UI covering every workflow step.
- **AC-H2** Backend REST API with schemas, validation, consistent error envelope.
- **AC-H3** Real Qloo integration in the production/demo path.
- **AC-H4** Loading, empty, validation, and failure states on every data-dependent screen.
- **AC-H5** Tests for decision logic, Qloo adapter behavior, API workflows, and the primary E2E flow.
- **AC-H6** `.env.example` + documented environment variables (placeholders only).
- **AC-H7** Public repository, OSI-approved license, README (setup, architecture, env vars, tests, limitations, deployment).
- **AC-H8** Publicly accessible deployed demo with a documented safe secret configuration and a reproducible demo path using real Qloo data.

## 8. Qloo Integration Acceptance Criteria (hard gate)

- **AC-Q1** Phase 0 report exists with a *recorded* successful live Qloo request, validated response shape, and mapping to the internal evidence model.
- **AC-Q2** Credentials exist only server-side; verified absent from client bundles, logs, error responses, and git history.
- **AC-Q3** Every Qloo call goes through the single adapter (`packages/qloo-client`) with timeouts, bounded retries, error classification, and rate-limit handling.
- **AC-Q4** Contract tests validate the adapter against **sanitized responses captured from the live API** (fixtures labeled `test_fixture`); a separate opt-in live test suite exists.
- **AC-Q5** Demo/production path cannot be switched to fixtures by any user-reachable setting. Fixture mode exists only inside the automated test harness.
- **AC-Q6** Integration status endpoint/UI reports: configured?, last successful live call time, last error class, calls used vs. quota.
- **AC-Q7** At least some of the six seeded proposals have real, defensible Qloo-derived evidence; those without are shown as such. Phase 0 records exactly which.
- **AC-Q8** If Qloo access is blocked, the blocker is documented and no milestone depending on live Qloo is marked complete.

## 9. Evidence Transparency Acceptance Criteria

- **AC-T1** Every number shown in a recommendation is traceable (click-through) to inputs (user-supplied, synthetic, Qloo evidence ID, or documented formula).
- **AC-T2** Every evidence item displays its data-origin label and retrieval time.
- **AC-T3** Synthetic demo data is visibly labeled everywhere it influences a result.
- **AC-T4** "Unavailable" and "not observed" are visually distinct from low/negative.
- **AC-T5** Each recommendation shows a plain-language "what this does not tell you" statement.
- **AC-T6** Banned-claim lint passes on all generated text (UI copy excluded from runtime lint but covered by review checklist).

## 10. Non-Goals (MVP exclusions)

Revenue/ROI/LTV/conversion forecasting; automated publishing or live-ops integration; multi-game portfolios; multi-user accounts, roles, SSO, billing; collaborative editing; A/B-test integration; ingesting studio analytics warehouses; marketing landing page beyond a minimal entry screen; general chatbot; ad-copy or cultural-sensitivity checking; multi-agent orchestration; vector databases; mobile apps; localization of the UI; real-time streaming; ML model training.

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Qloo has weak/no coverage for game entities or the desired market granularity (Q-08, Q-09) | Core value weak | Phase 0 gate; documented alternative strategies (S1–S3, `ARCHITECTURE.md` §7); honest "unsupported" states; adjust seed references **transparently** (log all failed attempts) |
| API key unavailable/expired/rate-limited (Q-11, Q-14) | Blocks Phase 0/demo | Obtain early; per-workspace and global call budgets; cache within permitted terms (Q-13); documented blocker protocol |
| Response shape differs from docs/assumptions | Adapter breakage | Two-stage parsing, contract tests on captured live fixtures, shape-drift classification |
| Raw scores misread as comparable | Misleading ranking | Band-based signals by default; numeric mode only if Phase 0 verifies (Q-10) |
| Users read heuristic rank as forecast | Credibility/harm | Claims policy, disclaimers, bounds/coverage display, lint |
| LLM invents facts | Trust | Optional, downstream, validated, discardable |
| Hackathon time pressure (deadline per project owner: **2026-10-30 23:45 EDT**; verify on Devpost) | Incomplete MVP | Phase ordering + cut line in `IMPLEMENTATION.md` §9 |
| Public demo abuse (quota exhaustion) | Demo outage | Anonymous workspaces, rate limits, global Qloo budget, optional access code |

## 12. Success Measures (for evaluation of the MVP, not business-impact claims)

| Measure | Target |
|---|---|
| Real Qloo calls succeed in deployed demo | Yes, verified with recorded evidence |
| Seeded proposals with ≥1 defensible Qloo-derived signal | ≥3 of 6 (else GO-WITH-LIMITS decision recorded) |
| Primary workflow completable in UI without developer help | ≤10 minutes from fresh workspace |
| Determinism property tests | 100% pass |
| AC coverage by passing automated or recorded manual tests | 100% of P0/P1 ACs; remaining listed as limitations |
| Secret-leak checks (bundle, logs, repo) | 0 findings |
| Banned-claim lint on generated briefs | 0 violations |

No claim of predictive accuracy, revenue uplift, or superiority will be made without an actual evaluation, which is out of MVP scope.

## 13. Differentiation

PatchPilot is differentiated by its **single central workflow: budget-constrained content-investment prioritization for game studios**, with (a) real cultural-intelligence evidence kept separate from operational and commercial evidence, (b) deterministic, explainable scoring with visible uncertainty, (c) instant constraint re-planning with diffs, and (d) a fair baseline-vs-Qloo comparison. It deliberately avoids being a trend dashboard, consumer recommender, or AI chat.

## 14. Glossary

- **Proposal** — candidate content update under evaluation.
- **Reference** — user-supplied cultural reference text attached to a proposal (e.g., a title, artist, brand, or theme).
- **Resolution** — mapping of a reference to a Qloo entity (or failure to).
- **Signal** — system-derived, typed summary of Qloo evidence for a proposal × market (`system_derived`), always linked to evidence items.
- **Coverage** — sum of weights of criteria that were available for a proposal.
- **Variant** — `baseline` or `qloo_informed` result set within a decision run.
- **Decision run** — immutable, reproducible execution of the engine on a snapshot of inputs.
