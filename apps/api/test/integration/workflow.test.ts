// apps/api/test/integration/workflow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/http/app.js';
import { getDb, closeDbPool } from '../../src/db/index.js';
import { workspaces } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { loadConfig } from '../../src/config/env.js';
import { createQlooClient } from '@patchpilot/qloo-client';
import { QlooService } from '../../src/modules/qloo/index.js';
import { createFixtureFetch } from '../../../../packages/qloo-client/test/fixture-transport.js';

describe('Phase 5 Complete Workflow Integration Tests (P5-01..P5-08)', () => {
  let app: ReturnType<typeof createApp>;
  let sessionCookie: string;
  let workspaceId: string;
  let runId: string;
  let childRunId: string;
  let briefId: string;

  beforeAll(() => {
    const db = getDb();
    const config = loadConfig();
    const testApiKey = config.QLOO_API_KEY || 'test-ci-offline-qloo-key';
    const qlooClient = createQlooClient(
      {
        apiKey: testApiKey,
        baseUrl: config.QLOO_API_BASE_URL,
        timeoutMs: 8000,
        maxRetries: 1,
      },
      createFixtureFetch(),
    );
    const qlooService = new QlooService(db, qlooClient, config);
    app = createApp({ db, config, qlooService });
  });

  afterAll(async () => {
    if (workspaceId) {
      const db = getDb();
      await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    }
    await closeDbPool();
  });

  it('P5-01 & P5-02: POST /api/v1/workspaces creates workspace, sets signed cookie, and seeds Appendix A', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .send({ isDemo: true, label: 'E2E Workflow Test Workspace' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('workspace');
    expect(res.body.workspace).toHaveProperty('id');
    expect(res.body.workspace.seeded).toBe(true);

    workspaceId = res.body.workspace.id;

    // Cookie header
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies[0] : cookies;
    sessionCookie = cookieHeader!.split(';')[0]!;
    expect(sessionCookie).toContain('pp_session=');
  });

  it('P5-01: GET /api/v1/workspace retrieves session info and quota using cookie', async () => {
    const res = await request(app).get('/api/v1/workspace').set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('workspace');
    expect(res.body.workspace.id).toBe(workspaceId);
    expect(res.body.workspace.quota).toBeDefined();
    expect(res.body.workspace.quota.dailyCallsLimit).toBe(150);
    expect(res.body.workspace.quota.callsRemaining).toBe(150);
    expect(res.body.workspace.game).toBeDefined();
    expect(res.body.workspace.proposalCount).toBeGreaterThanOrEqual(6);
  });

  it('P5-02: GET /api/v1/proposals returns seeded Appendix A proposals with domain relations', async () => {
    const res = await request(app).get('/api/v1/proposals').set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('proposals');
    expect(Array.isArray(res.body.proposals)).toBe(true);
    expect(res.body.proposals.length).toBeGreaterThanOrEqual(6);

    const first = res.body.proposals[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('estimatedCostMinor');
    expect(first).toHaveProperty('effortPersonDays');
    expect(first).toHaveProperty('releaseWindowStart');
  });

  it('P5-03: POST /api/v1/decision-runs executes deterministic decision engine on workspace snapshot', async () => {
    const res = await request(app).post('/api/v1/decision-runs').set('Cookie', sessionCookie).send({
      label: 'Q4 2026 Live-Ops Allocation',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('run');
    expect(res.body.run).toHaveProperty('id');
    expect(res.body.run).toHaveProperty('inputHash');
    expect(res.body).toHaveProperty('output');

    runId = res.body.run.id;

    const output = res.body.output;
    expect(output.variants.qloo_informed).toBeDefined();
    expect(output.variants.baseline).toBeDefined();

    const qlooPortfolio = output.variants.qloo_informed.portfolio;
    expect(Number(qlooPortfolio.budgetRemainingMinor)).toBeGreaterThanOrEqual(0);
    expect(qlooPortfolio.selectedCount).toBeGreaterThan(0);

    const rankings = output.variants.qloo_informed.rankings;
    expect(rankings.length).toBeGreaterThan(0);
    expect(rankings[0].status).toBe('selected');
  });

  it('P5-04: GET /api/v1/decision-runs/:id retrieves stored run with immutable inputs and outputs', async () => {
    const res = await request(app)
      .get(`/api/v1/decision-runs/${runId}`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('run');
    expect(res.body.run.id).toBe(runId);
    expect(res.body.run.inputHash).toBeDefined();
    expect(res.body.run).toHaveProperty('output');
    expect(res.body).toHaveProperty('rankings');
  });

  it('P5-05: POST /api/v1/decision-runs/:id/replan creates child run with budget overrides and diff link', async () => {
    const res = await request(app)
      .post(`/api/v1/decision-runs/${runId}/replan`)
      .set('Cookie', sessionCookie)
      .send({
        label: 'Tighter Budget Scenario',
        constraintsOverride: {
          budgetTotalMinor: '15000000', // $150,000 cap
        },
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('run');
    expect(res.body.run.parentRunId).toBe(runId);

    childRunId = res.body.run.id;
  });

  it('P5-05: GET /api/v1/decision-runs/:id/diff/:otherId compares two runs', async () => {
    const res = await request(app)
      .get(`/api/v1/decision-runs/${runId}/diff/${childRunId}`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('diff');
    expect(res.body.diff).toHaveProperty('enteredShortlist');
    expect(res.body.diff).toHaveProperty('leftShortlist');
    expect(res.body.diff).toHaveProperty('rankChanges');
    expect(res.body.diff).toHaveProperty('allocationChange');
    expect(res.body.diff).toHaveProperty('summarySentence');
  });

  it('P5-06: GET /api/v1/decision-runs/:id/comparison returns baseline vs qloo attribution', async () => {
    const res = await request(app)
      .get(`/api/v1/decision-runs/${runId}/comparison`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('comparison');
    expect(Array.isArray(res.body.comparison)).toBe(true);
    expect(res.body).toHaveProperty('baselinePortfolio');
    expect(res.body).toHaveProperty('qlooPortfolio');
  });

  it('P5-07 & P5-08: POST /api/v1/decision-runs/:id/briefs generates brief, scans banned claims, and exports markdown', async () => {
    const res = await request(app)
      .post(`/api/v1/decision-runs/${runId}/briefs`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('brief');
    expect(res.body.brief).toHaveProperty('id');
    expect(res.body.brief).toHaveProperty('markdown');
    expect(res.body.brief.markdown).toContain('PatchPilot Decision Brief');
    expect(res.body.brief.markdown).toContain(
      'Decision-support hypothesis based on cultural-affinity evidence',
    );
    expect(res.body.bannedClaimViolations).toHaveLength(0);

    briefId = res.body.brief.id;

    // Export as Markdown
    const exportRes = await request(app)
      .get(`/api/v1/briefs/${briefId}/export?format=md`)
      .set('Cookie', sessionCookie);

    expect(exportRes.status).toBe(200);
    expect(exportRes.text).toContain('# PatchPilot Decision Brief');
  });
});
