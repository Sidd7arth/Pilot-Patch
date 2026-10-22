# PatchPilot — Design and UX Specification

| Field | Value |
|---|---|
| Document | `docs/DESIGN.md` |
| Version | 1.0 (documentation baseline) |
| Date | 2026-10-22 |
| Authority | UX, information hierarchy, screens, visual system, accessibility, states. |

---

## 1. Design Intent

PatchPilot should feel like a **premium B2B decision workspace for game producers** — calm, dense-but-legible, evidence-first — not a chat UI and not a template dashboard. The interface exists to make five things instantly inspectable for every recommendation:

1. **Recommendation & rationale**
2. **Cultural evidence (Qloo) with provenance**
3. **Operational feasibility (cost, effort, schedule, dependencies)**
4. **Uncertainty (what is missing/weak/stale)**
5. **Budget trade-offs (what fits, what got displaced, why)**

Design tenets: *Evidence before opinion · Origin always visible · Missing ≠ negative · Numbers are clickable · Never imply certainty.* No marketing landing page beyond a minimal entry screen (≤10% of effort).

## 2. Information Architecture and Navigation

Persistent **left rail** (collapsible to icons on tablet) with a progress-aware stepper, plus a **top bar** (workspace name, data-origin legend, Qloo status pill, "Run decision" primary action).

| # | Screen (route) | Purpose |
|---|---|---|
| 0 | Entry (`/`) | One-screen intro; "Start with demo data (synthetic)" / "Start blank"; access-code field if required; notice (SEC-34) |
| 1 | Setup (`/setup`) | Game, Markets, Planning constraints (tabs) |
| 2 | Proposals (`/proposals`) | Table/board of ~6 proposals; add/edit drawer |
| 3 | Proposal detail (`/proposals/[id]`) | Overview, References & Resolution, Evidence, Dependencies, Analogs |
| 4 | Evidence Explorer (`/evidence`) | All Qloo queries/items/signals across proposals; filters by status/origin/market |
| 5 | Decision (`/decision`) | Run controls, shortlist, budget bar, ranking table, per-proposal explanation |
| 6 | Replan (`/decision/[runId]/replan`) | Scenario editor + diff vs parent run |
| 7 | Compare (`/decision/[runId]/compare`) | Baseline vs Qloo-informed |
| 8 | Brief (`/briefs/[id]`) | Decision brief, export |
| 9 | Integration (`/integration`) | Qloo status, query log, quota, limitations |

Stepper states: Setup → Proposals → Evidence → Decide → Replan/Compare → Brief. Steps show completion badges derived from real data (e.g., "Evidence: 4/6 proposals with ≥1 success").

## 3. Visual System

**Mood:** deep ink neutral base with restrained, semantic accent colors; high information density with generous line-height; subtle depth (1px borders, soft shadows) — no gradients as decoration, no stock illustrations.

### 3.1 Tokens (CSS variables; light + dark; Tailwind theme extension)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #F7F8FA | #0E1116 | App background |
| `--surface` | #FFFFFF | #151A21 | Cards, panels |
| `--surface-2` | #F0F2F5 | #1B222B | Table headers, inset |
| `--border` | #DDE1E7 | #2A323D | Hairlines |
| `--text` | #12161C | #E8EBF0 | Primary text |
| `--text-muted` | #566070 | #9AA6B5 | Secondary |
| `--accent` | #3B5BDB | #7C93FF | Primary actions, focus |
| `--cultural` | #7048E8 | #A78BFA | Cultural (Qloo) evidence |
| `--operational` | #0C8599 | #3BC9DB | Operational evidence |
| `--commercial` | #E67700 | #FFA94D | Commercial (user-supplied) evidence |
| `--hypothesis` | #868E96 | #ADB5BD | Hypothesis (dashed outline) |
| `--uncertain` | #C92A2A | #FF8787 | Failures/blocked |
| `--warn` | #B7791F | #F6C453 | Warnings, stale |
| `--ok` | #2B8A3E | #69DB7C | Success states |

All text/background pairs meet WCAG 2.2 AA (4.5:1 body, 3:1 large/UI). Color is **never the sole carrier of meaning** (icon + label + pattern accompany it).

### 3.2 Typography
Inter (UI) and JetBrains Mono (IDs, params, numbers in tables via tabular figures). Scale: 12/14/16/20/24/32. Body 14 (dense tables 13). Weights 400/500/600. Numeric columns right-aligned with `font-variant-numeric: tabular-nums`.

### 3.3 Spacing, radius, elevation
4-pt grid (4/8/12/16/24/32). Radius 8 (cards), 6 (inputs), 999 (pills). Elevation: border-first; shadow only on drawers/popovers.

### 3.4 Iconography
Lucide icons, 16/20 px, paired with text labels in primary navigation.

## 4. Core Components

| Component | Behavior |
|---|---|
| **OriginBadge** | Pill with icon + text: `LIVE · Qloo` (cultural color, solid), `CACHED · Qloo · <age>` (cultural outline), `STALE CACHE` (warn), `SYNTHETIC DEMO` (hatched gray), `USER SUPPLIED` (neutral), `SYSTEM DERIVED` (dotted). Tooltip: source, retrieved time, ID. Present on **every** evidence, input, and score element that carries an origin. |
| **EvidenceCard** | Header: entity name + type + OriginBadge; body: query context (strategy, market, params summary), result position, band; footer: "Provenance" disclosure (endpoint, sanitized params, fingerprint prefix, retrievedAt, duration, attempts, adapter version, Qloo IDs); "View raw (redacted)" in monospace dialog. |
| **SignalChip** | `Supports · Strong/Moderate/Weak` (cultural color) or `No supporting evidence observed (depth N)` (neutral hatched). Never red. |
| **CriterionBar** | Horizontal bar 0–1 per criterion, color by evidence category, shows weight and contribution; **Unavailable** renders as an empty hatched track labeled "Unavailable — not scored" (distinct from a short bar). |
| **CoverageMeter** | Shows `coverage` % and score bounds `lower–upper` as a range whisker around the point score; tooltip explains. |
| **BudgetBar** | Stacked bar of budget: contingency reserve, selected proposals (colored segments in rank order), remaining; hover shows each cost. Over-limit never shown (portfolio can't exceed). |
| **ShortlistCard** | Rank, name, category, status chip (`Selected` / `Not funded` / `Deferred` / `Excluded`), score, coverage, top reasons (reason-code chips), "Why" button. |
| **ReasonChip** | Reason code with plain-language label (e.g., `HC_COST_EXCEEDS_BUDGET` → "Cost exceeds available budget"); tooltip shows numbers. |
| **DiffRow** | Entered ▲ / Left ▼ / Rank change ↕ with from→to, reason chips, deterministic sentence. |
| **DisclaimerStrip** | Fixed text under any recommendation: "Decision-support hypothesis based on cultural-affinity evidence and your inputs. Not a forecast of sales, revenue, or profit." |
| **StatusPill (Qloo)** | `Connected · last success 2m ago` / `Not configured` / `Auth failed` / `Rate limited` / `Degraded (breaker open)`; opens Integration panel. |
| **EmptyState / ErrorState / Skeleton** | See §8. |

## 5. Screen Specifications

### 5.1 Entry
Headline + one-sentence value; two primary buttons; small legend of origin labels; notice: "Demo workspace. Don't enter confidential data." No hero imagery, no pricing. Shows Qloo status pill so evaluators see integration state immediately.

### 5.2 Setup
Tabs: **Game** (name, description, genre tags, platforms, *audience anchor references* with resolution status chips), **Markets** (table with weight sliders normalized live, country code, location hint, notes; add/remove), **Constraints** (budget, reserve, currency, capacity, horizon, enforcement toggles with plain-language help, max selections, weights editor with sum indicator and rationale tooltips, min coverage). Inline validation; "Save" disabled until valid. Synthetic seed values carry SYNTHETIC badges.

### 5.3 Proposals
Default **table** (sortable): Name, Category, Markets, Cost, Effort, Window, Status, Evidence (mini coverage glyph: resolved refs n/m · markets with evidence n/m), Flags. Toggle to **board** by status. "Add proposal" opens right drawer with sections (Basics, Money & effort, Window, Markets, Dependencies, References, Open questions/Assumptions). "Run Qloo resolution" and "Refresh evidence" bulk actions in toolbar with per-row result states.

### 5.4 Proposal Detail
Header with key numbers and OriginBadges. Tabs:
- **Overview** — operational facts, assumptions, open questions.
- **References & Resolution** — each user-supplied reference with resolution status chip; *Ambiguous* shows candidate list (name, type, position) and a "Choose" action; *Unresolved/Unsupported/Failed* show cause and next-step hints; resolved shows the Qloo entity with provenance link. User-supplied text and Qloo-resolved entity are displayed in **two visibly separate blocks**.
- **Evidence** — per market accordion: signals (SignalChips) + EvidenceCards + query outcomes (success/empty/unsupported/failed with timestamps). Section "System interpretation" (system_derived) is visually separated (dotted border, label) from "Qloo returned" (solid).
- **Dependencies** — internal/external, status, hard-blocking.
- **Analogs** — linked historical records (origin badges), metric, ratio, caveat text.

### 5.5 Evidence Explorer
Filterable table of queries (purpose, market, status, origin, retrievedAt, duration, attempts). Row expands to items and raw (redacted) payload. Filters: status, origin, proposal, market. Shows counts by status. Banner if any `cached_stale` or `failed_*` present.

### 5.6 Decision
Top: **Run controls** — variants selector (Qloo-informed / Baseline / Both), weights summary (link to edit), "Run decision". Middle: **BudgetBar** and utilization numbers. Main: two-pane — left **Ranking list** (ShortlistCards; excluded proposals in a collapsed "Excluded (n)" section with reasons), right **Explanation panel** for the selected proposal: CriterionBars (grouped by evidence category with legend), CoverageMeter, flags, reason chips, "What this does not tell you", links to evidence IDs, assumptions, missing evidence, follow-up questions. DisclaimerStrip always visible. "Generate brief" action. Stale-input notice if inputs changed since run.

### 5.7 Replan
Left: editable scenario (budget, reserve, capacity, horizon, enforcement, weights, optionally proposal cost/effort overrides — overrides apply to a *new run snapshot* and are labeled "scenario override"). Right: live **diff vs parent** after run: entered/left, rank changes, allocation (BudgetBar before/after), parameter changes, reasons. Runs listed in a lineage breadcrumb.

### 5.8 Compare (Baseline vs Qloo-informed)
Two aligned columns (Baseline | Qloo-informed) with rank lines connecting the same proposal (slope-style), rank delta chips, selection-status change, and a per-proposal "What drove the difference" popover listing contributing criteria (cultural relevance / evidence confidence). Persistent banner: "Different ranking ≠ better outcome. The Qloo-informed view adds cultural-affinity evidence; it has not been validated against commercial results." Shows evidence coverage per variant.

### 5.9 Brief
Document-style layout: title, run metadata (engine version, input hash short, signal config version, date), executive summary (deterministic), shortlist table, per-proposal sections (recommendation, rationale, evidence w/ provenance IDs and origin badges, feasibility, cost/budget implication, commercial evidence or "none supplied", assumptions, uncertainty, missing evidence, follow-ups), limitations section (fixed text), appendix (methodology: formulas and weights). Narrative (if accepted) in a clearly labeled "AI-assisted summary (validated against run data)" block; if rejected, a notice. Actions: Export Markdown, Copy link. Print-friendly CSS.

### 5.10 Integration
Status card (configured, last success, last error class, breaker state), quota meters (workspace/global), **capability table** (entity types × markets observed in Phase 0 as VERIFIED/UNSUPPORTED/UNKNOWN), recent query log (sanitized), "Probe now" button (rate-limited), known limitations list (from `PHASE0_REPORT`). No key fragments anywhere.

## 6. Content and Language Patterns

- Use: "supports the hypothesis", "cultural-affinity evidence", "worth investigating", "evidence coverage", "not observed", "unavailable".
- Avoid: "will perform", "predicted", "proven", "best", "winning", "ROI", "revenue lift".
- Every numeric score has a **How computed** link opening the formula and inputs.
- Plain-language reason chips; codes available on hover for engineers.
- Tooltips ≤ 2 sentences. Error messages: what happened → what it affects → what to do.

## 7. Responsive Behavior

Breakpoints: ≥1280 desktop (rail + 2-pane); 768–1279 tablet (collapsed rail, explanation panel becomes slide-over); <768 mobile (bottom nav; tables become cards; Compare stacks columns with segmented toggle). Primary workflow usable at 360 px width; wide tables scroll inside containers (never page-level horizontal scroll). Minimum touch target 44×44.

## 8. States

| State | Pattern |
|---|---|
| **Loading** | Skeletons matching final layout; Qloo-bound actions show per-item progress ("Resolving 3/8…", per-query spinners); long operations are cancel-safe and non-blocking; `aria-busy` |
| **Empty** | Purposeful: e.g., Proposals empty → "Add your first proposal or load synthetic demo data"; Evidence empty → "No Qloo evidence yet. Resolve references, then refresh evidence." with primary action |
| **Validation** | Field-level inline messages + summary at top for multi-error; focus first invalid field |
| **Qloo failure** | Non-modal banner naming affected features (resolution, evidence refresh, Qloo-informed ranking); per-query failure rows with class and retry; baseline workflow remains available; never shows fabricated content |
| **Qloo empty/unsupported** | Neutral (not red) explanatory cards; suggestions (try alternative reference/type) |
| **Stale/cached** | Warn-colored badge + timestamp; "Refresh live" action |
| **Quota exceeded** | Explanatory banner with reset time |
| **Offline/API down** | Full-page recoverable error with retry and request ID |
| **Optimistic updates** | Not used for evidence/decision runs (server truth only) |

## 9. Accessibility (WCAG 2.2 AA target)

Semantic landmarks; headings hierarchy; all interactive elements keyboard reachable with visible focus ring (2px accent + offset); drawers/dialogs trap focus and restore on close; tables use proper `<th scope>`; charts/bars have text equivalents (aria-label with values and a "View as table" toggle); live regions announce run completion and errors (`aria-live=polite/assertive`); prefers-reduced-motion respected; no information by color alone; form labels and error association (`aria-describedby`); minimum 4.5:1 contrast; zoom to 200% without loss; axe checks in CI (TESTING §10).

## 10. Motion
Minimal: 120–180 ms ease-out for drawers/popovers; no looping animations; skeleton shimmer disabled under reduced motion.

## 11. Frontend Implementation Notes (for Antigravity)

- Tailwind with tokens mapped in `tailwind.config` (CSS variables); dark mode via `class` strategy with system default.
- Component library: build on accessible primitives (Radix UI/shadcn-style) — only if added per dependency discipline (`CODE_STYLE.md` §11); otherwise native elements.
- Data fetching: typed client from `packages/shared`; server state via a small cache layer (TanStack Query acceptable); no global state library beyond that.
- Every screen consumes **real API responses**; no hardcoded rankings, scores, or Qloo content anywhere in `apps/web` (lint rule bans importing seed/fixture modules; test asserts).
- Synthetic seed content is created by the **API** (labeled) and is not bundled in the web app.
- Print stylesheet for Brief; `meta` tags minimal; favicon simple.

## 12. Design Acceptance Checklist

- [ ] Every evidence/input element shows OriginBadge.
- [ ] "Unavailable" and "Not observed" visually distinct from low/negative.
- [ ] DisclaimerStrip on Decision, Compare, Brief.
- [ ] Qloo failure/empty/unsupported/stale states implemented and tested.
- [ ] No claim language from the banned list in UI copy.
- [ ] Keyboard-only run-through of primary workflow succeeds.
- [ ] axe: 0 serious/critical on all screens.
- [ ] 360 px layout usable for primary workflow.
