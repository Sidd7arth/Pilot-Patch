# PatchPilot Screen State Audit (P6-14 / pp-build §9.1)

**Execution Date**: 2026-10-25  
**Auditor**: PatchPilot Autonomous Implementation Controller (v2)  
**Standard**: DESIGN.md §8 (Component & Screen States)  

---

## 1. Screen × State Verification Matrix

| Screen (Route) | Loading | Empty | Validation Error | Qloo Failed / Down | Qloo Empty / Unsup | Qloo Ambiguous | Cached / Stale | Quota Exceeded | API Offline |
|---|---|---|---|---|---|---|---|---|---|
| **Entry (`/`)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Setup (`/setup`)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Proposals (`/proposals`)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Proposal Detail (`/proposals/[id]`)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Decision (`/decision`)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Compare & Replan (`/decision/compare`)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Evidence Explorer (`/evidence`)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Briefs (`/briefs`, `[id]`)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |

**Total Matrix Checks**: 72 / 72 states evaluated (**100% PASS, 0 FAIL**).

---

## 2. State Handling Verification Details

1. **Loading States**:
   - Every route and data-fetching component renders an animated spinner or pulse container with clear text (e.g. *"Loading proposals...", "Running Engine...", "Evaluating candidates..."*).
2. **Empty States**:
   - Zero proposals or uncalculated runs render an informative empty state with a call-to-action button (e.g. *"No content proposals yet. Add your first initiative"*, *"No decision run yet. Click 'Run Decision Engine'"*).
3. **Validation Errors**:
   - Input forms (proposals, constraints, weights) show inline error messages with red borders and descriptive error strings.
4. **Qloo Failure / Degraded**:
   - If Qloo is unreachable, the top bar `StatusPill` renders yellow `Degraded` or gray `Disconnected`. The baseline prioritization remains fully functional. No fabricated evidence is displayed.
5. **Qloo Empty / Unsupported**:
   - Evaluated as `null` with neutral hatched styling and the label *"No supporting evidence observed"*. Never scored as zero or low.
6. **Qloo Ambiguity Chooser**:
   - Proposal detail provides selectable candidate cards with entity name, ID, and category tags, allowing the producer to confirm the intended match.
7. **Cached vs Stale**:
   - `OriginBadge` renders purple for `cached_qloo` and amber for `cached_stale` with relative timestamps and a "Refresh" button.
8. **Quota Exceeded (429)**:
   - When daily quota (150 calls/workspace or 2000 global) is reached, the UI surfaces a non-blocking quota banner with daily reset indicators.
9. **API Offline**:
   - Caught in `api.ts` error handlers and surfaced as a clear alert banner with retry buttons.

---

## 3. Verdict
> [!NOTE]
> **P6-14 EXIT CRITERION MET**: All screen states behave gracefully per DESIGN.md §8 specifications. Zero unhandled states or broken UI crashes observed.
