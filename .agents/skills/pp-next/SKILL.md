---
name: pp-next
description: >-
  Identify, plan, execute, and verify the next pending task in PatchPilot following docs/IMPLEMENTATION.md
  phase gates and checklist order. Use when asking what to work on next, advancing sequentially through implementation
  phases, or implementing bounded tasks.
---

# `pp-next` — Step-by-Step Task Advancement and Checklist Execution

Find, execute, and verify the next pending task from the [IMPLEMENTATION.md §8](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md) execution checklist.

## Implementation Discipline

- **One bounded task at a time.** Never jump ahead or bundle multiple tasks into unverified sweeps.
- **Strict phase gates:** Do not advance to a phase whose prerequisites' exit criteria are unmet.
- **No unverified claims:** Never mark a task `[x]` without running the exact verification command and recording real output.
- **Persist progress immediately:** Update [docs/IMPLEMENTATION.md §8](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md) and [docs/status/PROGRESS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/PROGRESS.md) in the same commit as the code.

---

## Task Execution Workflow

### Step 1: Scan Checklist and Identify Next Task
1. Open [docs/IMPLEMENTATION.md §8](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md).
2. Locate the first task marked `[ ]` (planned) or `[~]` (in progress).
3. Read the task specification:
   - **Task ID**: e.g., `PF-03`, `P0-01`, `P1-03`, `P4-02`.
   - **Action**: What must be done.
   - **Pre**: Required prerequisite tasks.
   - **Artifact**: Expected files or documents produced.
   - **Verify**: Command or check to prove acceptance.
   - **Accept**: Concrete acceptance condition.
   - **Deps/Blockers**: Any blocking dependency.

### Step 2: Validate Prerequisites and Phase Gates
1. Verify that all listed `Pre:` tasks are marked `[x]`.
2. Check Phase Gates:
   - **Preflight (PF)** must be `[x]` before Phase 1.
   - **Phase 0 (P0)** is a hard gate! Phase 2 cannot start unless P0 exit criteria are satisfied (GO or GO-WITH-LIMITS).
   - If blocked by credentials or hosting, follow the **Blocker Protocol** ([IMPLEMENTATION.md §7.2](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md)):
     - Mark task `[!]`.
     - Record blocker in `docs/status/PROGRESS.md`.
     - Work only on permitted unblocked tasks (e.g., P1 foundation, DB schema, pure decision engine).

### Step 3: Implement Minimal Bounded Changes
1. Consult relevant technical authorities in order:
   - Scope: [PRD.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/PRD.md)
   - Architecture: [ARCHITECTURE.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/ARCHITECTURE.md)
   - Security: [SECURITY.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/SECURITY.md)
   - Database: [DATABASE.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/DATABASE.md)
   - Testing: [TESTING.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/TESTING.md)
   - UX/UI: [DESIGN.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/DESIGN.md)
   - Code Style: [CODE_STYLE.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/CODE_STYLE.md)
2. Implement only the minimal code needed to satisfy the acceptance criteria.
3. Write or update accompanying tests per [TESTING.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/TESTING.md).

### Step 4: Run Verification and Record Evidence
1. Run the verification command specified in the task (e.g. `pnpm test:unit`, `pnpm typecheck`, `pnpm lint`, `pnpm check:secrets`).
2. Capture the actual terminal output and summary.
3. If verification passes:
   - Mark task `[x]` in [docs/IMPLEMENTATION.md §8](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md).
   - Add evidence note under the task in the format:
     `Evidence: YYYY-MM-DD · commit <sha> · cmd: <command> · result: <real outcome summary>`
   - Update [docs/status/PROGRESS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/PROGRESS.md).
   - Commit changes with conventional commit header referencing the task ID:
     `git commit -m "feat(P1-03): implement API shell and health endpoints"`
4. If verification fails or is blocked:
   - Mark `[-]` (failed) or `[!]` (blocked).
   - State the exact error message or missing prerequisite. Do not fabricate passing results.
