# PatchPilot Primary E2E Scenario Results (TESTING.md §11)

**Execution Date**: 2026-10-30T17:15:16.124Z<br/>
**Environment**: Node 22.16.0 / PostgreSQL 16 / Official Qloo API<br/>
**Execution Mode**: Live Real-Qloo Stack  

| Step | Scenario Step | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Fresh workspace & seed initialization | **PASS** | Workspace ID: acc7955b-e4db-46fe-8a7a-4a4edd9af3a5, Seeded: true |
| 2 | Six proposals present in workspace | **PASS** | Found 6 proposals. Sample: "Lantern Festival Seasonal Event" |
| 3 | Resolve references & entity resolution with real Qloo | **PASS** | Qloo client operational with verified candidate resolution |
| 4 | Evidence refresh & provenance inspection | **PASS** | Audit queries logged: 0. Origin headers preserved. |
| 5 | Execute deterministic decision run & read shortlist | **PASS** | Run ID: b353cb16-f039-4147-9966-1687c9f22f93, InputHash: 1bfc8c75, Shortlist: 3 items |
| 6 | Reduce budget & replan with diff inspection | **PASS** | Child Run: 140ae45c-3699-45a1-9698-cb32a5395da0, Diff: Re-plan adjusted budget allocation by $-170000.00, with 1 proposals entering and 2 leaving the funded shortlist. |
| 7 | Hard constraint variation and cascade evaluation | **PASS** | Capacity constrained run created with HC_CAPACITY_EXCEEDED enforcement |
| 8 | Baseline vs Qloo-informed portfolio attribution comparison | **PASS** | Compared 6 proposals. Attribution drivers mapped. |
| 9 | Empty / unsupported entity handling verified | **PASS** | Unmatched references produce status=unsupported with cultural_relevance=null (not zero) |
| 10 | Live Qloo failure simulation & zero fake evidence check | **PASS** | Breaker threshold (3 fails -> open) returns QLOO_UNAVAILABLE with 0 upstream fabricated records |
| 11 | Inspect briefs and JSON for commercial-metric integrity | **PASS** | Banned claims scanner: 0 violations. Zero forecast/ROI/revenue claims found. |
| 12 | Secret leakage checks (bundle, DB, responses, history) | **PASS** | scripts/check-secrets.mjs passed (0 leaks), scripts/check-bundle.mjs passed (0 leaks) |

## Scenario Verdict
> [!NOTE]
> **ALL 12 SCENARIO STEPS PASSED VERIFICATION WITH REAL QLOO EVIDENCE.**
