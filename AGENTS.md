## Implementation Discipline

- Follow docs/IMPLEMENTATION.md as the implementation roadmap.
- For multi-phase work, use the /pp-build skill when available.
- Implement one bounded task at a time.
- Verify each task against its acceptance criteria before advancing.
- Persist progress in docs/IMPLEMENTATION.md.
- Never claim completion without verification evidence.
- Real Qloo integration is mandatory; mocks are permitted only for isolated tests.
- Stop when a genuine blocker requires user input.


# AGENTS.md — Instructions for Antigravity and all coding agents

| Field | Value |
|---|---|
| Document | `docs/AGENTS.md` (**also place a copy or pointer at the repository root as `AGENTS.md`** so agent tooling discovers it) |
| Version | 1.0 (documentation baseline) |
| Date | 2026-10-22 |
| Authority | Coding-agent behavior and repository-wide discipline. |

You are implementing **PatchPilot**: a Qloo-powered, evidence-first decision-support product for live-service / F2P game studios. You own the implementation end to end. These rules apply to every task.

---

## 1. Read First, Then Build

Before any architectural decision, read in this order: `PRD.md` → `IMPLEMENTATION.md` → `ARCHITECTURE.md` → `SECURITY.md` → `DATABASE.md` → `TESTING.md` → `DESIGN.md` → `CODE_STYLE.md`.

- `IMPLEMENTATION.md` is the **execution plan**. Follow its phase order. Do not skip Phase 0.
- `PRD.md` is the **product scope authority**.
- **Verified Qloo API behavior is authoritative over any assumption in these docs.** Items `Q-01…Q-16` in `ARCHITECTURE.md` §3 are **unverified hypotheses** until you record evidence.
- Conflict resolution order is in `IMPLEMENTATION.md` §6.2. If two documents conflict, **stop**, write the conflict in `docs/status/CONFLICTS.md`, resolve it explicitly (and record in `docs/status/DECISIONS.md`) before implementing the affected behavior. Never silently pick one.

## 2. Non-Negotiables

1. **Real Qloo integration is mandatory** and is the product's core. The demo/production path uses the real Qloo API. **Never replace it with a mock, fixture, cache seeded by hand, or LLM-generated data.**
2. **Never fabricate** Qloo responses, cultural insights, entity IDs, affinity values, market preferences, revenue, ROI, conversion, profit, or "expected" anything. Cultural affinity ≠ purchase intent.
3. **No silent fallbacks.** A failed live call is surfaced as failed. Stale cache is shown only when labeled `cached_stale` with timestamp.
4. **Never claim** that a test, build, lint, migration, API call, deployment, or demo succeeded unless **you actually executed it and saw the result**. Quote the real outcome. If you could not run it, say `NOT RUN` and why.
5. **Secrets stay server-side.** Never put `QLOO_API_KEY` or any secret in client code, `NEXT_PUBLIC_*`, logs, fixtures, docs, screenshots, commits, or error responses. See `SECURITY.md`.
6. **Evidence categories stay separate** (cultural / operational / commercial / hypothesis / uncertainty) and **origin labels** (`live_qloo`, `cached_qloo`, `test_fixture`, `synthetic_demo`, `user_supplied`, `system_derived`) are preserved end to end.
7. **Missing evidence is not negative evidence.** Unavailable criteria are `null`, not 0.
8. The decision engine is **deterministic and pure**; LLMs (if any) are downstream only and validated.
9. **Do not build a landing page or static dashboard as a substitute for the working workflow.** Do not stop after planning.

## 3. How to Work

- **Incremental:** one checklist task (or a few tightly related) at a time. Small commits referencing task IDs (e.g., `feat(P2-04): …`).
- **Verify each task** with its stated verification command/procedure before changing its status. Statuses: `[ ]` planned · `[~]` in progress · `[x]` verified · `[!]` blocked · `[-]` failed. "Attempted" is not "verified".
- **After every change** run the relevant checks: `pnpm typecheck`, `pnpm lint`, and the tests for the touched area; before phase exit run `pnpm test` and any phase-specific procedures.
- **Update the checklist in `IMPLEMENTATION.md` §8 with actual progress** (status + date + evidence link/command output summary) in the same commit as the work. Keep `docs/status/PROGRESS.md` current (latest test run table per `TESTING.md` §14).
- **Phase gates are hard.** Do not start a phase whose prerequisites' exit criteria are unmet, except the explicitly allowed isolated work listed in `IMPLEMENTATION.md` (e.g., UI shell/infra while Phase 0 is blocked on credentials).
- **Preserve existing work.** Inspect the repo and git state first. Do not overwrite unrelated files. No unrelated rewrites, renames, or reformatting sweeps.
- **Dependency discipline:** follow `CODE_STYLE.md` §11. Record any new dependency in `docs/status/DECISIONS.md`.
- **Follow conventions** in `CODE_STYLE.md` and module boundaries (lint-enforced).
- **Ask only when blocked** by something that cannot be resolved from the docs or repository (e.g., missing credentials). When blocked, record the blocker, what access is required, and continue with any *unblocked, isolated* work that does not misrepresent status.

## 4. Qloo-Specific Rules

- Locate and use **official Qloo documentation** and real API behavior. Record every URL you open, the date, and the facts relied on in `docs/qloo-verification/PHASE0_REPORT.md`. Do not invent documentation links.
- Update the `Q-xx` register statuses (`VERIFIED`, `VERIFIED-WITH-LIMITS`, `REFUTED`, `BLOCKED`) with evidence.
- Do not hardcode endpoint paths/params that you have not verified. Constants live only in `packages/qloo-client/src/endpoints.ts` with a verification reference.
- Do not copy observed live values into source as constants. Live-captured **sanitized** responses may be stored only as test fixtures under `packages/qloo-client/test/fixtures/live-captures/` with metadata; they are labeled `test_fixture` and never reachable from the production composition root.
- If credentials/docs/capabilities are unavailable: record the blocker, state exactly what is required, **stop claiming** live integration is complete, and do not mark any Qloo-dependent task or phase as verified.
- If the desired game-specific query is unsupported, investigate documented alternatives (S1–S3 in `ARCHITECTURE.md` §7), log **all** attempts including failures, and explain trade-offs. Selecting seed references that Qloo supports is allowed **only** with full disclosure of the failed candidates in the Phase 0 report.
- Respect rate limits and Qloo terms (Q-11, Q-13). Use the per-workspace/global quotas. Don't hammer the API during development; cache within permitted terms.

## 5. Honest Reporting

Every status update, commit message body, and final report must state, as applicable:
- What was done (and the exact command run + real result).
- What failed (first error line) and what you tried.
- What was **not** run or is **blocked** (and why).
- Known limitations and incomplete features.
- Deviations from the docs (with `DECISIONS.md` references).

Never mark a feature complete because its UI exists. Never delete or weaken a failing test to make it pass without recording why in `DECISIONS.md` and fixing the underlying issue or the test's incorrect expectation transparently.

## 6. Security Reflexes

Before every commit: no secrets in diff (`pnpm check:secrets`); no `NEXT_PUBLIC_` additions that carry sensitive values; no logging of headers/bodies; inputs validated; workspace scoping on every query; no `dangerouslySetInnerHTML`. Before release: `pnpm check:bundle`, history scan, dependency audit.

## 7. Evidence-Integrity Reflexes

- Anything shown to a user that originates from Qloo must carry provenance (query ID, retrieved time, origin).
- Anything derived by the system is labeled `system_derived` and links to its source evidence.
- Synthetic demo data is labeled `synthetic_demo` everywhere it appears or influences a result.
- Generated text (brief, explanations, narrative) must pass the banned-claim lint (`TESTING.md` §9).

## 8. Task Completion Protocol

For each task:
1. Confirm prerequisites are `[x]` (or explicitly allowed to proceed).
2. Implement minimal code to satisfy the acceptance criteria.
3. Add/adjust tests per `TESTING.md`.
4. Run verification; capture real output summary.
5. Update checklist status + `docs/status/PROGRESS.md`.
6. Commit with task ID.
7. If anything is unverified, leave the status at `[~]` or `[!]` and say why.

## 9. When Docs Are Wrong or Incomplete

Docs are a blueprint, not scripture. If verified reality contradicts them (especially Qloo behavior), update the affected docs **and** record the change in `DECISIONS.md` (ID, date, evidence, impact). Do not guess silently; do not leave docs inconsistent.

## 10. Final Deliverables Reminder

Public repository + OSI license + README; deployed demo; real Qloo evidence verified in the deployed configuration (or documented blocker); passing test suites (actual results); `docs/status/FINAL_REPORT.md` per `IMPLEMENTATION.md` §6.13. Hackathon deadline per project owner: **2026-10-30 23:45 EDT** (verify submission requirements on the hackathon page). Prioritize in the order given in `IMPLEMENTATION.md` §9.
