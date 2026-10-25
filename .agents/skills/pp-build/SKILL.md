---
name: pp-build
description: Implements and resumes PatchPilot from its project documentation, one verified task at a time. Enforces the live Qloo integration gate, builds the UI with shadcn/ui, runs tests, maintains evidence-backed progress, performs a final-polish pass, and runs an evidence-based security audit-and-fix loop before release. Modes - default (continue build), polish, harden, release.
---

# PatchPilot Autonomous Implementation Controller (v2)

## 1. Mission

Own the end-to-end implementation of PatchPilot, a Qloo-powered cultural-intelligence and content-investment decision platform for live-service and free-to-play game studios. Take the repository from its current state to a tested, hardened, externally hosted MVP.

This skill is an **execution controller**: inspect the repo, do real work, verify, persist progress, continue when safe. It must never merely plan, describe future code, or ship a static demo.

**Invocation modes** (argument to `/pp-build`):

| Mode | Behavior |
|---|---|
| *(none)* / `continue` | Resume at the earliest eligible task per §3–§5 |
| `polish` | Run the Final Polish phase (§9) — allowed only when P6 is VERIFIED |
| `harden` | Run the Security Hardening phase (§10) — allowed once P7 is VERIFIED; re-runnable |
| `release` | Run the Release Gate (§11); refuses to pass while any gate item is open |

Status vocabulary maps 1:1 to the `docs/IMPLEMENTATION.md` checklist marks: `NOT STARTED`=`[ ]`, `IN PROGRESS`=`[~]`, `VERIFIED`=`[x]`, `BLOCKED`=`[!]`, `FAILED`=`[-]`. Use the marks in the checklist file; use the words in reports.

## 2. Source of Truth

Read root `AGENTS.md`, then `docs/IMPLEMENTATION.md`, then others as relevant.

- `docs/PRD.md` — product scope and acceptance criteria (`AC-*`).
- `docs/IMPLEMENTATION.md` — sequence, checklist, exit criteria, definition of done.
- `docs/ARCHITECTURE.md` — components, data flow, API contracts, Qloo register `Q-01…Q-16`.
- `docs/DESIGN.md` — UX/visual system. `docs/CODE_STYLE.md` — conventions. `docs/DATABASE.md` — data model. `docs/TESTING.md` — test strategy. `docs/SECURITY.md` — controls `SEC-*`.

Precedence: **verified official Qloo docs and observed API behavior** > PRD > SECURITY > the other technical docs > IMPLEMENTATION > AGENTS. On conflict: log in `docs/status/CONFLICTS.md`, resolve via the hierarchy, record in `docs/status/DECISIONS.md`, then implement. Never silently invent a decision. If a mandatory doc is missing, do not invent major architecture to hide the gap; create the missing doc only if project instructions authorize it, otherwise report the gap.

**Approved deviation recorded by this skill (v2):** the UI is built with **shadcn/ui**. On first use, add `DECISIONS.md` entry `DEC-UI-001` (reason: accessible primitives, owned source, Tailwind-native), update `docs/CODE_STYLE.md` §11 allowed-dependency list and `docs/DESIGN.md` §11 accordingly, and append the new tasks in §12 to the `docs/IMPLEMENTATION.md` checklist (preserving format). `DESIGN.md` §11 already permits Radix/shadcn-style primitives; this makes it explicit.

## 3. Invocation Protocol

At the start of every invocation:

1. Confirm cwd is the PatchPilot repo root.
2. Read `AGENTS.md` and `docs/IMPLEMENTATION.md`; consult other docs relevant to the task.
3. Inspect `git status`, the diff, relevant files, tests, and real project scripts.
4. Reconstruct progress from **repository evidence**, not the checklist alone.
5. Check whether verified work was invalidated by later changes (rerun the cheapest relevant check; reopen tasks that now fail).
6. Pick the earliest incomplete task whose prerequisites are satisfied (or the phase requested by the mode).
7. State the task ID, prerequisites, and acceptance criteria in a few lines, then act.

Don't redo finished work. Don't re-print the whole plan each invocation.

## 4. Mandatory Qloo Feasibility Gate (never bypass)

Real Qloo integration is mandatory. Phase 0 in `docs/IMPLEMENTATION.md` is the first substantive milestone and follows `docs/TESTING.md` §3 (V-1…V-12).

Before any Qloo-dependent functionality:

1. Find and read current **official** Qloo docs; record URLs opened + date.
2. Identify authorized credentials and the secure config (server-side env only).
3. Verify authentication mechanism and API host with a real request.
4. Call a documented, relevant endpoint; inspect the real response and error behavior.
5. Establish whether returned data gives useful cultural evidence for the workflow.
6. Determine supported entity types, markets, relationships (update `Q-xx` statuses with evidence).
7. Map the observed response to the internal evidence model.
8. Record reproducible, secret-redacted steps in `docs/qloo-verification/PHASE0_REPORT.md`.
9. Document limitations, unsupported queries, empty results, and workflow changes required.
10. Record GO / GO-WITH-LIMITS / NO-GO per IMPLEMENTATION §6.4.

Rules: never request that the user paste secrets into chat or source; never print/commit/expose keys; never invent endpoints, params, fields, entities, scores, or results; HTTP 200 alone proves nothing; if the key is missing/invalid, diagnose precisely and ask for the specific user action; if a query is unsupported, investigate documented alternatives and disclose trade-offs; no fake results for Qloo-dependent features before the gate passes. Mocks/fixtures are for isolated automated tests only; the demo path uses real Qloo.

## 5. Task Selection and Bounding

For each task: identify ID → confirm prerequisites → define measurable acceptance criteria → make the smallest sufficient change → verify → record → then select the next. No uncontrolled rewrites. Do not skip a failed prerequisite because downstream work is easier. Do not polish UI before the API feasibility and data flow are understood. After a task is VERIFIED, continue automatically to the next eligible task when clear and within execution limits.

## 6. Verification Requirements

Derive commands from `package.json`, lockfile, scripts, and test config — never assume a script exists. Use as applicable: typecheck, lint, format, unit, integration, contract, security, e2e, production build, migrations, live Qloo checks, deployed checks.

On failure: read the real error → hypothesize root cause → targeted fix → rerun the affected check → widen verification if blast radius grows. No blind retries. After **three materially different attempts** on one blocker without progress, record findings and stop that task for diagnosis or user input. If a check cannot run (credentials, network allowlist, tooling), mark it `BLOCKED`/`NOT RUN` with the reason — never "passing". A green build does not prove the workflow works.

## 7. Evidence Integrity (non-negotiable)

Keep separate in data, API, and UI: cultural evidence (Qloo), operational evidence, user-supplied commercial evidence, hypotheses/interpretations, missing information/uncertainty. Origin labels (`live_qloo`, `cached_qloo`, `test_fixture`, `synthetic_demo`, `user_supplied`, `system_derived`) are preserved end to end.

Every Qloo-dependent recommendation traces to valid evidence or discloses its absence. Never infer purchase intent, conversion, revenue, ROI, or profit from cultural affinity. Never compare raw Qloo scores across requests unless verified behavior justifies it. Missing evidence ≠ negative evidence. The decision engine is deterministic and pure; any LLM summary is downstream and validated against structured evidence. Generated text passes the banned-claim lint (`TESTING.md` §9).

## 8. UI System: shadcn/ui and Visual Style (applies to P6 and §9)

**Goal:** a premium B2B decision workspace for game producers (see `DESIGN.md`) — not a generic AI-chat look, not a default template.

### 8.1 Setup (verify against current official shadcn/ui docs before running; do not rely on memory)

- Initialize shadcn/ui for Next.js (App Router) using the **current official CLI instructions** and the Tailwind major version actually installed. Record the exact command, versions, and chosen options in `DECISIONS.md` (`DEC-UI-001`).
- Components live in `apps/web/src/components/ui/` (owned source). Product components compose them in `components/evidence/`, `components/decision/`, `components/layout/`.
- Approved supporting dependencies (each recorded; prefer what the shadcn CLI installs): Radix primitives (via shadcn), `class-variance-authority`, `clsx`, `tailwind-merge`, animation helper per the shadcn Tailwind version, `lucide-react`, `react-hook-form` + `@hookform/resolvers` (Zod, reusing `packages/shared` schemas), `sonner` (toasts), `next-themes` (light/dark/system). Charts: use shadcn chart/Recharts **only if** a visualization cannot be done with plain CSS/SVG (budget bar, criterion bars, rank slope are CSS/SVG by default). Check licenses (`pnpm licenses list`) and recent-version caution per `CODE_STYLE.md` §11 (prefer versions ≥14 days old).
- Fonts via `next/font` (Inter + JetBrains Mono per `DESIGN.md` §3.2). No third-party runtime font CDNs.

### 8.2 Component inventory (add only what screens need)

`button, card, badge, alert, table, tabs, dialog, sheet (drawers), tooltip, popover, accordion, separator, skeleton, progress, input, textarea, select, slider, switch, checkbox, label, form, scroll-area, dropdown-menu, command (optional), sonner`.

### 8.3 Token mapping

Map `DESIGN.md` §3.1 tokens onto shadcn's CSS variables (`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--ring`, `--destructive`, …) and add **semantic evidence tokens**: `--cultural`, `--operational`, `--commercial`, `--hypothesis`, `--uncertain`, `--warn`, `--ok` (light + dark). Expose them in the Tailwind theme. WCAG 2.2 AA contrast must hold in both themes (verify, don't assume). Never use color as the only carrier of meaning.

### 8.4 Custom components built on shadcn primitives (the product's identity)

`OriginBadge` (Badge variants per origin: LIVE/CACHED/STALE/SYNTHETIC/USER/SYSTEM + tooltip with source, time, ID), `EvidenceCard`, `SignalChip`, `CriterionBar` (unavailable = hatched empty track, never a short bar), `CoverageMeter` (score + lower/upper whisker), `BudgetBar`, `ShortlistCard`, `ReasonChip`, `DiffRow`, `DisclaimerStrip` (text from `packages/shared/src/disclaimers.ts`), `QlooStatusPill`, `EmptyState`/`ErrorState`/skeleton variants. These follow `DESIGN.md` §4–§5 exactly.

### 8.5 Style direction (enhancements)

Deep-ink neutral surfaces, 1px borders over heavy shadows, restrained semantic accents, tabular numerals for all figures, dense-but-legible tables with sticky headers, right-side Sheet for editing/explanations, command-style quick actions only if time permits, subtle 120–180 ms motion honoring `prefers-reduced-motion`, a compact/comfortable density toggle (optional), purposeful empty states with a primary action. **Avoid:** purple-gradient hero clichés, stock illustrations, glassmorphism everywhere, emoji as icons, auto-playing animation, lorem ipsum, hardcoded rankings/scores/Qloo content in `apps/web`. If a `frontend-design` skill is available in this environment, read it and apply its guidance subject to `DESIGN.md`.

### 8.6 UI rules

All data screens implement loading/empty/validation/failure states; `loading.tsx`, `error.tsx`, and `not-found.tsx` exist for routes; forms use shadcn Form + shared Zod schemas (server remains authoritative); no `dangerouslySetInnerHTML`; no direct third-party fetches; no secrets in client code. Synthetic seed data comes from the API, labeled, not bundled in the web app.

## 9. Final Polish Phase (`/pp-build polish`; tasks `P6-12…P6-18`)

Precondition: P6 VERIFIED and the primary workflow passes against the real backend. Every item is verified, not eyeballed.

1. **State audit:** walk every screen and force each state (loading, empty, validation error, Qloo `failed_*`/`empty`/`unsupported`/`ambiguous`/stale, quota exceeded, API down). Capture a checklist table: screen × state → PASS/FAIL.
2. **Copy & claims audit:** grep UI strings, README, demo script, and generated briefs against the banned-claim list; confirm disclaimers on Decision, Compare, Brief; confirm all synthetic data is labeled. 0 violations.
3. **Accessibility:** axe via Playwright on every screen (0 serious/critical), keyboard-only run of the primary workflow, focus management in Sheets/Dialogs, aria-live announcements for run completion/errors, 200% zoom, reduced-motion.
4. **Responsive:** 360 / 768 / 1280 / 1920 px verified; tables scroll inside containers; no page-level horizontal scroll.
5. **Performance:** production build analysis; fix obvious regressions (no unused heavy deps, dynamic-import rarely used heavy components, image sizes); run Lighthouse (or equivalent) on key screens and record scores honestly; no claim of targets that weren't measured.
6. **Resilience & polish details:** error boundaries, 404 page, favicon/title/meta, print stylesheet for Brief (if not cut), consistent number/currency/date formatting, consistent terminology (`Unavailable`, `Not observed`), toasts only for non-critical confirmations.
7. **Demo readiness:** a README demo script (numbered steps) that works on a fresh workspace with real Qloo; real screenshots only if actually captured; update `docs/status/E2E_RESULTS.md`.

Exit: all seven items recorded with real results; failures fixed or listed as limitations.

## 10. Security Hardening Phase (`/pp-build harden`; tasks `P7H-01…P7H-08`)

**Purpose:** systematically find and fix security weaknesses in the repository and deployment **before production**. This is a best-effort, evidence-based audit; it can show "no known open findings per executed checks" but **can never prove the system is secure**. State this in the report; never write "fully secure".

### 10.1 Scope and safety rules

- Test **only** this repository and infrastructure the user owns: local dev, CI, staging, and the user's own deployment. Never target third-party systems. **Never load-test or probe Qloo, LLM providers, or hosting platforms** beyond normal documented use.
- Active scans (e.g., DAST) run against **local or staging**. Against production, perform only passive/low-impact checks (headers, TLS, cookie flags, CORS preflight, single requests) unless the user explicitly authorizes more.
- No destructive actions, no data exfiltration, no exploitation beyond a minimal proof sufficient to confirm a finding, no touching real user/production data. Use synthetic workspaces.
- Never print secrets in reports. Treat any discovered live secret as compromised: stop, tell the user to rotate it, remove it, scrub history only with authorization, and record in `DECISIONS.md`.
- Tools not installed or blocked by the network allowlist → try package-manager equivalents; if still unavailable, mark `NOT RUN` with reason and use a manual substitute. Never imply a scan ran when it didn't.

### 10.2 Automated scan matrix (run what is available; record command + real result)

| Area | Tools (examples; choose actual available) | Target |
|---|---|---|
| Secrets (working tree + **full git history**) | gitleaks (and/or trufflehog) | 0 findings |
| Dependency vulnerabilities | `pnpm audit --prod` (and full), osv-scanner | 0 high/critical (document mitigations for any exception) |
| SAST | semgrep (rulesets: typescript, nodejs, react, owasp-top-ten, secrets), eslint-plugin-security, CodeQL if on GitHub | 0 high; triage the rest |
| Framework advisories | Check **current** official security advisories for the installed versions of Next.js, Express, drizzle/pg, zod, pino, and any auth/session libs via audit output and vendor advisories — do not rely on memory | All applicable advisories patched |
| Container/IaC | trivy (image + config) or hadolint for Dockerfile | 0 high/critical; non-root user; no secrets in layers |
| DAST | OWASP ZAP baseline (or equivalent) against local/staging | 0 high; triage medium |
| Headers/TLS/cookies (deployed) | `curl -sI`, browser devtools, securityheaders-style manual check, SSL check | CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors, cookie flags per SEC-13/14 |
| Client bundle | `pnpm check:bundle` | No secrets or `QLOO_*` strings in client output |
| Logs & errors | Sentinel-secret tests (SEC-05/06) | Sentinel never appears |
| Licenses | `pnpm licenses list` | Compatible with chosen OSI license |

### 10.3 Manual review checklist (read the code; each item → PASS/FAIL/N-A with file refs)

Map to `SECURITY.md` SEC-IDs and OWASP Top 10:

- **Access control/IDOR:** every repository function requires `workspaceId`; cross-workspace read/write/enumerate attempts return 404 (SEC-30); no unscoped queries (grep for raw queries).
- **Injection:** SQL (parameterized only), command injection in scripts, prompt injection in LLM path (SEC-50–53), header injection (e.g., `Content-Disposition` filename in Markdown export), log injection (newlines in logged user text).
- **XSS/output encoding:** no `dangerouslySetInnerHTML`; any Markdown rendering sanitized; CSP effective (no `unsafe-eval`; nonces/hashes).
- **CSRF/CORS/cookies:** SEC-12/14/15 verified on real responses.
- **Mass assignment/validation:** strict Zod on all inputs; clients cannot set server-owned fields (`dataOrigin`, IDs, timestamps) (SEC-43); prototype-pollution keys (`__proto__`, `constructor`) rejected.
- **SSRF/redirects:** no user-controlled outbound URLs; adapter host fixed/allowlisted; Next rewrite/Host-header handling reviewed; no open redirects.
- **Authn/session:** HMAC signing, random IDs, rolling expiry; access code compared in constant time; workspace/global caps enforced atomically (race conditions in quota counters).
- **Rate limiting/DoS:** limits on mutation and Qloo routes; body size/depth limits; ReDoS-safe regex; timeouts (SEC-20–25).
- **Data handling:** money as integers (bigint serialization safe across JSON); no PII; retention/purge works; no secrets in DB/fixtures (SEC-08).
- **Error handling:** envelope only; no stack/SQL/upstream bodies (SEC-06); breaker/failure paths never leak or fabricate.
- **Supply chain:** frozen lockfile in CI; no suspicious postinstall; Actions pinned; no unvetted new deps (SEC-60–64).
- **Next.js specifics:** `NEXT_PUBLIC_*` audit; no server-only modules imported into client components; middleware (if any) not the sole auth control; image `remotePatterns` restricted; server actions (if used) CSRF-safe.
- **Evidence integrity as security:** no `FixtureTransport` reachable from production (SEC-40); no `test_fixture` rows (SEC-41); insert-only evidence repos (SEC-42).

### 10.4 Findings register (`docs/status/SECURITY_AUDIT.md`)

One row per finding: `SF-NNN | severity | area | location (file:line) | description | evidence (command/output summary, redacted) | impact | fix | regression test | status`. Severity rubric: **Critical** (secret exposure, auth/tenant bypass, RCE, SQLi), **High** (stored XSS, CSRF on state change, SSRF, major data leak, exploitable dependency CVE in reachable code), **Medium** (missing header/limit, info leak, weak config), **Low**, **Info**.

### 10.5 Fix loop (one finding at a time)

1. Reproduce/confirm minimally (synthetic data, local/staging).
2. Write a failing regression test where feasible (security test suite).
3. Apply the smallest correct fix addressing the root cause (not just the scanner signature).
4. Run the new test, the affected area tests, then the full suite (`pnpm typecheck && pnpm lint && pnpm test`).
5. Rescan the specific tool; confirm the finding is gone.
6. Update the register (status `FIXED-VERIFIED`) and the SEC control status.
Rules: never suppress or ignore a scanner finding without a written justification in the register; no blanket `audit` overrides; no weakening tests to pass; if a fix needs a risky dependency upgrade, run the full suite and record the change. Three failed fix attempts on one finding → record, mark `BLOCKED`, escalate to the user.

### 10.6 Exit criteria for hardening

- Every SEC-xx control marked `verified`, `not verified (reason)`, or `N-A` with evidence.
- **0 open Critical/High**; Medium either fixed or explicitly **accepted by the user** in writing in the register; Low/Info listed.
- Full-history secret scan clean; client bundle scan clean; log/error sentinel tests pass.
- Dependency audit: 0 high/critical in production dependencies (or documented, reachable-risk-assessed exceptions).
- Staging/local DAST baseline run recorded; deployed header/cookie/CORS checks recorded.
- Final summary states limitations honestly (what was not scanned, tools unavailable, residual risk) and recommends an independent review for anything beyond hackathon scope.

## 11. Release Gate (`/pp-build release`)

Refuses to declare ready unless **all** are VERIFIED with evidence: Phase 0 GO/GO-WITH-LIMITS recorded; real Qloo verified on the **deployed** configuration (`DEPLOYED_CHECK.md`); primary E2E passes; polish exit (§9) done; hardening exit (§10.6) met; production build succeeds; migrations applied; env vars set via host secret manager (names listed, values never shown); `.env.example` placeholders only; README + LICENSE present; public repo history scanned clean; rollback plan noted (previous deploy, DB backup/restore note); claims audit clean; `FINAL_REPORT.md` matches the checklist. If any item is open, output the exact blocking items and stop.

## 12. Checklist Additions (append to `docs/IMPLEMENTATION.md` §8 on first run, same format)

```
- [ ] **P6-12** Init shadcn/ui per current official docs; record DEC-UI-001; map tokens (§8.3) — Pre: P1-05 | Verify: `pnpm --filter web build`; light/dark contrast check | Accept: tokens + base components render in both themes
- [ ] **P6-13** Build evidence component set (§8.4) on shadcn primitives with component tests — Pre: P6-12 | Verify: `pnpm test` component suite | Accept: origin/unavailable/not-observed states visually and programmatically distinct
- [ ] **P6-14** State audit across all screens (§9.1) — Pre: P6-11 | Verify: state matrix recorded | Accept: no FAIL
- [ ] **P6-15** Copy/claims audit (§9.2) — Verify: lint + grep | Accept: 0 violations
- [ ] **P6-16** A11y + responsive pass (§9.3–9.4) — Verify: axe, keyboard run, viewport checks | Accept: 0 serious/critical
- [ ] **P6-17** Performance review (§9.5) — Verify: build analysis + Lighthouse run recorded | Accept: measured results recorded; regressions fixed
- [ ] **P6-18** Demo readiness (§9.7) — Verify: fresh-workspace run | Accept: README demo script works with real Qloo
- [ ] **P7H-01** Scope/safety setup; tool availability matrix — Accept: NOT RUN items listed with reason
- [ ] **P7H-02** Secrets + dependency scans (incl. full git history) — Accept: findings logged; 0 open critical/high
- [ ] **P7H-03** SAST + framework-advisory check — Accept: triaged; 0 high
- [ ] **P7H-04** Manual review checklist (§10.3) — Accept: every item PASS/FAIL/N-A with refs
- [ ] **P7H-05** Local/staging DAST baseline + header/cookie/CORS checks — Accept: results recorded
- [ ] **P7H-06** Fix loop for all Critical/High (and agreed Medium) with regression tests — Accept: each SF row FIXED-VERIFIED
- [ ] **P7H-07** Rescan until clean; update SEC-control statuses — Accept: exit criteria §10.6
- [ ] **P7H-08** Post-deploy hardening re-check on deployed URLs (passive) — Pre: P8-04 | Accept: recorded
```

## 13. Progress Records

Maintain the checklist and phase status in `docs/IMPLEMENTATION.md`. Per meaningful task record: ID, changed files/behavior, acceptance criteria, verification commands, **actual** outcomes, Qloo evidence where applicable, limitations, remaining actions. Update after verification, not before. Reopen tasks broken by later changes. Never fabricate logs, screenshots, API responses, URLs, or results. Keep `docs/status/PROGRESS.md` current (format in `TESTING.md` §14).

## 14. Git and Change Safety

Preserve unrelated modifications. After milestones: inspect `git diff`/`git status`, check for secrets and accidental generated files, run `git diff --check`. No destructive Git (`reset --hard`, `clean -fd`, force-push), no remote changes, no history rewrites (needed only for secret scrubbing — ask first), no destructive DB operations without authorization. Checkpoint commits only if repository instructions or the user allow; Conventional Commits with task IDs. Don't push/publish unless explicitly authorized.

## 15. Security and External Actions

Follow `docs/SECURITY.md`. Secrets stay server-side; `.env.example` has placeholders only; no secrets in frontend vars, errors, bundles, logs, screenshots, or history. Least privilege; validate untrusted input; sanitize external data. Pause for: missing credentials, external account authorization, unresolved product decisions, potentially destructive changes, or any ungranted permission. Keep doing isolated, safe work while one task is blocked.

## 16. Resumption and Limits

Support repeated invocations. At a context/session limit or interruption: finish or safely stop the current operation, save verified progress and blockers in `docs/IMPLEMENTATION.md`, never mark unfinished work complete, and state the exact next task and what's needed to resume. On the next invocation reconstruct state from the repo — don't trust a prior agent's claims. Never claim background execution or future completion.

## 17. End-of-Invocation Report

Report: what was actually implemented; tasks that became VERIFIED; checks run with real results; Qloo verification status (succeeded/failed/blocked); security findings opened/closed (counts by severity) when in harden mode; plan changes; blockers/user actions; next eligible task. Continue into the next task when safe and feasible; otherwise leave a recoverable state.

## 18. Definition of Done

Complete only when every mandatory criterion in `docs/IMPLEMENTATION.md` §6.14 is VERIFIED **and** the Release Gate (§11) passes: functional end-to-end product; verified real Qloo integration; traceable evidence; tested, explainable decision/budget logic; working baseline comparison and replanning; honest handling of failures and missing evidence; no fabricated live results or commercial claims; shadcn/ui-based accessible UI with polish exit met; security hardening exit met with 0 open Critical/High; successful production build; working deployed demo (where access exists); secure configuration with no exposed credentials; reproducible setup/demo instructions; truthful release report with remaining limitations. Never declare completion while a mandatory item is failed, blocked, or unverified.
