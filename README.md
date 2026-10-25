# PatchPilot

> **Evidence-First Decision-Support Platform for Live-Service Game Studios**  
> *Powered by Real Qloo Cultural Intelligence*

PatchPilot evaluates live-service content roadmaps (seasonal events, crossover collaborations, cosmetic bundles, and regional updates) by pairing studio resource constraints with live cultural affinity signals from the **Qloo API**.

> [!NOTE]
> **Standard Evaluation Disclaimer**: Decision-support hypothesis based on cultural-affinity evidence and your inputs. Not a forecast of sales, revenue, or profit. Cultural affinity indicates aligned audience taste patterns, not player conversion.

---

## 1. Core Principles

1. **Real Qloo Cultural Intelligence**: Real-world entity resolution and affinity queries against official Qloo endpoints (`https://hackathon.api.qloo.com`). Zero synthetic mocks in production workflows.
2. **Deterministic Decision Engine**: Pure mathematical greedy selection with zero I/O, zero random generation, and stable SHA-256 snapshot hashing (`inputHash`).
3. **Rigorous Evidence Provenance**: Every metric surfaces its origin (`live_qloo`, `cached_qloo`, `cached_stale`, `synthetic_demo`, `user_supplied`, or `system_derived`).
4. **Honest Uncertainty & Missing Evidence**: Unavailable criteria evaluate to `null` (never penalized as zero). Unobserved cultural signals are labeled *"No supporting evidence observed"*, never scored low.
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

Create a `.env` file at the root of the repository (refer to `.env.example`):

```bash
NODE_ENV=development
PORT=4000
LOG_LEVEL=info
DATABASE_URL=postgres://user:password@localhost:5432/patchpilot
SESSION_SECRET=a-secure-random-string-at-least-32-chars-long
ALLOWED_ORIGINS=http://localhost:3000
API_INTERNAL_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=PatchPilot

# Qloo Official API Integration
QLOO_API_KEY=your-official-qloo-hackathon-api-key
QLOO_API_BASE_URL=https://hackathon.api.qloo.com
QLOO_TIMEOUT_MS=10000
QLOO_MAX_RETRIES=2
QLOO_MAX_CONCURRENCY=3
QLOO_WORKSPACE_DAILY_CALLS=150
QLOO_GLOBAL_DAILY_CALLS=2000
```

---

## 5. Local Setup & Reproduction Guide

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL 16 (local installation or Docker)

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/patchpilot/patchpilot.git
cd patchpilot

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and QLOO_API_KEY

# 4. Run database migrations
pnpm db:migrate

# 5. Build all packages
pnpm build

# 6. Start development servers
pnpm dev
```
- API server runs on: `http://localhost:4000`
- Web application runs on: `http://localhost:3000`

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

1. **Launch Workspace (`/`)**: Click **"Launch Demo Workspace"** to initialize the *Ember Arena* reference game profile seeded with Appendix A content initiatives across United States (US), Japan (JP), Brazil (BR), and India (IN).
2. **Review Proposals (`/proposals`)**: Inspect the 6 content proposals, their cost, person-day effort, release windows, and Qloo signal badges.
3. **Inspect Cultural References (`/proposals/:id`)**: Click on *Lantern Festival Seasonal Event* to inspect user-supplied references, resolved Qloo entities, and ambiguity resolution candidate cards.
4. **Execute Prioritization (`/decision`)**: Click **"Run Decision Engine"** to compute the optimal portfolio under the \$360,000 available budget and capacity constraints. View the stacked **BudgetBar**, **Funded Shortlist** rankings, and multi-criteria **CriterionBars**.
5. **Attribution & Re-planning (`/decision/compare`)**: Compare the baseline portfolio against the Qloo-informed ranking. Test interactive budget re-planning (e.g. adjust budget to \$200,000) to observe immediate shortlist shifts and rank movements.
6. **Generate Decision Brief (`/briefs`)**: Generate the executive brief containing the full decision snapshot, provenance IDs, criteria weights, and download the Markdown artifact (`.md`).

---

## 8. Limitations & Scope

- **Cultural Affinity is Not Commercial Output**: High cultural affinity between audience anchors and themes reflects cultural overlap, not player spending or retention.
- **Qloo Category Coverage**: Qloo entity resolution is strongest for titles in games, films, and music. Niche regional entities may return unsupported or empty results.
- **Greedy Selection**: The engine uses a deterministic greedy algorithm with dependency cascade fixpoints. While computationally reproducible and transparent, large fractional items may leave minor unallocated contingency budget.
- **Synthetic Demonstration Seeds**: The demo game *Ember Arena* and its cost structures are synthetic placeholders for evaluation purposes.

---

## 9. License

This project is licensed under the [MIT License](LICENSE).
