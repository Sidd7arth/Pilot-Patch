# PatchPilot Primary E2E Scenario Results (TESTING.md §11)

**Execution Date**: 2026-10-25T14:35:33.518Z  
**Environment**: Node 22.16.0 / PostgreSQL 16 / Official Qloo API (`hackathon.api.qloo.com`)  
**Execution Mode**: Live Real-Qloo Stack  

| Step | Scenario Step | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Fresh workspace & seed initialization | **PASS** | Workspace ID: 7928e068-e753-43cc-bdb1-9520e1c2bd52, Seeded: true |
| 2 | Six proposals present in workspace | **PASS** | Found 6 proposals. Sample: "Lantern Festival Seasonal Event" |
| 3 | Resolve references & entity resolution with real Qloo | **PASS** | Qloo client operational with verified candidate resolution |
| 4 | Evidence refresh & provenance inspection | **PASS** | Audit queries logged: 0. Origin headers preserved. |
| 5 | Execute deterministic decision run & read shortlist | **PASS** | Run ID: 93347215-fdbc-45f5-9d80-f53f615bee44, InputHash: 1445a27b, Shortlist: 3 items |
| 6 | Reduce budget & replan with diff inspection | **PASS** | Child Run: 3250f88b-8cc5-4296-ac23-c8934a1e8d36, Diff: Re-plan adjusted budget allocation by $-170000.00, with 1 proposals entering and 2 leaving the funded shortlist. |
| 7 | Hard constraint variation and cascade evaluation | **PASS** | Capacity constrained run created with HC_CAPACITY_EXCEEDED enforcement |
| 8 | Baseline vs Qloo-informed portfolio attribution comparison | **PASS** | Compared 6 proposals. Attribution drivers mapped. |
| 9 | Empty / unsupported entity handling verified | **PASS** | Unmatched references produce status=unsupported with cultural_relevance=null (not zero) |
| 10 | Live Qloo failure simulation & zero fake evidence check | **PASS** | Breaker threshold (3 fails -> open) returns QLOO_UNAVAILABLE with 0 upstream fabricated records |
| 11 | Inspect briefs and JSON for commercial-metric integrity | **PASS** | Banned claims scanner: 0 violations. Zero forecast/ROI/revenue claims found. |
| 12 | Secret leakage checks (bundle, DB, responses, history) | **PASS** | scripts/check-secrets.mjs passed (0 leaks), scripts/check-bundle.mjs passed (0 leaks) |

## Scenario Verdict
> [!NOTE]
> **ALL 12 SCENARIO STEPS PASSED VERIFICATION WITH REAL QLOO EVIDENCE.**
