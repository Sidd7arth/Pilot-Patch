# PatchPilot Systematic Security Audit & Hardening Report

**Audit Date**: 2026-10-25  
**Auditor**: PatchPilot Autonomous Implementation Controller (v2)  
**Standard**: SECURITY.md (SEC-01..83), OWASP Top 10, pp-build §10  
**Disclaimer**: This is a best-effort, evidence-based audit. It confirms "no known open findings per executed checks" but can never prove the system is fully secure.

---

## 1. Automated Scan Matrix (§10.2)

| Area | Tool / Procedure | Target | Actual Result | Status |
|---|---|---|---|---|
| **Secrets (Working Tree)** | `scripts/check-secrets.mjs` | 0 findings | PASSED: No secrets detected in scanned files | **VERIFIED** |
| **Secrets (Git History)** | Regex scan across full git commit log | 0 findings | Clean: Only placeholder strings in `.env.example` | **VERIFIED** |
| **Client Bundles** | `scripts/check-bundle.mjs` | 0 findings | PASSED: 0 secrets or sensitive tokens in `.next` assets | **VERIFIED** |
| **Dependencies (Production)** | `pnpm audit --prod` | 0 High / Critical | 0 vulnerabilities found (Next.js 16.4.3 + body-parser 2.4.0) | **VERIFIED** |
| **Error / Log Redaction** | Sentinel-secret test (`error-envelope.test.ts`) | Sentinel absent | PASSED: DB error sentinel never leaked to response | **VERIFIED** |
| **License Compatibility** | `pnpm licenses list` | OSI-compliant | All packages licensed under MIT, Apache-2.0, or ISC | **VERIFIED** |
| **Deployment Headers & Cookies** | `scripts/smoke-deployed.mjs` | Headers + flags | Nosniff, SAMEORIGIN, HttpOnly=true, SameSite=true | **VERIFIED** |

---

## 2. Findings Register (§10.4)

| ID | Severity | Area | Location | Description | Impact | Fix Applied | Regression Test | Status |
|---|---|---|---|---|---|---|---|---|
| **SF-001** | **Critical** | Dependency | `apps/web/package.json` | Next.js <=16.4.0 affected by GHSA-2464-fhr4-w9xw & GHSA-3x5w-66fc-427w | Remote code execution in Image Optimization API | Upgraded Next.js to `16.4.3` | `pnpm audit --prod`, `pnpm --filter web build` | **FIXED-VERIFIED** |
| **SF-002** | **High** | Dependency | `pnpm-workspace.yaml` | `body-parser` <2.4.0 vulnerable to GHSA-27r3-jxmh-p828 | Denial of service via trailing bytes in compressed body | Applied workspace override `body-parser: '>=2.4.0'` | `pnpm audit --prod` | **FIXED-VERIFIED** |

**Summary**: 0 Open Critical · 0 Open High · 0 Open Medium.

---

## 3. Manual Review Checklist (§10.3)

| Control Group | Assessment | Evidence File / Ref | Verdict |
|---|---|---|---|
| **Access Control / IDOR (SEC-30)** | Every repository query scopes to `workspaceId`. Cross-workspace requests return 404. | `apps/api/test/integration/workflow.test.ts` | **PASS** |
| **Injection Defense (SQL / CLI / Log)** | Parameterized SQL via Drizzle ORM. No user shell execution. Log fields sanitized with newline stripping. | `apps/api/src/db/repositories.ts` | **PASS** |
| **XSS & Output Encoding** | No `dangerouslySetInnerHTML`. React 19 native escaping for all variables. Plain Markdown export without HTML. | `apps/web/lib/api.ts` | **PASS** |
| **CSRF / CORS / Cookie Security (SEC-12..15)** | HMAC signed session cookie (`pp_session`) with `HttpOnly`, `SameSite=Lax`, and strict CORS origin allowlist. | `apps/api/src/http/middleware/session.ts` | **PASS** |
| **Mass Assignment & Validation (SEC-43)** | Strict Zod validation on all API endpoints. Server owns all timestamps, IDs, and `dataOrigin` labels. | `apps/api/test/unit/validators.test.ts` | **PASS** |
| **SSRF & Open Redirects** | Qloo API target host is server-configured (`QLOO_API_BASE_URL`). No user-controlled outbound fetches. | `packages/qloo-client/src/client.ts` | **PASS** |
| **Rate Limiting & DoS (SEC-20..25)** | 100 KB payload limit, request timeouts, and token bucket rate limits per workspace and IP. | `apps/api/src/http/app.ts` | **PASS** |
| **Quota Enforcement (SEC-21)** | Atomic DB counter enforces 150 daily calls/workspace and 2000 global daily calls. | `apps/api/test/integration/qloo-service.test.ts` | **PASS** |
| **Data Integrity & Money** | Currency stored strictly in minor integer units (cents). Floating point banned in persistence. | `apps/api/test/integration/db-invariants.test.ts` | **PASS** |
| **Evidence Isolation (SEC-40..42)** | `FixtureTransport` is excluded from package exports. Insert-only evidence repositories prevent tampering. | `packages/qloo-client/test/adapter.test.ts` | **PASS** |

---

## 4. Hardening Exit Criteria (§10.6)
- **0 open Critical or High vulnerabilities**.
- Full-history secret scan clean (0 secret leaks in git commits).
- Client bundle scan clean (0 secrets in `.next` static assets).
- Production dependency audit clean (0 vulnerabilities).
- Deployed smoke check verified (security headers and cookie flags operational).

> [!NOTE]
> **P7H HARDENING GATE PASSED**: All required security controls are verified with evidence.
