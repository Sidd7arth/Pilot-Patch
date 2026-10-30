# PatchPilot

> **Turn cultural signals into smarter content investments.**<br/>
> An evidence-first decision-intelligence platform for live-service and free-to-play game studios, combining Qloo-powered cultural intelligence with production constraints and explainable content-investment prioritization.
>
> 🚀 **Live Production Deployment**: [https://pilot-patch-yauu.vercel.app/](https://pilot-patch-yauu.vercel.app/)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pilot--patch--yauu.vercel.app-blueviolet?logo=vercel)](https://pilot-patch-yauu.vercel.app/)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%20Strict-3178c6.svg)](tsconfig.base.json)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black.svg)](apps/web)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933.svg)](package.json)
[![Qloo API](https://img.shields.io/badge/Qloo%20API-v2.1.965-7865f5.svg)](packages/qloo-client)
[![Automated Tests](https://img.shields.io/badge/Vitest-84%20Passing-brightgreen.svg)](docs/status/PROGRESS.md)
[![E2E Tests](https://img.shields.io/badge/Playwright-15%20Passing-brightgreen.svg)](e2e)
[![Security Audits](https://img.shields.io/badge/Security-0%20Leaks-success.svg)](docs/SECURITY.md)

---

> [!IMPORTANT]
> **Standard Evaluation Disclaimer**: PatchPilot provides decision-support hypotheses derived from observed cultural-affinity evidence and studio-configured constraints. It is **not** a financial forecast, revenue prediction, or sales multiplier. Cultural affinity represents audience taste correlation, not player conversion or monetization intent.

---

## Table of Contents

- [1. Product Overview](#1-product-overview)
- [2. How It Works (Workflow Diagram)](#2-how-it-works-workflow-diagram)
- [3. System Architecture](#3-system-architecture)
- [4. Why PatchPilot is Different](#4-why-patchpilot-is-different)
- [5. Technology Stack](#5-technology-stack)
- [6. Repository Structure](#6-repository-structure)
- [7. Quickstart Guide](#7-quickstart-guide)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Setup](#step-by-step-setup)
  - [Environment Configuration](#environment-configuration)
- [8. Verification & Quality Commands](#8-verification--quality-commands)
- [9. Qloo Integration Transparency](#9-qloo-integration-transparency)
- [10. Product Tour & Walkthrough](#10-product-tour--walkthrough)
- [11. Current Status, Limitations & Roadmap](#11-current-status-limitations--roadmap)
- [12. Contributing & License](#12-contributing--license)

---

## 1. Product Overview

Live-service game teams face an ongoing operational dilemma: when development budgets, engineering capacity, and release calendar windows are finite, which candidate updates deserve investment?

studios routinely weigh competing proposals—seasonal festivals, licensed anime collaborations, music crossovers, cosmetic skin lines, and regional cultural celebrations—against subjective intuition or unconstrained affinity data.

**PatchPilot solves this problem by connecting real cultural intelligence to production constraints:**

| Capability                           | What It Helps Studio Teams Do                                                                             | Status                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Qloo Cultural Intelligence**       | Investigate audience taste affinities using real Qloo API queries across target regional markets.         | **Verified / Implemented**      |
| **Content Proposal Management**      | Define candidate roadmaps with engineering weeks, production budgets, release windows, and prerequisites. | **Verified / Implemented**      |
| **Deterministic Prioritization**     | Score and rank candidate initiatives using transparent mathematical formulas and production constraints.  | **Verified / Implemented**      |
| **Budget-Aware Knapsack Solver**     | Optimize portfolio selection within available budget caps and engineering person-day limits.              | **Verified / Implemented**      |
| **Scenario Replanning**              | Test budget shifts (e.g. $360k → $200k) or forced inclusions to immediately see rank and cutline deltas.  | **Verified / Implemented**      |
| **Baseline Attribution Comparison**  | Directly compare unassisted studio intuition against Qloo-informed selections to see attribution deltas.  | **Verified / Implemented**      |
| **Decision Briefs & Export**         | Generate auditable executive briefs with complete provenance metadata, downloadable as Markdown (`.md`).  | **Verified / Implemented**      |
| **Audit Trails & Evidence Explorer** | Inspect every upstream query, raw response, cache state, and timestamp with zero black-box obscurity.     | **Verified / Implemented**      |
| **LLM Narrative Generation**         | Generate natural-language executive executive summaries via external LLMs.                                | _Planned / Feature-Flagged Off_ |

---

## 2. How It Works (Workflow Diagram)

The following flowchart outlines the end-to-end decision pipeline supported by PatchPilot:

```mermaid
flowchart LR
    A["1. Game & Markets<br/>(Profile, Weights, Capacity)"] --> B["2. Candidate Proposals<br/>(Costs, Efforts, Dates)"]
    B --> C["3. Qloo Retrieval<br/>(/search & /v2/insights)"]
    C --> D["4. Evidence Normalization<br/>(Preserve Nulls & Provenance)"]
    D --> E["5. Constraint Solver<br/>(Greedy Knapsack & Fixpoint)"]
    E --> F["6. Prioritized Portfolio<br/>(Funded vs Cutline)"]
    F --> G["7. Briefs & Replanning<br/>(Attribution, Diff & Export)"]
```

1. **Configure Context**: Define game genre, target audience, and market weights (e.g. US: 40%, JP: 30%, BR: 20%, IN: 10%).
2. **Catalog Proposals**: Input candidate initiatives with estimated production costs, engineering person-days, and dependencies.
3. **Retrieve Intelligence**: Query official Qloo API endpoints for entity resolution and cross-domain audience affinities.
4. **Normalize & Audit**: Map affinities into defensible signal tiers (`strong`, `moderate`, `weak`, `not_observed`) while rigorously preserving missing data as `null`.
5. **Solve Constraints**: Execute deterministic multi-criteria ranking and greedy knapsack allocation with multi-pass dependency cascades.
6. **Compare & Replan**: Evaluate baseline vs. Qloo-informed attribution, adjust available budgets, and review immediate trade-offs.
7. **Publish Brief**: Export immutable, auditable Markdown decision briefs for executive review and greenlight meetings.

---

## 3. System Architecture

PatchPilot is organized as a clean Turborepo monorepo with strict architectural boundaries:

```mermaid
flowchart TD
    subgraph Client["Web Tier (apps/web)"]
        Landing["Marketing Landing Page (/)"]
        AppShell["Decoupled AppShell Layout"]
        Modules["Workspace Modules (/app/*)<br/>• /game (Setup)<br/>• /proposals (Roster)<br/>• /evidence (Audit Log)<br/>• /decisions (Solver)<br/>• /scenarios (Compare)<br/>• /settings/integrations (Qloo Health)"]
        Landing --> AppShell
        AppShell --> Modules
    end

    subgraph Server["API Tier (apps/api)"]
        Express["Express 4 ESM Server (Port 4000)"]
        SessionMw["Signed Session Middleware (HMAC Cookie)"]
        ZodMw["Zod HTTP Boundary Validation"]
        Routers["Routes: /workspaces · /proposals · /decision-runs · /briefs · /qloo"]
        Express --> SessionMw --> ZodMw --> Routers
    end

    subgraph Packages["Core Packages (packages/)"]
        Engine["@patchpilot/decision-engine<br/>Pure Mathematical Knapsack · 0-IO · Deterministic"]
        QlooClient["@patchpilot/qloo-client<br/>Two-Stage Parser · Circuit Breaker · Concurrency Cap"]
        Shared["@patchpilot/shared<br/>Schemas · Signal Configs · Banned Claim Linting"]
    end

    subgraph Persistence["Persistence Tier"]
        DB[("PostgreSQL 16 Database")]
        Drizzle["Drizzle ORM Migrations (19 tables)"]
        Drizzle --> DB
    end

    subgraph External["External Services"]
        QlooAPI["Official Qloo API<br/>https://hackathon.api.qloo.com"]
    end

    Modules -->|HTTP Proxy / Session Cookie| Express
    Routers --> Engine
    Routers --> QlooClient
    Routers --> Shared
    Routers --> Drizzle
    QlooClient -->|X-Api-Key / Outbound HTTPS| QlooAPI
```

---

## 4. Why PatchPilot is Different

| Dimension                    | Typical Industry Approach                                           | PatchPilot Approach                                                                                              |
| ---------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Decision Basis**           | Intuition, executive taste, or unconstrained consumer surveys.      | Real cultural affinity signals retrieved live from Qloo cross-domain knowledge graphs.                           |
| **Operational Reality**      | Unrealistic wishlists disconnected from dev budgets and capacity.   | Hard budget caps, person-day limits, and dependency chains evaluated inside the solver.                          |
| **Algorithmic Transparency** | Black-box LLM predictions or obscure score multipliers.             | Pure deterministic mathematics with stable SHA-256 snapshot hashing (`inputHash`).                               |
| **Evidence Integrity**       | Missing data coerced to zero or hallucinated by AI models.          | **Missing evidence is not negative evidence.** Criteria evaluate to `null`, never penalizing unobserved updates. |
| **Auditability**             | Ephemeral slide decks with lost reasoning.                          | Immutable decision briefs with query timestamps, raw HTTP status codes, and origin badges.                       |
| **Commercial Claim Policy**  | Unsubstantiated claims of "guaranteed ROI" or "predictive revenue." | **Honest claim linting**: Cultural affinity indicates audience taste alignment, not guaranteed sales.            |

---

## 5. Technology Stack

| Layer                        | Technology           | Version                    | Purpose                                                                | Location               |
| ---------------------------- | -------------------- | -------------------------- | ---------------------------------------------------------------------- | ---------------------- |
| **Runtime**                  | Node.js              | `>=20.0.0` (LTS)           | Server execution environment (native ESM)                              | Root                   |
| **Package Manager**          | pnpm                 | `12.15.0`                  | Workspace dependency management & lockfile                             | Root                   |
| **Monorepo Engine**          | Turborepo            | `2.4.0`                    | Task orchestration and package caching                                 | `turbo.json`           |
| **Frontend Framework**       | Next.js              | `16.4.3`                   | App Router, SSR, and client components                                 | `apps/web`             |
| **UI Library**               | React                | `19.0.0`                   | User interface component model                                         | `apps/web`             |
| **Styling & Tokens**         | Tailwind CSS         | `v4`                       | Design system variables & responsive utility classes                   | `packages/ui`          |
| **Component Primitives**     | shadcn/ui + Radix    | Latest                     | Accessible dialogs, buttons, meters, and chips                         | `packages/ui`          |
| **Backend Framework**        | Express              | `4.21.2`                   | REST API, route handlers, error envelopes                              | `apps/api`             |
| **Database & ORM**           | PostgreSQL + Drizzle | Postgres 16 / Drizzle 0.45 | Relational persistence, migrations, type-safe queries                  | `apps/api/src/db`      |
| **Schema Validation**        | Zod                  | `3.24.2`                   | HTTP boundary validation & environment safety                          | `packages/shared`      |
| **Cultural Intelligence**    | Qloo API             | `v2.1.965`                 | Live entity resolution (`/search`) and taste insights (`/v2/insights`) | `packages/qloo-client` |
| **Unit & Integration Tests** | Vitest               | `3.2.7`                    | Fast automated test runner across all layers                           | Root / packages        |
| **End-to-End Tests**         | Playwright           | `1.64.1`                   | Headless Chromium browser workflow automation                          | `e2e/`                 |

---

## 6. Repository Structure

```
pilot-patch/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI workflow (lint, test, build, secrets)
├── apps/
│   ├── api/                       # Express 4 backend application
│   │   ├── src/
│   │   │   ├── config/            # Environment loading & Zod schema validation (SEC-10)
│   │   │   ├── db/                # Drizzle ORM schema, repositories, and migrations
│   │   │   ├── http/              # Express routes, session middleware, error envelope
│   │   │   └── modules/           # Qloo service, decision runs, decision briefs builder
│   │   └── test/                  # Unit and integration test suites
│   └── web/                       # Next.js 16 frontend application
│       ├── app/                   # App Router pages (/, /app/*, /briefs, /integration)
│       ├── components/            # UI components (landing, decision, layout, qloo pills)
│       └── lib/                   # Typed API client bridge
├── packages/
│   ├── decision-engine/           # Pure deterministic mathematical knapsack solver (0-IO)
│   ├── qloo-client/               # Official Qloo API client, circuit breaker & rate limiter
│   ├── shared/                    # Shared TypeScript types, schemas, disclaimers, banned claims
│   ├── ui/                        # Design system tokens, styles, and reusable UI primitives
│   ├── eslint-config/             # Shared ESLint rules & architectural boundaries
│   └── typescript-config/         # Shared strict TypeScript configuration bases
├── docs/                          # Comprehensive technical documentation
│   ├── PRD.md                     # Product requirements authority
│   ├── ARCHITECTURE.md            # Technical architecture and data models
│   ├── SECURITY.md                # Repository security policy and threat matrix
│   ├── DATABASE.md                # PostgreSQL 16 schema and migration guidelines
│   ├── TESTING.md                 # Test plan, quality gates, and verification suites
│   ├── DESIGN.md                  # Visual identity, color palette, and layout principles
│   ├── CODE_STYLE.md              # Engineering conventions and dependency discipline
│   ├── IMPLEMENTATION.md          # Multi-phase execution roadmap and phase gates
│   ├── status/                    # Verified test runs, progress logs, and final reports
│   └── qloo-verification/         # Phase 0 feasibility evidence and live probe findings
├── scripts/                       # Operational scripts (seed, verify, migrate, checks)
├── e2e/                           # Playwright browser end-to-end test suites
├── .env.example                   # Sanitized environment variable template
├── LICENSE                        # MIT License
└── package.json                   # Root workspace scripts and dependencies
```

---

## 7. Quickstart Guide

### Prerequisites

- **Node.js**: `>= 20.0.0` (tested on Node `22.x`)
- **pnpm**: `>= 9.0.0` (installed via `corepack enable pnpm` or npm)
- **PostgreSQL**: `16` (local instance or Docker Compose)

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone https://github.com/Sidd7arth/Pilot-Patch.git
cd Pilot-Patch

# 2. Install dependencies (frozen lockfile)
pnpm install --frozen-lockfile

# 3. Create environment configuration
cp .env.example .env
# Edit .env with your PostgreSQL credentials and QLOO_API_KEY (see table below)

# 4. Start PostgreSQL 16 database
# Option A: Start using included Docker Compose
docker compose up -d

# Option B: Use an existing local PostgreSQL service
# Ensure a database named 'patchpilot' exists matching your DATABASE_URL

# 5. Run database migrations (creates 19 Drizzle schema tables)
pnpm db:migrate

# 6. (Optional) Pre-seed reference game workspace ('Ember Arena')
pnpm seed

# 7. Start development servers
pnpm dev
```

The application services will start at:

- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Workspace Dashboard**: [http://localhost:3000/app](http://localhost:3000/app)
- **API Health Probes**: [http://localhost:4000/health](http://localhost:4000/health) & [http://localhost:4000/ready](http://localhost:4000/ready)
- **Qloo Integration Screen**: [http://localhost:3000/app/settings/integrations](http://localhost:3000/app/settings/integrations)

### Environment Configuration

Use [`.env.example`](.env.example) as the source of truth. Secrets remain strictly server-side:

| Variable                     | Requirement                | Scope  | Description                                   | Safe Default / Example                                         |
| ---------------------------- | -------------------------- | ------ | --------------------------------------------- | -------------------------------------------------------------- |
| `NODE_ENV`                   | Optional                   | Server | Runtime environment                           | `development`                                                  |
| `PORT`                       | Optional                   | Server | Express API port                              | `4000`                                                         |
| `DATABASE_URL`               | **Required**               | Server | PostgreSQL 16 connection string               | `postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/patchpilot` |
| `SESSION_SECRET`             | **Required**               | Server | 32+ char key for signing session HMAC cookies | Custom 32+ char string                                         |
| `ALLOWED_ORIGINS`            | Optional                   | Server | CORS origin allowlist                         | `http://localhost:3000`                                        |
| `QLOO_API_KEY`               | **Required for Live Qloo** | Server | Authorized Qloo API Key                       | `hack_***` (from hackathon organizers)                         |
| `QLOO_API_BASE_URL`          | Optional                   | Server | Official Qloo API host endpoint               | `https://hackathon.api.qloo.com`                               |
| `QLOO_TIMEOUT_MS`            | Optional                   | Server | Outbound HTTP timeout in milliseconds         | `10000`                                                        |
| `QLOO_MAX_CONCURRENCY`       | Optional                   | Server | Maximum parallel in-flight requests           | `3`                                                            |
| `QLOO_WORKSPACE_DAILY_CALLS` | Optional                   | Server | Per-workspace daily call limit quota          | `150`                                                          |
| `QLOO_GLOBAL_DAILY_CALLS`    | Optional                   | Server | System-wide daily call limit quota            | `2000`                                                         |
| `WORKSPACE_TTL_DAYS`         | Optional                   | Server | Workspace auto-purge retention window         | `7`                                                            |
| `API_INTERNAL_URL`           | Optional                   | Server | SSR proxy route to backend                    | `http://localhost:4000`                                        |
| `NEXT_PUBLIC_APP_NAME`       | Optional                   | Client | UI header title                               | `PatchPilot`                                                   |

> [!SECURITY]
> `QLOO_API_KEY` is never exposed to the client bundle or browser. The Next.js frontend communicates exclusively with the Express API through internal server proxies.

---

## 8. Verification & Quality Commands

All quality gates are runnable locally and enforce zero-defect standards:

```bash
# ── Formatting & Linting ──────────────────────────────────────
pnpm format:check             # Verify 100% Prettier formatting compliance
pnpm lint                     # Enforce ESLint architectural module boundaries
pnpm typecheck                # Strict TypeScript typechecking (6/6 projects)

# ── Automated Test Suites ─────────────────────────────────────
pnpm test                     # Run all 84 automated unit and integration tests (Vitest)
pnpm test:unit                # Run unit tests (config, validators, decision engine)
pnpm test:integration         # Run database, repository, lifecycle, and API tests
pnpm test:e2e                 # Run all 15 Playwright browser E2E tests (workflow & navigation)

# ── Security & Secret Audits ──────────────────────────────────
pnpm check:secrets            # Scan repository files & git history for leaked credentials
pnpm check:bundle             # Scan compiled Next.js client bundles for sensitive tokens
pnpm audit --prod             # Audit production dependencies for CVEs (0 vulnerabilities)

# ── Live Qloo API Verification ────────────────────────────────
pnpm test:live                # Run live adapter tests with authorized Qloo credential (3 tests)
pnpm qloo:verify              # Execute full 12-query matrix across candidate proposals & markets

# ── Build & Production Verification ───────────────────────────
pnpm build                    # Compile all monorepo packages and Next.js production routes
pnpm smoke:deployed           # Execute smoke check on active services (/health, /ready, probe)
```

---

## 9. Qloo Integration Transparency

Qloo serves as the authoritative cultural intelligence layer for PatchPilot. The integration follows rigorous engineering discipline:

1. **Host & Protocol**: Communicates with the official hackathon host `https://hackathon.api.qloo.com` (Qloo v2.1.965) over HTTPS using case-sensitive `X-Api-Key` authentication.
2. **Supported Strategies**:
   - **Strategy 1 (S1 — Cultural Reference Resolution)**: Queries `GET /search?query={entity}&types={type}` to resolve raw reference strings into verified Qloo entity UUIDs.
   - **Strategy 2 (S2 — Market-Conditioned Audience Affinity)**: Queries `GET /v2/insights` with anchor game entities, candidate target entities, and market hints (`signal.location.query`).
3. **Resilience & Rate Limits**:
   - Outbound timeout capped at 10 seconds.
   - Token-bucket rate limiter with exponential backoff on transient HTTP 429/5xx errors (HTTP 401 Unauthorized is **never** retried).
   - In-memory circuit breaker tripping after 5 consecutive failures with a 30-second cooldown window.
   - Concurrency bounded to a maximum of 3 simultaneous in-flight requests.
4. **Quota Guards**: Hard limit of 150 live queries/day per workspace and 2,000 queries/day system-wide. When quotas are reached, requests return `QUOTA_EXCEEDED`—the system **never** fabricates substitute data.
5. **Missing-Affinity Integrity**: If Qloo does not observe affinity for an entity or market, the score is preserved as `null`. It is **never** coerced to 0.0, ensuring missing evidence is never misconstrued as negative sentiment.
6. **Provenance Tagging**: Every piece of data displayed in the UI carries an immutable origin tag:
   - `live_qloo`: Retrieved directly from the live Qloo API in the current session.
   - `cached_qloo`: Retrieved from workspace database cache within valid TTL (24h).
   - `synthetic_demo`: Seeded reference initiatives (_Ember Arena_) for demonstration purposes.
   - `user_supplied`: Studio constraints, budgets, and proposal descriptions entered by users.
   - `system_derived`: Deterministic mathematical outputs computed by the decision engine.

---

## 10. Product Tour & Walkthrough

| Screen                            | Route                        | Description & Key Features                                                                                                |
| --------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Marketing Landing Page**        | `/`                          | Editorial B2B product overview, interactive workspace preview, credibility pillars, and instant demo launcher.            |
| **Workspace Overview**            | `/app`                       | Studio mission control showing active game profile, proposal counts, module navigation, and origin legend.                |
| **Game & Constraints Setup**      | `/app/game`                  | Configure title, genre, audience profile, regional market weights (US, JP, BR, IN), and capacity caps.                    |
| **Content Proposals Roster**      | `/app/proposals`             | Inventory of candidate initiatives with cost meters, person-day efforts, release dates, and Qloo signal chips.            |
| **Proposal Detail & References**  | `/app/proposals/[id]`        | Deep dive into a proposal's cultural references, Qloo entity resolution, and interactive ambiguity chooser cards.         |
| **Evidence Explorer & Audit**     | `/app/evidence`              | Comprehensive audit trail of every upstream Qloo query, HTTP response status, latency, and raw response payload.          |
| **Decision Workspace**            | `/app/decisions`             | Prioritization solver showing funded shortlist vs cutline, stacked budget meters, and multi-criteria breakdown bars.      |
| **Scenario Replanning & Compare** | `/app/scenarios`             | Interactive budget slider ($360k → $200k), baseline vs Qloo-informed attribution mapping, and rank shift badges.          |
| **Decision Briefs Export**        | `/briefs`                    | Formatted executive decision brief with audit hashes, trade-off reasoning chips, and one-click Markdown (`.md`) download. |
| **Qloo Integration & Health**     | `/app/settings/integrations` | Real-time connectivity indicator, upstream latency meters, daily quota gauges, and capability matrix.                     |

---

## 11. Current Status, Limitations & Roadmap

### Verified Implementation Status (2026-10-26)

- **Automated Tests**: **84/84 passed** across 12 test files (Vitest unit and integration suites).
- **End-to-End Tests**: **15/15 passed** across 2 Playwright browser suites (`workflow.spec.ts` and `landing-navigation.spec.ts`).
- **Live Qloo Probes**: **3/3 passed** in `test:live`; **12 live queries** verified across candidate proposals and regional markets.
- **Security Audits**: **0 secrets detected** by `check:secrets`; **0 sensitive tokens** in client bundles via `check:bundle`; **0 vulnerabilities** in production dependencies (`pnpm audit --prod`).
- **Production Build**: Clean compilation of 18 static and dynamic Next.js routes.

### Known Limitations

1. **Audience Taste Correlation vs. Sales**: High Qloo cultural affinity proves taste overlap between audiences, not guaranteed sales volume, player conversion, or monetization ROI.
2. **Greedy Knapsack Packing**: The decision engine uses a deterministic greedy algorithm rather than an exhaustive global branch-and-bound solver. In rare edge cases, a high-cost tentpole initiative can block multiple smaller updates that together have a slightly higher combined score.
3. **Session Lifetime**: Public demo workspaces expire after 7 days via database lifecycle auto-purge.
4. **LLM Narratives**: Automatic LLM narrative writing is intentionally feature-flagged off (`BRIEF_NARRATIVE_MODE=none`) to ensure 100% deterministic, audit-defensible decision text.

### Proposed Roadmap

- [ ] **Multi-game Workspace Switching**: Manage multiple live-service titles under a single studio account.
- [ ] **Historical Patch Post-Mortems**: Ingest telemetry from released patches to benchmark predicted affinity against actual engagement.
- [ ] **Custom Scoring Formula Builder**: Allow executive producers to define custom weights and mathematical scoring profiles.
- [ ] **Jira / Linear Issue Export**: Direct webhook export of prioritized roadmaps into studio task trackers.

---

## 12. Contributing & License

### Contribution Workflow

1. Fork the repository and create a feature branch (`git checkout -b feat/my-improvement`).
2. Implement your changes following [CODE_STYLE.md](docs/CODE_STYLE.md) and [SECURITY.md](docs/SECURITY.md).
3. Ensure all quality gates pass before opening a pull request:
   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm check:secrets
   pnpm check:bundle
   ```
4. Submit a pull request referencing relevant acceptance criteria.

### License

PatchPilot is open-source software licensed under the [MIT License](LICENSE).
Copyright (c) 2026 PatchPilot Contributors.
