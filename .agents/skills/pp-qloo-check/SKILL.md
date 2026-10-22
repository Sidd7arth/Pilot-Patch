---
name: pp-qloo-check
description: >-
  Verify official Qloo API behavior, test authentication, probe entity resolution and affinity strategies,
  and record Phase 0 feasibility evidence. Use whenever executing Phase 0 verification, running live Qloo probes,
  updating the Q-register, or validating integration status.
---

# `pp-qloo-check` — Real Qloo API Verification and Feasibility Proof

Execute the **Phase 0 Qloo Feasibility Proof (P0-01 through P0-10)** and live integration verification per [IMPLEMENTATION.md §6.4](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md) and [TESTING.md §3](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/TESTING.md).

## Core Principles & Non-Negotiables

1. **Real Qloo integration is mandatory.** Never replace the real Qloo API with a mock, hand-seeded cache, fixture, or LLM-generated data in demo or production paths.
2. **Never fabricate evidence.** Cultural affinity ≠ purchase intent. Do not fabricate scores, entity IDs, or responses.
3. **Secrets stay server-side.** Never print, echo, log, or leak `QLOO_API_KEY` in shell outputs, commits, fixtures, or reports.
4. **Phase 0 is a hard gate.** Do not proceed to Phase 2 until Phase 0 exit criteria are satisfied and documented.

---

## Verification Runbook (V-1 through V-12)

### Step 1: Consult Official Documentation (V-1 / P0-01)
1. Locate official Qloo documentation (e.g. `https://docs.qloo.com/` or hackathon developer guide).
2. Record every URL visited, the date opened, and specific facts relied upon in [docs/qloo-verification/PHASE0_REPORT.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/qloo-verification/PHASE0_REPORT.md).
3. Do not invent endpoints. Update the `Q-01` through `Q-16` register in [docs/ARCHITECTURE.md §3](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/ARCHITECTURE.md).

### Step 2: Credential & Auth Check (V-2, V-3, V-4 / P0-02, P0-03)
1. Verify `QLOO_API_KEY` is available in environment or local untracked `.env`.
   - If missing: stop immediately, log blocker in [docs/status/PROGRESS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/PROGRESS.md), and do not mark Phase 0 tasks complete.
2. Run minimal authenticated call:
   ```powershell
   pnpm qloo:verify --step=auth
   ```
   - Must return HTTP 2xx and valid JSON envelope.
3. Run negative authentication check:
   - Provide a deliberately invalid key once. Confirm API returns classified auth error (`failed_auth`), does not retry indefinitely, and does not echo the key.

### Step 3: Entity Resolution Probe (V-5 / P0-04)
1. Test resolution against candidate references across categories:
   - Probe >=12 candidates (including >=10 video game/franchise titles if game entity queries are supported).
2. Execute probe:
   ```powershell
   pnpm qloo:verify --step=resolve
   ```
3. Classify results for each reference:
   - `resolved`: Single unambiguous match.
   - `ambiguous`: Multiple plausible candidates returned.
   - `unresolved`: Zero candidates found.
   - `unsupported`: Entity type or search format rejected by Qloo.
   - `failed`: Upstream error or timeout.
4. Record the full outcome table in `PHASE0_REPORT.md`.

### Step 4: Market & Evidence Strategy Probes (V-6, V-7 / P0-05, P0-06)
1. Test location/market parameters (Q-09) for seed markets: US, JP, BR, IN.
2. Probe candidate strategies (S1 Anchor Co-affinity, S2 Market-conditioned, S3 Tag Overlap) for Appendix A proposals:
   ```powershell
   pnpm qloo:verify --step=insights
   ```
3. Build the outcome matrix: Proposal × Market × Strategy.

### Step 5: Score Semantics, Limits, & Terms (V-8, V-9, V-10 / P0-07)
1. Inspect score/affinity fields in responses (Q-10). Decide `signalMode`:
   - `tiered` (default, recommended): rank percentiles mapped to `strong`, `moderate`, `weak`.
   - `score_normalized`: only if Phase 0 proves cross-query numerical comparability.
2. Inspect rate limit headers (`Retry-After`, quota limits) and error payload structures (Q-11, Q-12).
3. Review terms of use regarding caching and storage (Q-13). Set `QLOO_CACHE_TTL_HOURS`.

### Step 6: Fixture Capture & Evidence Mapping (V-11 / P0-08, P0-09)
1. Capture sanitized live responses:
   ```powershell
   pnpm qloo:capture
   ```
   - Ensure headers, API keys, and sensitive tokens are completely scrubbed.
   - Save metadata sidecars in `packages/qloo-client/test/fixtures/live-captures/`.
2. Define internal mapping in `packages/shared/src/qloo-signal-config.ts` mapping real response fields to `CulturalSignal`.

### Step 7: Phase 0 Exit Decision (V-12 / P0-10)
Evaluate exit criteria per [IMPLEMENTATION.md §6.4](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md):
- **GO**: >= 3 of the 6 seeded proposals have >= 1 `success` query yielding defensible signals.
- **GO-WITH-LIMITS**: 1 to 2 proposals succeed. Document limitations and obtain owner acknowledgment.
- **NO-GO**: 0 proposals succeed. Stop implementation and diagnose.

Record decision and rationale in [docs/status/DECISIONS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/DECISIONS.md) and finalize [docs/qloo-verification/PHASE0_REPORT.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/qloo-verification/PHASE0_REPORT.md).
