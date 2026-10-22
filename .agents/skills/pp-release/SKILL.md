---
name: pp-release
description: >-
  Verify release readiness, execute deployment smoke checks, audit acceptance criteria and security controls,
  and compile the final hackathon report. Use when preparing for release, checking deployed instances,
  or generating docs/status/FINAL_REPORT.md.
---

# `pp-release` — Release Readiness, Deployed Smoke Verification, & Final Audit

Execute **Phase 8 (Deployment and Release)** and **Phase 9 (Final Audit)** per [IMPLEMENTATION.md §6.12, §6.13](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md) and generate [docs/status/FINAL_REPORT.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/FINAL_REPORT.md).

## Final Deliverables Criteria

A valid submission requires:
1. Public repository with an OSI-approved open source license (e.g. MIT).
2. Clean `README.md` covering architecture, setup, environment variables, test instructions, and limitations.
3. Externally accessible working demo with verified real Qloo integration in the deployed configuration.
4. Comprehensive test suites passing with actual recorded outputs.
5. `docs/status/FINAL_REPORT.md` matching the checklist in `docs/IMPLEMENTATION.md §8` without overclaims.

---

## Release Procedure

### Step 1: Production Build and Static Artifact Audit (P8-02, P8-03)
1. Verify clean production build:
   ```powershell
   pnpm build
   ```
2. Scan production web bundles for leaked keys or patterns:
   ```powershell
   pnpm check:bundle
   ```
   - Must return 0 secret findings.
3. Scan git history for committed secrets:
   ```powershell
   gitleaks detect --verbose
   ```
   - Must be 100% clean.

### Step 2: Deployed Smoke Verification (DEP-01 through DEP-09 / P8-05)
Run smoke verification against the public deployed demo URL:
1. Check liveness and readiness:
   ```powershell
   curl -i https://<deployed-api-host>/health
   curl -i https://<deployed-api-host>/ready
   ```
   - Must return HTTP 200 with healthy DB connection and no leaked configuration.
2. Check CORS allowlist and cookie security flags:
   - Verify `pp_session` cookie carries `HttpOnly`, `Secure`, `SameSite=Lax`.
3. Run automated deployed smoke probe:
   ```powershell
   pnpm smoke:deployed -- https://<deployed-web-url>
   ```
4. Perform live Qloo check in the deployed configuration:
   - Call `/qloo/status?probe=true`.
   - Execute one entity resolution and one evidence refresh.
   - Record actual timings, status, and redacted response metadata in [docs/qloo-verification/DEPLOYED_CHECK.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/qloo-verification/DEPLOYED_CHECK.md).

### Step 3: Acceptance Criteria & Security Audit (P9-01, P9-02)
1. AC-by-AC Audit ([PRD.md §7, §8, §9](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/PRD.md)):
   - Map each acceptance criterion (`AC-A1` through `AC-T6`) to its verifying automated test or manual check.
   - Classify as `VERIFIED` or `LIMITATION (reason)`.
2. Security Controls Audit ([SECURITY.md §12](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/SECURITY.md)):
   - Audit `SEC-01` through `SEC-83`. Verify zero secret exposure, workspace isolation, safe pino redaction, and bounded input handling.
3. Claim-Integrity Sweep (P9-04):
   - Grep UI code, `README.md`, and demo scripts for forbidden terms (`revenue`, `ROI`, `conversion`, `profit`, `forecast`, `guaranteed`).
   - Confirm synthetic demo badges are present on all seeded data.

### Step 4: Compile Final Status Report (P9-03)
Write [docs/status/FINAL_REPORT.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/FINAL_REPORT.md) using the required template from [IMPLEMENTATION.md §10](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md):

```markdown
# PatchPilot Final Report — YYYY-MM-DD — commit <sha>

## Summary
<3–5 lines summarizing the product and outcome without overclaims>

## Features: Completed / Partially Completed / Not Implemented
<Detailed list with AC-* traceability keys>

## Real Qloo Integration Evidence
- Phase 0 outcome: GO / GO-WITH-LIMITS
- Enabled strategies: S1 / S2 / S3
- Live call evidence summary with timestamps
- Deployed verification check result

## Automated Test Results
<Full table per TESTING.md §14: static, unit, integration, contract, security, e2e, live>

## Security Audit
<SEC-xx verified table and findings>

## Build & Deployment Status
- Web URL: <link>
- API URL: <link>
- Build status: PASS

## Public Repository & License
- Repository: <link>
- License: MIT (or designated OSI license)

## Known Limitations
<Explicit list: Qloo coverage boundaries, heuristic weights, greedy selection, synthetic records>

## Environment Variables
<Names and placeholders only — no secrets>

## Reproduce the Demo
<Step-by-step instructions to reproduce the live demonstration>

## Remaining Manual Actions
<Any remaining manual operational items>
```
