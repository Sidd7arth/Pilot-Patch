---
name: pp-init
description: >-
  Initialize, audit, and verify the PatchPilot development environment, tools, and documentation status skeletons.
  Use when starting work on PatchPilot, checking environment prerequisites (Node >= 20, pnpm, Docker, Postgres),
  or establishing status tracking files.
---

# `pp-init` — Environment Initialization and Preflight Audit

Initialize and verify the PatchPilot development workspace per **Preflight (PF-01 through PF-06)** of [IMPLEMENTATION.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md).

## Purpose

Ensure all local development runtimes, package managers, database tools, documentation status skeletons, and environment variables are verified before proceeding with Phase 0 (Qloo Feasibility Proof) or Phase 1 (Technical Foundation).

---

## Preflight Procedure

### Step 1: Audit Repository and Tooling Runtimes (PF-01, PF-02)

Execute the following checks and record the exact version strings:

```powershell
# 1. Check Node.js version (Must be >= 20 LTS)
node -v

# 2. Check pnpm package manager
pnpm -v

# 3. Check Docker and Postgres availability
docker --version
docker compose version

# 4. Check Git status and commit history
git status
git log --oneline -n 10
```

- Verify Node.js is at least v20.0.0.
- Verify pnpm is installed and accessible.
- If Docker is available, ensure a local PostgreSQL container can be run for development and testing.

### Step 2: Verify Project Documentation and Core Rules (PF-03)

Ensure all nine core project documents are present and readable:

1. [PRD.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/PRD.md) — Product requirements and acceptance criteria
2. [IMPLEMENTATION.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md) — Execution roadmap and build contract
3. [ARCHITECTURE.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/ARCHITECTURE.md) — System architecture, topology, and Q-register
4. [SECURITY.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/SECURITY.md) — Security controls and secret hygiene
5. [DATABASE.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/DATABASE.md) — Schema, persistence invariants, and migrations
6. [TESTING.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/TESTING.md) — Test matrix, contract verification, and reporting
7. [DESIGN.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/DESIGN.md) — Design system, tokens, and UX screens
8. [CODE_STYLE.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/CODE_STYLE.md) — TypeScript conventions and module boundaries
9. [AGENTS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/AGENTS.md) (and [docs/AGENTS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/AGENTS.md)) — Coding agent persistent behavioral rules

Ensure the required tracking directories exist:
- `docs/status/`:
  - `PROGRESS.md`
  - `DECISIONS.md`
  - `CONFLICTS.md`
  - `E2E_RESULTS.md`
  - `FINAL_REPORT.md`
- `docs/qloo-verification/`:
  - `PHASE0_REPORT.md`
  - `commands.md`
  - `DEPLOYED_CHECK.md`

### Step 3: Environment Configuration and Credential Audit (PF-05)

Inspect environment configuration:
1. Confirm `.env.example` exists at repository root with non-sensitive placeholders only.
2. Confirm `.env` and `.env.*` (except `.env.example`) are in `.gitignore`.
3. Check if `QLOO_API_KEY` is present in local `.env` or system environment:
   - If present: mark ready for Phase 0 feasibility proof (`/pp-qloo-check`).
   - If missing: follow the **Blocker Protocol** ([IMPLEMENTATION.md §7.2](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md)):
     - Record the blocker in `docs/status/PROGRESS.md`.
     - State required access (`QLOO_API_KEY` and official documentation).
     - Phase 0 cannot be exited without real credentials.

### Step 4: Baseline Check and Tracking Update (PF-04, PF-06)

1. Check for any cross-document conflicts or unresolved technical decisions.
2. If code exists, execute baseline static checks (`pnpm typecheck`, `pnpm lint`, `pnpm test`). If empty, record "clean baseline".
3. Record preflight results in [docs/status/PROGRESS.md](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/status/PROGRESS.md) and update PF-01 through PF-06 checklist items in [docs/IMPLEMENTATION.md §8](file:///c:/Projects/Qloo%20AI%20Hackathon%202026/pilot-patch/docs/IMPLEMENTATION.md).

## Output Checklist
- [ ] Runtime versions audited and documented.
- [ ] Nine core project documents verified.
- [ ] `docs/status/` and `docs/qloo-verification/` skeletons created.
- [ ] Credential status confirmed; blockers recorded if `QLOO_API_KEY` is missing.
- [ ] Checklist updated in `docs/IMPLEMENTATION.md`.
