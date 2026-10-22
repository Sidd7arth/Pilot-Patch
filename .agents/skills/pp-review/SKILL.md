---
name: pp-review
description: >-
  Perform a rigorous self-review and audit of code, architecture, security controls, evidence transparency,
  and claims policies. Use before committing changes, submitting PRs, marking tasks verified, or exiting implementation phases.
---

# `pp-review` — Pre-Commit & Phase Exit Verification Checklist

Perform a comprehensive quality, security, and evidence-integrity audit per [CODE_STYLE.md §14](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/CODE_STYLE.md), [SECURITY.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/SECURITY.md), and [PRD.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/PRD.md).

Run this review before committing any code changes or marking a task as `[x]` verified in [docs/IMPLEMENTATION.md §8](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md).

---

## 1. Code Quality & Architectural Boundaries

- [ ] **Strict TypeScript Compliance:**
  - Zero `any` types in code (verified via `@typescript-eslint/no-explicit-any`).
  - No unhandled promises (`@typescript-eslint/no-floating-promises`).
  - No non-null assertions (`!`) or `@ts-ignore` in production code.
- [ ] **Architectural Boundary Enforcement:**
  - `apps/web` imports **only** from `packages/shared`. Never imports `qloo-client`, `decision-engine`, `db`, or `apps/api`.
  - `packages/decision-engine` is completely pure: no `fs`, `http`, `fetch`, `Date.now()`, `Math.random()`, or LLM dependencies.
  - `packages/qloo-client` imports only `packages/shared` and Node built-ins. Never touches the database.
  - Repositories are the only layer executing database queries.
  - `apps/api/src/composition-root.ts` is the single place wiring production dependencies.
- [ ] **Validation at All Boundaries:**
  - Every HTTP route validates params, query, and body using `.strict()` Zod schemas.
  - Unknown keys are rejected, not coerced.

---

## 2. Security & Secret Hygiene ([SECURITY.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/SECURITY.md))

- [ ] **No Secrets in Code or Diff:**
  - Run `pnpm check:secrets` — zero findings.
  - `.env` and `.env.*` are gitignored. `.env.example` has only non-secret placeholders.
- [ ] **No Secrets in Client Bundles:**
  - Run `pnpm check:bundle` on built `.next/` output.
  - No `NEXT_PUBLIC_*` variable carries or derives from sensitive credentials (`QLOO_API_KEY`, `SESSION_SECRET`, `DATABASE_URL`).
- [ ] **Safe Logging & Error Envelopes:**
  - Pino redaction configured for `*.apiKey`, `headers['x-api-key']`, `headers.cookie`, `headers.authorization`.
  - Central error handler returns safe error envelope (`code`, `message`, `requestId`). Never returns stack traces, SQL strings, or upstream bodies.
- [ ] **Tenant Isolation:**
  - All DB queries enforce `WHERE workspace_id = $1`. No unscoped finders exist in repositories.
- [ ] **XSS & Injection Protection:**
  - Zero occurrences of `dangerouslySetInnerHTML`.
  - Markdown rendered with raw HTML disabled and sanitized.
- [ ] **Fixture Isolation:**
  - `FixtureTransport` exists only in `test/` and cannot be imported by the production composition root (SEC-40).
  - DB assertion: zero `test_fixture` rows in production environments.

---

## 3. Evidence Integrity & Claims Policy ([PRD.md §5, §6](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/PRD.md))

- [ ] **Five Evidence Categories Kept Separate:**
  - Cultural (Qloo live/cached)
  - Operational (user-supplied cost/effort/window)
  - Commercial (user-supplied historical analog only)
  - Hypothesis (labeled display)
  - Uncertainty (missing, stale, ambiguous, unsupported)
- [ ] **Mandatory Data-Origin Badging:**
  - Every evidence item, score component, and input carries its origin label:
    `live_qloo` · `cached_qloo` · `test_fixture` · `synthetic_demo` · `user_supplied` · `system_derived`.
- [ ] **Missing ≠ Negative Evidence:**
  - Missing criteria are `null`, never 0. Weights renormalize over available criteria.
  - `not_observed` signals contribute to uncertainty, not negative score.
- [ ] **Banned-Claim Lint:**
  - Run banned-claim scan on all generated text (briefs, explanations, summaries).
  - Confirm absence of prohibited terms: `revenue`, `ROI`, `conversion rate`, `profit`, `guaranteed`, `will increase`, `proven`, `forecast`, `outperform`.
  - Fixed disclaimers must match exact approved constants from [DESIGN.md §4](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/DESIGN.md).

---

## 4. Verification Evidence & Documentation Integrity

- [ ] **Task Verification Executed:**
  - The verification command for the task was actually executed.
  - Terminal output summary is captured.
- [ ] **Checklist & Tracking Synchronized:**
  - Task status updated in [docs/IMPLEMENTATION.md §8](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md).
  - [docs/status/PROGRESS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/PROGRESS.md) updated with test run table.
  - Commit message follows conventional format: `type(TASK-ID): description`.
