---
name: pp-test
description: >-
  Execute and report PatchPilot automated test suites across all layers (static, unit, integration, contract,
  security, e2e, and live). Use when validating code changes, running pre-commit checks, testing before phase exit,
  or updating test results in docs/status/PROGRESS.md.
---

# `pp-test` — Multi-Layer Test Execution and Truthful Reporting

Run the automated test suites defined in [TESTING.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/TESTING.md) and record truthful test outcomes.

## Non-Negotiable Testing Rules

1. **Honest reporting only:** A test counts only if it was actually executed and the result inspected. Never mark tests as passing based on assumptions or code inspection.
2. **Standard outcome classes:** Classify test outcomes strictly as:
   - `PASS`: Executed and passed completely.
   - `FAIL`: Executed and failed (record first error line and stack).
   - `NOT RUN`: Test exists or planned but was not executed.
   - `BLOCKED (reason)`: Cannot execute due to missing prerequisite/credential.
3. **No test weakening:** Never delete, disable, or weaken failing assertions to force a passing status.
4. **No mocks in production path:** Fixtures and mocked transports are permitted only in isolated tests (`packages/qloo-client/test/`) and are forbidden from the production composition root.

---

## Test Catalog & Execution Commands

### 1. Static Checks (Typecheck, Lint, Format)
```powershell
pnpm typecheck
pnpm lint
pnpm format:check
```
- Validates strict TypeScript compilation (`tsconfig.base.json`).
- Enforces ESLint boundaries (no web imports of DB/engine/qloo-client), bans `any`, bans `dangerouslySetInnerHTML`.

### 2. Unit Tests (`packages/decision-engine`, pure modules)
```powershell
pnpm test:unit
```
- Tests decision engine (ENG-01 through ENG-23): determinism, hard constraints, cascade, greedy selection, commercial analogs, bounds, explanations.
- Target coverage: >= 95% lines and branches for decision engine.

### 3. Integration Tests (`apps/api` with real Postgres, mocked Qloo HTTP)
```powershell
pnpm test:integration
```
- Tests API routes (API-01 through API-19): workspace isolation, validation errors, proposal CRUD, query logging, quota counters, health endpoints.
- Verifies referential integrity invariants per [DATABASE.md §7](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/DATABASE.md).

### 4. Contract Tests (`packages/qloo-client` vs sanitized captures)
```powershell
pnpm test:contract
```
- Tests adapter contracts (QC-01 through QC-16) against live-captured sanitized fixtures (`test/fixtures/live-captures/`).
- Validates two-stage parsing, schema drift detection, error classifications, redaction, and circuit breaker.

### 5. Security & Secret Scans
```powershell
pnpm test:security
pnpm check:secrets
pnpm check:bundle
```
- `check:secrets`: Runs local secret scanner over working directory and git diff.
- `check:bundle`: Scans built `.next/` bundles to guarantee `QLOO_API_KEY` or key patterns are never leaked to client bundles.
- `test:security`: Validates header hardening (helmet, CORS), cookie flags, and pino redaction paths.

### 6. End-to-End Tests (Playwright in test harness mode)
```powershell
pnpm test:e2e
```
- Runs automated browser flows (E2E-01 through E2E-07): setup, proposal drawer, ambiguity chooser, decision workspace, replan diff, and brief export.

### 7. Full Local CI Test Suite
```powershell
pnpm test
```
- Runs unit + integration + contract + security suites sequentially.

### 8. Live Qloo Tests (Opt-in with real API key)
```powershell
pnpm test:live
pnpm qloo:verify
```
- Requires `QLOO_API_KEY`. Executes live calls against official Qloo API and tests actual response contracts.

---

## Standard Reporting Format

After executing test suites, update the latest test run table in [docs/status/PROGRESS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/PROGRESS.md) following [TESTING.md §14](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/TESTING.md):

```markdown
### Latest Test Run: YYYY-MM-DD (commit <sha>)

- typecheck: PASS | FAIL (n errors)
- lint: PASS | FAIL (n errors)
- unit: X passed / Y failed / Z skipped
- integration: X passed / Y failed / Z skipped
- contract: X passed / Y failed / Z skipped
- security: X passed / Y failed / Z skipped
- e2e: X passed / Y failed / Z skipped
- live-qloo (manual): PASS | FAIL | NOT RUN | BLOCKED (reason)

**Failures:**
- <List of failed tests with first error line>

**Untested:**
- <List of skipped or unrun suites with reasons>
```
