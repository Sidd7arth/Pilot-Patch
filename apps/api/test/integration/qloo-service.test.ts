// apps/api/test/integration/qloo-service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getDb, closeDbPool } from '../../src/db/index.js';
import { createApp } from '../../src/http/app.js';
import { loadConfig } from '../../src/config/env.js';
import { QlooService } from '../../src/modules/qloo/index.js';
import { createQlooClient } from '@patchpilot/qloo-client';
import {
  WorkspaceRepository,
  GameRepository,
  MarketRepository,
  ProposalRepository,
  CulturalReferenceRepository,
  CulturalSignalRepository,
  IntegrationEventRepository,
} from '../../src/db/repositories/index.js';

describe('P2-05, P2-06, P2-07: Qloo Service & HTTP Endpoints (API-03..05, API-12, API-13, API-17)', () => {
  const db = getDb();
  const config = loadConfig();

  const qlooClient = createQlooClient({
    apiKey: config.QLOO_API_KEY,
    baseUrl: config.QLOO_API_BASE_URL,
    timeoutMs: 8000,
    maxRetries: 1,
  });

  const qlooService = new QlooService(db, qlooClient, config);
  const app = createApp({ config, qlooService });

  const workspaceRepo = new WorkspaceRepository(db);
  const gameRepo = new GameRepository(db);
  const marketRepo = new MarketRepository(db);
  const proposalRepo = new ProposalRepository(db);
  const referenceRepo = new CulturalReferenceRepository(db);
  const signalRepo = new CulturalSignalRepository(db);
  const eventRepo = new IntegrationEventRepository(db);

  let wsId: string;
  let gameId: string;
  let marketId: string;
  let proposalId: string;

  beforeAll(async () => {
    const ws = await workspaceRepo.create({
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    wsId = ws.id;

    const game = await gameRepo.upsert(wsId, {
      name: 'Qloo Service Test Game',
      dataOrigin: 'synthetic_demo',
    });
    gameId = game.id;

    const market = await marketRepo.create(wsId, {
      gameId,
      name: 'United States',
      countryCode: 'US',
      weight: '1.00000',
      dataOrigin: 'synthetic_demo',
    });
    marketId = market.id;

    const prop = await proposalRepo.create(wsId, {
      gameId,
      name: 'Latin Music Summer Event',
      category: 'seasonal_event',
      estimatedCostMinor: 8500000n,
      currency: 'USD',
      effortPersonDays: 100,
      releaseWindowStart: '2027-05-01',
      releaseWindowEnd: '2027-06-15',
      dataOrigin: 'synthetic_demo',
    });
    proposalId = prop.id;
    await proposalRepo.setProposalMarkets(wsId, proposalId, [marketId]);
  });

  afterAll(async () => {
    await closeDbPool();
  });

  // P2-07 / API-12, API-17: /qloo/status endpoint
  it('GET /api/v1/qloo/status returns sanitized probe response with no secrets and logs event', async () => {
    const res = await request(app).get(`/api/v1/qloo/status?workspaceId=${wsId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('configured');
    expect(res.body).toHaveProperty('reachable');
    expect(res.body).toHaveProperty('circuitBreaker');
    expect(res.body).toHaveProperty('quota');

    // SEC-05 / SEC-06: No sensitive fields leaked
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(config.QLOO_API_KEY);
    expect(serialized).not.toMatch(/api[_-]?key/i);

    // Verify integration event logged
    const events = await eventRepo.listByWorkspace(wsId, 5);
    expect(events.some((e) => e.kind === 'probe_success' || e.kind === 'probe_failure')).toBe(true);
  });

  // P2-05 / API-03: Reference resolution (auto and manual choose)
  it('POST /workspaces/:ws/references/:ref/resolve resolves reference and supports manual chooser', async () => {
    // Create reference for Bad Bunny
    const ref = await referenceRepo.create(wsId, {
      ownerType: 'proposal',
      proposalId,
      role: 'cultural_theme',
      label: 'Bad Bunny',
      entityTypeHint: 'urn:entity:artist',
      dataOrigin: 'synthetic_demo',
    });

    // Resolve via HTTP endpoint
    const res = await request(app).post(`/api/v1/workspaces/${wsId}/references/${ref.id}/resolve`);
    expect(res.status).toBe(200);
    expect(res.body.status).toMatch(/resolved|ambiguous/);
    expect(res.body.candidates.length).toBeGreaterThan(0);

    // If ambiguous, test manual chooser endpoint
    if (res.body.status === 'ambiguous') {
      const candidateId = res.body.candidates[0].qlooEntityId;
      const chooseRes = await request(app)
        .post(`/api/v1/workspaces/${wsId}/references/${ref.id}/choose`)
        .send({ chosenQlooEntityId: candidateId });

      expect(chooseRes.status).toBe(200);
      expect(chooseRes.body.status).toBe('resolved');
      expect(chooseRes.body.chosenQlooEntityId).toBe(candidateId);
      expect(chooseRes.body.chosenBy).toBe('user');
    } else {
      expect(res.body.status).toBe('resolved');
      expect(res.body.chosenQlooEntityId).toBeDefined();
    }
  });

  // P2-05 / API-04: Evidence refresh derives cultural signals
  it('POST /workspaces/:ws/proposals/:prop/refresh-evidence derives cultural signals from Qloo evidence', async () => {
    // Ensure proposal has a resolved cultural theme reference
    let themeRef = (
      await referenceRepo.listByWorkspace(wsId, {
        ownerType: 'proposal',
        ownerId: proposalId,
        role: 'cultural_theme',
      })
    )[0];

    if (!themeRef) {
      themeRef = await referenceRepo.create(wsId, {
        ownerType: 'proposal',
        proposalId,
        role: 'cultural_theme',
        label: 'Bad Bunny',
        entityTypeHint: 'urn:entity:artist',
        dataOrigin: 'synthetic_demo',
      });
    }

    const resolution = await qlooService.resolveReference(wsId, themeRef.id);
    expect(resolution).not.toBeNull();
    expect(resolution?.status).toMatch(/resolved|ambiguous/);

    if (resolution?.status === 'ambiguous') {
      await qlooService.chooseResolution(wsId, themeRef.id, resolution.candidates[0].qlooEntityId);
    }

    const res = await request(app).post(
      `/api/v1/workspaces/${wsId}/proposals/${proposalId}/refresh-evidence`,
    );

    expect(res.status).toBe(200);
    expect(res.body.proposalId).toBe(proposalId);
    expect(res.body.signalsGenerated).toBeGreaterThan(0);

    // Verify signals persisted in DB with evidence links
    const signals = await signalRepo.listActiveForProposal(wsId, proposalId);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0].direction).toBe('supports');
    expect(signals[0].strengthBand).toBeDefined();

    const evidenceIds = await signalRepo.listEvidenceItemIdsForSignal(signals[0].id);
    expect(evidenceIds.length).toBeGreaterThan(0);
  });

  // P2-06 / API-05, API-13: Cache reuse and quota limit enforcement
  it('enforces quota limits and handles cache reuse', async () => {
    // Verify cache hit does NOT increment calls
    const wsBefore = await workspaceRepo.getById(wsId);
    const countBefore = wsBefore!.qlooCallsUsedToday;

    // Resolving again for the same reference hits cache
    const resolvedRefs = await referenceRepo.listByWorkspace(wsId);
    await qlooService.resolveReference(wsId, resolvedRefs[0].id);

    const wsAfter = await workspaceRepo.getById(wsId);
    // Cache hit -> call count should not increase
    expect(wsAfter!.qlooCallsUsedToday).toBe(countBefore);

    // Test quota exceeded: create a workspace with quota already exhausted
    const exhaustedWs = await workspaceRepo.create({
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    // Set calls to max limit
    for (let i = 0; i < config.QLOO_WORKSPACE_DAILY_CALLS; i++) {
      await workspaceRepo.incrementQlooCalls(exhaustedWs.id);
    }

    const refExhausted = await referenceRepo.create(exhaustedWs.id, {
      ownerType: 'proposal',
      role: 'cultural_theme',
      label: 'Uncached Distinct Entity ' + Date.now(),
      dataOrigin: 'synthetic_demo',
    });

    const res = await request(app).post(
      `/api/v1/workspaces/${exhaustedWs.id}/references/${refExhausted.id}/resolve`,
    );

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('QUOTA_EXCEEDED');

    // Verify quota_exceeded event was recorded
    const events = await eventRepo.listByWorkspace(exhaustedWs.id);
    expect(events.some((e) => e.kind === 'quota_exceeded')).toBe(true);
  });
});
