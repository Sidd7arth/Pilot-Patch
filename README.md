# PatchPilot

> **Evidence-First Decision-Support Platform for Live-Service Game Studios**  
> _Powered by Real Qloo Cultural Intelligence_

PatchPilot evaluates live-service content roadmaps (seasonal events, crossover collaborations, cosmetic bundles, and regional updates) by pairing studio resource constraints with live cultural affinity signals from the **Qloo API**.

> [!NOTE]
> **Standard Evaluation Disclaimer**: Decision-support hypothesis based on cultural-affinity evidence and your inputs. Not a forecast of sales, revenue, or profit. Cultural affinity indicates aligned audience taste patterns, not player conversion.

---

## 1. Core Principles

1. **Real Qloo Cultural Intelligence**: Real-world entity resolution and affinity queries against official Qloo endpoints (`https://hackathon.api.qloo.com`). Zero synthetic mocks in production workflows.
2. **Deterministic Decision Engine**: Pure mathematical greedy selection with zero I/O, zero random generation, and stable SHA-256 snapshot hashing (`inputHash`).
3. **Rigorous Evidence Provenance**: Every metric surfaces its origin (`live_qloo`, `cached_qloo`, `cached_stale`, `synthetic_demo`, `user_supplied`, or `system_derived`).
4. **Honest Uncertainty & Missing Evidence**: Unavailable criteria evaluate to `null` (never penalized as zero). Unobserved cultural signals are labeled _"No supporting evidence observed"_, never scored low.
5. **Scenario Re-planning & Variant Comparison**: Immediate attribution comparison between studio baseline rankings and Qloo-informed portfolios, with dynamic diff tracking for budget overrides.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Browser["Web Tier (Next.js 16 + shadcn UI)"]
        Landing["Landing & Demo Seed (/page)"]
        Setup["Workspace Setup (/setup)"]
        Proposals["Content Proposals (/proposals)"]
        ProposalDetail["Proposal Detail & References (/proposals/:id)"]
        Decision["Decision Workspace (/decision)"]
        Compare["Compare & Replan (/decision/compare)"]
        Briefs["Decision Briefs & Export (/briefs)"]
    end

    subgraph API["Backend Tier (Express ESM + Node 22)"]
        Session["Signed Session Cookie Middleware"]
        QlooRouter["Qloo Router (/qloo/status, /resolve, /queries)"]
        DomainRouter["Domain CRUD (/workspaces, /proposals)"]
        DecisionRouter["Decision Router (/decision-runs, /replan, /diff)"]
        BriefsRouter["Briefs Generator & Banned Claims Lint"]
    end

    subgraph Core["Pure Modules & Adapters"]
        Engine["@patchpilot/decision-engine (Pure, Deterministic, 0-IO)"]
        QlooClient["@patchpilot/qloo-client (Circuit Breaker, Concurrency Cap)"]
        Shared["@patchpilot/shared (Schemas, Disclaimers, Bounds Invariants)"]
    end

    subgraph Storage["Persistence Layer"]
        Postgres[(PostgreSQL 16 Database)]
        Drizzle["Drizzle ORM Migrations (19 tables)"]
    end

    subgraph External["External Services"]
        QlooAPI["Official Qloo API (https://hackathon.api.qloo.com)"]
    end

    Browser -->|JSON API / Session Cookie| API
    API --> Core
    API --> Drizzle
    Drizzle --> Postgres
    QlooClient -->|X-Api-Key / Sanitized Query| QlooAPI
```

---

## 3. Technology Stack

- **Runtime**: Node.js `v22.16.0` (ESM native), pnpm `12.15.0`
- **Monorepo**: Turborepo with strict architectural boundaries (`eslint-plugin-boundaries`)
- **Backend**: Express 4, Drizzle ORM, PostgreSQL 16, Pino structured logging, Helmet security headers
- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Lucide icons, shadcn UI design system components
- **Decision Engine**: Pure TypeScript, deterministic greedy knapsack with multi-pass dependency fixpoint
- **Testing**: Vitest 3, Playwright 1.64, Supertest

---

## 4. Environment Variables

Create a `.env` file at the root of the repository by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable                     | Description                                                       | Default / Example                                    |
| ---------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`                   | Application environment (`development` or `production`)           | `development`                                        |
| `PORT`                       | Backend Express API port                                          | `4000`                                               |
| `LOG_LEVEL`                  | Pino logger verbosity (`trace`, `debug`, `info`, `warn`, `error`) | `info`                                               |
| `DATABASE_URL`               | PostgreSQL 16 connection string                                   | `postgres://user:password@localhost:5432/patchpilot` |
| `SESSION_SECRET`             | Secret key for signed workspace session cookies (min 32 chars)    | `a-secure-random-string-at-least-32-chars-long`      |
| `ALLOWED_ORIGINS`            | CORS allowed frontend origins (comma-separated)                   | `http://localhost:3000`                              |
| `API_INTERNAL_URL`           | Internal API route URL for web server-side proxy                  | `http://localhost:4000`                              |
| `NEXT_PUBLIC_APP_NAME`       | Public frontend application display name                          | `PatchPilot`                                         |
| `QLOO_API_KEY`               | Official Qloo Hackathon API Key (server-side only)                | `your-official-qloo-hackathon-api-key`               |
| `QLOO_API_BASE_URL`          | Official Qloo API host                                            | `https://hackathon.api.qloo.com`                     |
| `QLOO_TIMEOUT_MS`            | Outbound HTTP timeout in milliseconds                             | `10000`                                              |
| `QLOO_MAX_RETRIES`           | Max retries for transient 5xx/429 errors (with backoff)           | `2`                                                  |
| `QLOO_MAX_CONCURRENCY`       | Maximum concurrent in-flight requests to Qloo                     | `2`                                                  |
| `QLOO_WORKSPACE_DAILY_CALLS` | Per-workspace daily call limit quota                              | `150`                                                |
| `QLOO_GLOBAL_DAILY_CALLS`    | System-wide daily call limit quota                                | `2000`                                               |

> [!SECURITY]
> `QLOO_API_KEY` is strictly isolated server-side. It is never exposed in `NEXT_PUBLIC_*` variables, client bundles, or error envelopes.

---

## 5. Local Setup & Reproduction Guide

### Prerequisites

- **Node.js**: `>= 20.0.0` (LTS recommended)
- **pnpm**: `>= 9.0.0`
- **PostgreSQL**: `16` (Docker Compose provided or local instance)

### Installation & Initialization Steps

```bash
# 1. Clone repository
git clone https://github.com/Sidd7arth/Pilot-Patch.git
cd Pilot-Patch

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and authorized QLOO_API_KEY

# 4. Start PostgreSQL 16 database
# Option A: Start using included Docker Compose (recommended)
docker compose up -d

# Option B: Use existing local PostgreSQL instance
# Ensure a database named 'patchpilot' exists matching DATABASE_URL

# 5. Run database migrations
pnpm db:migrate

# 6. (Optional) Pre-seed synthetic demonstration workspace
pnpm seed

# 7. Build all packages
pnpm build

# 8. Start development servers
pnpm dev
```

- **Web Application**: `http://localhost:3000`
- **API Server & Health**: `http://localhost:4000/health` (Probe: `http://localhost:4000/ready`)
- **Integration Status**: `http://localhost:3000/integration`

---

## 6. Verification & Test Suites

PatchPilot enforces comprehensive test coverage across unit, integration, live, security, and end-to-end layers:

```bash
# Typecheck all packages
pnpm typecheck

# Lint all workspace packages
pnpm lint

# Run all 76 unit and integration tests (Vitest)
pnpm test

# Run Playwright End-to-End browser suite (7/7 tests passing)
pnpm test:e2e

# Run live Qloo adapter verification
pnpm test:live

# Verify live Qloo endpoints across proposals and target markets
pnpm qloo:verify

# Audit repository and bundles for secret leakage
pnpm check:secrets
pnpm check:bundle

# Execute deployment smoke check
pnpm smoke:deployed
```

---

## 7. Step-by-Step Demo Walkthrough

1. **Launch Workspace (`/`)**: Click **"Launch Demo Workspace"** to initialize the _Ember Arena_ reference game profile seeded with Appendix A content initiatives across United States (US), Japan (JP), Brazil (BR), and India (IN).
2. **Review Proposals (`/proposals`)**: Inspect the 6 content proposals, their cost, person-day effort, release windows, and Qloo signal badges.
3. **Inspect Cultural References (`/proposals/:id`)**: Click on _Lantern Festival Seasonal Event_ to inspect user-supplied references, resolved Qloo entities, and ambiguity resolution candidate cards.
4. **Execute Prioritization (`/decision`)**: Click **"Run Decision Engine"** to compute the optimal portfolio under the \$360,000 available budget and capacity constraints. View the stacked **BudgetBar**, **Funded Shortlist** rankings, and multi-criteria **CriterionBars**.
5. **Attribution & Re-planning (`/decision/compare`)**: Compare the baseline portfolio against the Qloo-informed ranking. Test interactive budget re-planning (e.g. adjust budget to \$200,000) to observe immediate shortlist shifts and rank movements.
6. **Generate Decision Brief (`/briefs`)**: Generate the executive brief containing the full decision snapshot, provenance IDs, criteria weights, and download the Markdown artifact (`.md`).

---

## 8. Architectural Invariants, Limitations & Algorithmic Design

### 8.1 Handling Empty Results & Ambiguous Matches (Evidence Integrity)

- **Missing Evidence is Not Negative Evidence**: If a cultural reference or regional market returns empty or unsupported results from Qloo (`outcome: 'empty'` or `status: 'unresolved'`), the criterion value is recorded as `null` (`available: false`). The decision engine **renormalizes weights** across available criteria rather than penalizing the initiative with a 0.0 or negative score.
- **Ambiguity Resolution Chooser**: When reference text matches multiple entities (e.g. "Avatar" could refer to a film, album, or game), PatchPilot marks the reference `status: 'ambiguous'` and displays candidate cards with their Qloo Entity IDs, categories, and popularity for interactive producer confirmation (`POST /api/v1/references/:id/resolution/choose`).
- **Score Semantics**: Raw Qloo affinity scores are comparative within option sets, not globally calibrated across disparate calls. PatchPilot maps affinities into defensible tiered signal bands (`strong`, `moderate`, `weak`, `not_observed`) per official Qloo engineering guidelines.

### 8.2 Decision Engine Selection Algorithm (Greedy Knapsack vs Global Optimum)

- **Selection Logic**: The decision engine employs a deterministic greedy selection algorithm with multi-pass fixpoint evaluation for internal dependency resolution.
- **Why Greedy**: Live-service game producers prioritize high-conviction, top-scoring "tentpole" updates first. Greedy selection reflects actual studio roadmap discipline where headline initiatives take precedence over packing multiple minor items into leftover budget margins.
- **Known Trade-off (Sub-optimal Knapsack Packing)**: In cases where a single high-scoring proposal consumes the majority of remaining budget, it may block multiple medium-scoring initiatives whose cumulative score would exceed the single item. The engine reports remaining available budget, unmet dependency deferrals, and shortfall reasons (`REM_BUDGET_INSUFFICIENT`, `REM_CAPACITY_INSUFFICIENT`) with 100% mathematical transparency.
- **Multi-pass Dependency Cascades**: Initiatives requiring unselected prerequisites are deferred (`status: 'deferred_unmet_dependency'`). When a parent initiative is selected in pass $N$, pass $N+1$ automatically evaluates child initiatives against remaining resources.

### 8.3 Limitations & Scope

- **Cultural Affinity ≠ Commercial Forecast**: High cultural affinity reflects audience taste overlap, not guaranteed player conversion, revenue, or ROI.
- **Zero Hallucination / Mock Policy**: Live integration uses official Qloo API endpoints. Fixtures are used strictly in isolated automated unit/contract tests and never in the user workflow.
- **Synthetic Demonstration Seeds**: The reference workspace _Ember Arena_ and its operational cost structures are synthetic placeholders designed for safe evaluation.

---

## 9. License

This project is licensed under the [MIT License](LICENSE).
