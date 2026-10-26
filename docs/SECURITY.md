# PatchPilot — Security Policy and Threat Model

| Metadata | Details |
|---|---|
| **Document** | `docs/SECURITY.md` |
| **Status** | Active / Production Baseline |
| **Last Verified** | 2026-10-26 |
| **Repository** | [https://github.com/Sidd7arth/Pilot-Patch](https://github.com/Sidd7arth/Pilot-Patch) |
| **Authority** | Governs repository security, credential handling, data boundaries, and threat mitigation. |

---

## Table of Contents

- [1. Scope and Supported Claims](#1-scope-and-supported-claims)
- [2. Threat Model](#2-threat-model)
- [3. Secret Management & Environment Variables](#3-secret-management--environment-variables)
  - [Server-Side Secret Isolation](#server-side-secret-isolation)
  - [Template Configuration (.env.example)](#template-configuration-envexample)
  - [Automated Secret & Bundle Scanning](#automated-secret--bundle-scanning)
  - [Credential Rotation Procedure](#credential-rotation-procedure)
- [4. Qloo Integration Security & External Trust Boundary](#4-qloo-integration-security--external-trust-boundary)
  - [External Boundary Controls](#external-boundary-controls)
  - [Missing-Affinity Integrity](#missing-affinity-integrity)
  - [Data Provenance & Origin Tagging](#data-provenance--origin-tagging)
- [5. Application & API Security](#5-application--api-security)
  - [HTTP Boundary Validation](#http-boundary-validation)
  - [Session & Cookie Security](#session--cookie-security)
  - [CORS & CSRF Defenses](#cors--csrf-defenses)
  - [SQL Injection Prevention](#sql-injection-prevention)
  - [Error Envelope & Information Redaction](#error-envelope--information-redaction)
  - [Banned Claims Linting](#banned-claims-linting)
- [6. Data Handling, Minimization & Privacy](#6-data-handling-minimization--privacy)
- [7. Dependency & CI/CD Pipeline Security](#7-dependency--cicd-pipeline-security)
- [8. Incident Response & Vulnerability Reporting](#8-incident-response--vulnerability-reporting)
- [9. Release Security Checklist](#9-release-security-checklist)

---

## 1. Scope and Supported Claims

This policy covers all components of the PatchPilot monorepo:

- **Web Frontend** (`apps/web`): Next.js 16 App Router, React 19 client components, and UI design system.
- **Backend API** (`apps/api`): Express 4 ESM service, session middleware, route handlers, and error envelopes.
- **Core Packages** (`packages/*`): Pure decision engine, Qloo client adapter, shared types, and design system.
- **Persistence Layer**: PostgreSQL 16 relational database, Drizzle ORM schemas, and database migrations.
- **CI/CD Pipeline**: GitHub Actions automated workflows, linting, typechecks, and secret scanning scripts.

### Implementation Status Labels

To maintain strict audit transparency, security controls throughout this document are labeled with their verified status:

- **`[VERIFIED]`**: Implemented in source code and validated by automated tests or live verification commands.
- **`[EXTERNAL-CONFIG]`**: Implemented in code, but depends on external hosting environment or cloud provider configuration.
- **`[PLANNED]`**: Documented architecture or future capability not yet active in the current baseline.

---

## 2. Threat Model

The following matrix identifies the primary security threats evaluated for PatchPilot, their potential operational impact, and the mitigating controls implemented in the repository:

| Threat ID | Threat Scenario | Potential Impact | Mitigating Control | Status |
|---|---|---|---|---|
| **T-01** | **Qloo API Key Exposure** | Unauthorized third-party usage, quota exhaustion, unexpected billing. | Server-side only secret isolation, `.gitignore` rules, `check:secrets`, and `check:bundle` scanners. | **`[VERIFIED]`** |
| **T-02** | **Secret Leakage in Git / Logs** | Long-term credential compromise across public repository history or log aggregates. | Pino structured logging with redaction serializers; central error envelope masking; pre-commit scanners. | **`[VERIFIED]`** |
| **T-03** | **Untrusted User Input Injection** | SQL injection, XSS, prototype pollution, or memory exhaustion. | Strict Zod boundary validation on all routes; parameterized Drizzle ORM queries; ban on `dangerouslySetInnerHTML`. | **`[VERIFIED]`** |
| **T-04** | **Malicious or Drifted Upstream Responses** | Application crashes, poisoned decision calculations, schema drift. | Two-stage Zod response parsing; schema mismatch detection; defensive error classification (`failed_upstream`). | **`[VERIFIED]`** |
| **T-05** | **Misleading Missing Affinity Scoring** | Penalizing valid initiatives with 0.0 scores due to missing upstream evidence. | Explicit `null` preservation for missing affinity; rank-based fallback in signal mapping; regression test `QC-08b`. | **`[VERIFIED]`** |
| **T-06** | **API Abuse & Upstream Exhaustion** | Service denial, upstream Qloo rate limiting, budget depletion. | In-memory token bucket rate limiter; circuit breaker (5 failures / 30s cooldown); daily quota counters. | **`[VERIFIED]`** |
| **T-07** | **Cross-Workspace Data Access** | Information leakage between studio workspaces or tenant enumeration. | Cryptographic HMAC session cookies; tenant-scoped database queries (`workspaceId`); 404 responses on foreign IDs. | **`[VERIFIED]`** |
| **T-08** | **Synthetic Demo Data Confusion** | Stakeholders mistaking demo fixtures for verified production Qloo intelligence. | Server-assigned data provenance tags (`live_qloo`, `cached_qloo`, `synthetic_demo`, `system_derived`); UI badges. | **`[VERIFIED]`** |
| **T-09** | **Vulnerable Third-Party Dependencies** | Remote code execution or package supply-chain compromise. | Frozen lockfiles (`pnpm install --frozen-lockfile`); production CVE audits (`pnpm audit --prod`: 0 vulnerabilities). | **`[VERIFIED]`** |
| **T-10** | **Information Disclosure in Errors** | Exposing database schemas, environment variables, or stack traces to clients. | Central error handler mapping all errors to structured `{ error: { code, message } }` with redacted internals. | **`[VERIFIED]`** |

---

## 3. Secret Management & Environment Variables

### Server-Side Secret Isolation

- **SEC-01 `[VERIFIED]`**: All sensitive credentials (`QLOO_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, `LLM_API_KEY`) exist exclusively as server-side environment variables loaded by `apps/api`.
- **SEC-02 `[VERIFIED]`**: The frontend application (`apps/web`) contains **zero** secret credentials. No `NEXT_PUBLIC_*` variable is permitted to carry, derive from, or reference an API key or signing secret.
- **SEC-03 `[VERIFIED]`**: Production session secrets must be custom strings. The Zod configuration schema (`apps/api/src/config/env.ts`) includes a `.refine()` rule that rejects the development fallback session secret when `NODE_ENV === 'production'`.

### Template Configuration (`.env.example`)

The repository provides [`.env.example`](../.env.example) as an unpopulated blueprint for developers. It contains zero live credentials:

```bash
# ──────────────────────────────────────────────────────────
# PatchPilot — Environment Configuration Template
# Copy to .env and fill in real values. NEVER commit .env.
# ──────────────────────────────────────────────────────────

NODE_ENV=development
PORT=4000
LOG_LEVEL=info

# ── Database ──────────────────────────────────────────────
DATABASE_URL=postgres://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/patchpilot

# ── Session Security ─────────────────────────────────────
# Generate a strong random string (>= 32 chars). Example: openssl rand -hex 32
SESSION_SECRET=

# ── CORS ──────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000

# ── Qloo API (required for cultural intelligence) ────────
QLOO_API_KEY=
QLOO_API_BASE_URL=https://hackathon.api.qloo.com
QLOO_TIMEOUT_MS=10000
QLOO_MAX_RETRIES=2
QLOO_MAX_CONCURRENCY=3
QLOO_WORKSPACE_DAILY_CALLS=150
QLOO_GLOBAL_DAILY_CALLS=2000
```

### Automated Secret & Bundle Scanning

Two dedicated automated scanners are integrated into the repository and enforced in CI:

1. **`pnpm check:secrets` (`scripts/check-secrets.mjs`) `[VERIFIED]`**:
   - Verifies that `.env` is untracked by Git.
   - Scans all repository files and commit history for private key blocks, GitHub tokens, generic API key assignments, and hardcoded secrets.
2. **`pnpm check:bundle` (`scripts/check-bundle.mjs`) `[VERIFIED]`**:
   - Inspects compiled Next.js client bundles (`apps/web/.next/static/`) after production builds.
   - Verifies that `QLOO_API_KEY`, header strings (`x-api-key`), and secret tokens do not leak into browser-accessible JavaScript.

### Credential Rotation Procedure

If a secret is ever suspected of exposure:

1. **Immediate Revocation**: Revoke the API key in the Qloo Hackathon developer portal or regenerate database credentials.
2. **Environment Update**: Deploy the new secret to the host environment variables or secret manager.
3. **History Purge (if committed)**: If committed to Git, immediately scrub the commit using `git filter-repo` or BFG Repo-Cleaner, force push the clean branch, and record the remediation in `docs/status/DECISIONS.md`.
4. **Audit Verification**: Execute `pnpm check:secrets` and `pnpm test:live` to verify credential validity and clean history.

---

## 4. Qloo Integration Security & External Trust Boundary

PatchPilot treats the external Qloo API as an untrusted boundary. Outbound communication is managed through `@patchpilot/qloo-client`:

```mermaid
flowchart LR
    App["PatchPilot API Tier"] --> Limiter["Rate Limiter & Quota Gate<br/>(150 calls/day limit)"]
    Limiter --> Breaker["Circuit Breaker<br/>(5 fails / 30s cooldown)"]
    Breaker --> Timeout["Timeout & Concurrency Cap<br/>(10s timeout / max 3 parallel)"]
    Timeout --> Transport["Transport Layer<br/>(X-Api-Key Header)"]
    Transport --> Qloo["Official Qloo API<br/>https://hackathon.api.qloo.com"]
    Qloo --> Parser["Two-Stage Zod Parser<br/>(Preserve Nulls & Detect Drift)"]
    Parser --> Cache["PostgreSQL Cache<br/>(24h TTL / Sanitized Payloads)"]
```

### External Boundary Controls

- **Timeout Bounds `[VERIFIED]`**: Outbound HTTP requests are aborted after 10,000ms (`QLOO_TIMEOUT_MS`).
- **Concurrency Cap `[VERIFIED]`**: Outbound calls are throttled through a semaphore allowing at most 3 concurrent in-flight requests.
- **Circuit Breaker `[VERIFIED]`**: After 5 consecutive upstream failures, the circuit breaker trips to `OPEN`, rejecting subsequent calls for 30 seconds to protect system availability.
- **Retry Discipline `[VERIFIED]`**: Retries are limited to transient 5xx server errors or 429 rate limits with exponential backoff. **HTTP 401 Unauthorized errors are never retried.**
- **Daily Quotas `[VERIFIED]`**: Hard limits of 150 calls/workspace/day and 2,000 calls/system/day are checked before issuing outbound requests.

### Missing-Affinity Integrity

- **Rule 7 Compliance `[VERIFIED]`**: In accordance with project discipline, **missing evidence is not negative evidence**.
- When Qloo returns an entity without an affinity score or with an explicit `null` affinity, the parser records `affinity: null` (never coercing to `0.0`).
- Downstream signal mapping (`mapInsightsToSignal`) evaluates missing affinities using relative rank percentiles rather than penalizing updates as zero-scored initiatives. Verified via regression test `QC-08b`.

### Data Provenance & Origin Tagging

Every piece of cultural evidence is tagged server-side with an immutable provenance label:
- `live_qloo`: Verified real-time query to official Qloo endpoint.
- `cached_qloo`: Valid cached query result (TTL ≤ 24 hours).
- `synthetic_demo`: Pre-seeded reference game data (*Ember Arena*).
- `user_supplied`: Studio constraints and proposals entered by producers.
- `system_derived`: Deterministic knapsack solver outputs.

Clients cannot forge origin tags; Zod input schemas reject client-supplied origin overrides.

---

## 5. Application & API Security

### HTTP Boundary Validation

- **Zod Request Validation `[VERIFIED]`**: Every API endpoint parses and validates `req.params`, `req.query`, and `req.body` using strict Zod schemas before reaching business logic.
- **Payload Size Caps `[VERIFIED]`**: Express JSON body parser is restricted to `100kb` (`limit: '100kb'`).
- **No `dangerouslySetInnerHTML` `[VERIFIED]`**: React components render text safely with standard escaping; HTML injection is banned via ESLint rules.

### Session & Cookie Security

- **Signed Session Cookie `[VERIFIED]`**: User workspaces are tracked via `pp_session` signed with HMAC-SHA256 using `SESSION_SECRET`.
- **Cookie Attributes `[VERIFIED]`**:
  - `HttpOnly`: Inaccessible to client JavaScript.
  - `SameSite: Lax`: Mitigates cross-site request forgery.
  - `Secure`: Transmitted only over HTTPS (in production).
  - `Max-Age`: Rolling expiry tied to `WORKSPACE_TTL_DAYS` (default 7 days).

### CORS & CSRF Defenses

- **Strict CORS Origin Allowlists `[VERIFIED]`**: Configured via `ALLOWED_ORIGINS` (default `http://localhost:3000`). Wildcard origins (`*`) are disallowed when `credentials: true`.
- **Custom Request Header Check `[VERIFIED]`**: State-changing requests (`POST`, `PUT`, `DELETE`) require the custom header `X-Requested-With: patchpilot`, preventing simple cross-origin form submissions.
- **Security Headers `[VERIFIED]`**: Enforced via `helmet`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN` / `frame-ancestors: 'none'`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (in production)
  - `Referrer-Policy: no-referrer`

### SQL Injection Prevention

- **Parameterized Queries `[VERIFIED]`**: 100% of database access is handled through Drizzle ORM's parameterized query builder. Raw SQL string concatenation is strictly banned.

### Error Envelope & Information Redaction

- **Sanitized Errors `[VERIFIED]`**: The central error handler (`apps/api/src/http/error-handler.ts`) converts all runtime exceptions into safe, structured JSON envelopes:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input parameters supplied"
    }
  }
  ```
- **Zero Leakage `[VERIFIED]`**: Stack traces, database column names, internal server paths, and API keys are scrubbed before sending responses. Tested with sentinel values in `error-envelope.test.ts`.

### Banned Claims Linting

- **Automated Claim Guardrails `[VERIFIED]`**: Generated decision briefs and narrative text are checked against a banned claims registry (`packages/shared/src/banned-claims.ts`).
- Phrases promising "guaranteed ROI," "projected revenue multipliers," or "commercial conversion guarantees" are rejected during brief generation.

---

## 6. Data Handling, Minimization & Privacy

| Data Category | Stored Attributes | Sensitivity | Retention & Purge |
|---|---|---|---|
| **User Identity** | Anonymous workspace UUID (`pp_session`) | Low / Anonymous | Auto-purged after 7 days |
| **Studio Constraints** | Budgets, person-day limits, market weights | Confidential Business Data | Scoped to workspace; auto-purged |
| **Candidate Proposals** | Update titles, costs, efforts, dates | Confidential Business Data | Scoped to workspace; auto-purged |
| **Qloo Query Logs** | Sanitized query parameters, status, duration | System Intelligence | Masked identifiers; auto-purged |
| **Raw Qloo Responses** | Redacted JSON response envelopes | Audit Cache | Sanitized (no headers/keys); auto-purged |

- **Zero PII `[VERIFIED]`**: PatchPilot collects no user names, email addresses, IP addresses, or personal identifiers.
- **Lifecycle Auto-Purge `[VERIFIED]`**: Database lifecycle service automatically purges workspaces, proposals, decision runs, and evidence records older than `WORKSPACE_TTL_DAYS` (default 7 days).

---

## 7. Dependency & CI/CD Pipeline Security

- **Frozen Lockfile `[VERIFIED]`**: CI builds enforce exact dependency versions via `pnpm install --frozen-lockfile`.
- **Zero Vulnerability Audit `[VERIFIED]`**: `pnpm audit --prod` reports 0 high or critical vulnerabilities.
- **Architectural Boundary Linting `[VERIFIED]`**: `eslint-plugin-boundaries` enforces strict package layer isolation (e.g. `packages/decision-engine` cannot import from `apps/api` or external networks).
- **TypeScript Strict Mode `[VERIFIED]`**: Enforced across 6/6 monorepo projects (`noImplicitAny`, `strictNullChecks`).

---

## 8. Incident Response & Vulnerability Reporting

### Incident Response Playbook

1. **Suspected Credential Leak**:
   - Immediately revoke `QLOO_API_KEY` in the hackathon developer portal.
   - Update `QLOO_API_KEY` on the API host and redeploy.
   - Run `pnpm check:secrets` and scan commit history with `git log -S`.
2. **Upstream Qloo Drift or Outage**:
   - Verify health via `pnpm test:live` and `GET /api/v1/qloo/status`.
   - Circuit breaker isolates upstream outages; UI displays cached or offline indicators.
3. **Reported Calculation Error**:
   - Reproduce deterministically using the decision run's immutable `inputHash`.
   - Verify against pure unit test suite in `packages/decision-engine`.

### Vulnerability Reporting

If you discover a security vulnerability in PatchPilot:

1. **Private Reporting**: Open an advisory via [GitHub Private Vulnerability Reporting](https://github.com/Sidd7arth/Pilot-Patch/security/advisories) on the repository.
2. **Public Disclosure**: Please do not open public issues detailing reproducible exploits before the maintainers have acknowledged and addressed the vulnerability.
3. **Response Protocol**: Maintainers will review the report, reproduce the finding in an isolated sandbox, implement a fix, and publish a patched release with an accompanying security advisory.

---

## 9. Release Security Checklist

This checklist verifies the security baseline for release:

- [x] **No credentials tracked in Git**: Verified via `pnpm check:secrets` (0 findings).
- [x] **Client bundles free of secrets**: Verified via `pnpm check:bundle` (0 tokens in `.next/static`).
- [x] **Production session secret hardened**: Enforced by Zod schema `.refine()` rule in `apps/api/src/config/env.ts`.
- [x] **Upstream Qloo responses validated**: Two-stage Zod parser in `packages/qloo-client`.
- [x] **Missing affinity preserved as null**: Verified via regression test `QC-08b` in `adapter.test.ts`.
- [x] **Error messages redacted**: Tested with sentinel key injections in `error-envelope.test.ts`.
- [x] **Dependencies free of known CVEs**: Verified via `pnpm audit --prod` (0 vulnerabilities).
- [x] **Strict architectural boundaries enforced**: Verified via `pnpm lint` (`eslint-plugin-boundaries`).
- [x] **Parameterized SQL queries only**: Verified via Drizzle ORM repository implementations.
- [x] **CORS & CSRF protections active**: Allowlisted origins and `X-Requested-With` header enforcement.
- [x] **All automated test suites passing**: 84 unit/integration tests and 15 Playwright E2E tests green.
