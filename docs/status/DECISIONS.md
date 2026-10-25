# Architecture & Technical Decision Records (ADRs)

| ID | Date | Title | Status | Evidence / Impact |
|---|---|---|---|---|
| ADR-001 | 2026-10-22 | Workspace Customization Skills Setup | ACCEPTED | Created `.agents/skills/{pp-init, pp-qloo-check, pp-next, pp-test, pp-review, pp-release, pp-build}` for disciplined Antigravity agent execution. |
| ADR-002 | 2026-10-22 | Phase 0 Feasibility Gate: GO | ACCEPTED | Real Qloo API verified against `https://hackathon.api.qloo.com`. Positive & negative auth tested. Entity resolution and market-conditioned insights proven on 3 of 6 proposals. Exit criteria satisfied. |
| ADR-003 | 2026-10-22 | Signal Mode: Tiered Banding | ACCEPTED | Per official Qloo prompt guidelines and observed behavior, scores across separate queries are uncalibrated. Decided `signalMode = 'tiered'` with bands `strong` (>=0.90), `moderate` (>=0.80), and `weak` (<0.80). |
| ADR-004 | 2026-10-22 | Qloo Evidence Strategies S1 and S2 Enabled | ACCEPTED | Enabled Strategy S1 (Anchor co-affinity via `filter.results.entities`) and S2 (Market-conditioned affinity via `signal.location.query`). S3 (Tag overlap) retained as secondary. |
| ADR-005 | 2026-10-22 | Cache & Quota Policy | ACCEPTED | 24-hour cache TTL for fresh queries; 1-hour negative cache for empty results. 150 daily calls per workspace, 2000 global daily quota. |
| ADR-006 | 2026-10-22 | Qloo Search Type Format: Full URNs | ACCEPTED | Discovered live that `/search?types=...` requires full URNs (e.g. `urn:entity:videogame`, `urn:entity:artist`, `urn:entity:movie`) rather than short names. |
| DEC-UI-001 | 2026-10-25 | UI Primitives with shadcn/ui and Radix | ACCEPTED | Adopted shadcn/ui component system and accessible Radix primitives per pp-build (v2) controller §2 & §8.1. Owned source components in `apps/web/components/ui`, Tailwind-native CSS variables, accessible primitives for dialogs/buttons/tabs/tooltips/sheets. |
