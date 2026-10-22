---
name: pp-build
description: Implements PatchPilot phase by phase from the project documentation, verifying tests and acceptance criteria, prioritizing real Qloo API integration, and recording progress before advancing.
---

# PatchPilot Build Loop

## Mission

Own the complete implementation of PatchPilot from the current repository state to a tested, deployed MVP.

The project documentation in `docs/` defines the requirements. The real Qloo API integration is mandatory.

## Every invocation

1. Read the root AGENTS.md and the relevant project documents, especially docs/IMPLEMENTATION.md.
2. Inspect the current repository, Git changes, and implementation checklist.
3. Identify the earliest incomplete task whose prerequisites are satisfied.
4. Implement one bounded task according to its documented acceptance criteria.
5. Run relevant tests, type checks, lint checks, builds, or integration checks.
6. Diagnose failures and fix actionable issues. Retry only when there is a meaningful change to the approach.
7. Verify the acceptance criteria using actual evidence.
8. Update docs/IMPLEMENTATION.md with the task status, verification results, and remaining blockers.
9. Move to the next eligible task only after the current task is verified.
10. Continue automatically while the next step is clear, safe, and permitted.

## Mandatory Qloo gate

Start with Phase 0 of docs/IMPLEMENTATION.md.

Verify current official Qloo documentation, authentication, supported endpoints, a real request, the actual response, and whether the returned evidence supports the product workflow.

Use the authorized API credential through secure environment configuration. Never print, expose, or commit the key.

Mocks are permitted for isolated automated tests only. Never represent mock data, fabricated responses, or hardcoded results as live Qloo evidence.

If credentials or external access are missing, report the exact blocker. Continue only with work that can safely proceed independently. Do not claim the Qloo milestone has passed until real API evidence supports that claim.

## Engineering rules

- Follow PRD.md, ARCHITECTURE.md, DESIGN.md, CODE_STYLE.md, DATABASE.md, TESTING.md, and SECURITY.md.
- Preserve existing working code and inspect changes before risky operations.
- Do not build a static dashboard in place of working functionality.
- Keep cultural evidence, operational constraints, commercial data, hypotheses, and uncertainty distinct.
- Do not fabricate revenue, ROI, purchase intent, or cultural-affinity results.
- Keep credentials server-side.
- Test incrementally instead of deferring all testing until the end.
- Never mark work VERIFIED merely because files were generated or commands were attempted.
- Do not repeat failing actions indefinitely.
- Ask the user for input when a genuine blocker, missing decision, or sensitive action requires it.

## Progress states

Use these statuses in docs/IMPLEMENTATION.md:

- NOT STARTED
- IN PROGRESS
- VERIFIED
- BLOCKED
- FAILED

Preserve progress between invocations. On resumption, inspect the actual repository and verify the checklist rather than assuming previous work succeeded.

## Completion

Continue through the implementation phases until all mandatory definition-of-done criteria in docs/IMPLEMENTATION.md have been verified, or a genuine external blocker requires user intervention.

Report actual test results, Qloo verification evidence, deployment status, known limitations, and remaining manual steps. Never claim unverified success.
