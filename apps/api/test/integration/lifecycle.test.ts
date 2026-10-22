// apps/api/test/integration/lifecycle.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDbPool } from '../../src/db/index.js';
import { LifecycleService } from '../../src/services/lifecycle-service.js';
import {
  WorkspaceRepository,
  GameRepository,
  ProposalRepository,
  DecisionRepository,
  QlooRepository,
} from '../../src/db/repositories/index.js';

describe('P3-05: Lifecycle, Soft-Delete & Purge (API-18, API-19)', () => {
  const db = getDb();
  const lifecycle = new LifecycleService(db);
  const workspaceRepo = new WorkspaceRepository(db);
  const gameRepo = new GameRepository(db);
  const proposalRepo = new ProposalRepository(db);
  const decisionRepo = new DecisionRepository(db);
  const qlooRepo = new QlooRepository(db);

  let wsId: string;
  let gameId: string;

  beforeAll(async () => {
    const ws = await workspaceRepo.create({
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    wsId = ws.id;

    const game = await gameRepo.upsert(wsId, {
      name: 'Lifecycle Test Game',
      dataOrigin: 'synthetic_demo',
    });
    gameId = game.id;
  });

  afterAll(async () => {
    await closeDbPool();
  });

  it('hard-deletes an unreferenced proposal', async () => {
    const prop = await proposalRepo.create(wsId, {
      gameId,
      name: 'Unreferenced Proposal',
      category: 'seasonal_event',
      estimatedCostMinor: 1000000n,
      currency: 'USD',
      effortPersonDays: 20,
      releaseWindowStart: '2027-01-01',
      releaseWindowEnd: '2027-02-01',
      dataOrigin: 'synthetic_demo',
    });

    const res = await lifecycle.deleteProposal(wsId, prop.id);
    expect(res.softDeleted).toBe(false);

    // Verify completely gone
    const lookup = await proposalRepo.getById(wsId, prop.id);
    expect(lookup).toBeNull();
  });

  it('soft-deletes a proposal referenced by a historical decision run (API-18)', async () => {
    const prop = await proposalRepo.create(wsId, {
      gameId,
      name: 'Referenced In Decision Run Proposal',
      category: 'seasonal_event',
      estimatedCostMinor: 2000000n,
      currency: 'USD',
      effortPersonDays: 30,
      releaseWindowStart: '2027-02-01',
      releaseWindowEnd: '2027-03-01',
      dataOrigin: 'synthetic_demo',
    });

    // Create a decision run referencing this proposal
    await decisionRepo.createRun(
      wsId,
      {
        variants: 'qloo_informed',
        engineVersion: '1.0.0',
        signalConfigVersion: '1.0.0',
        inputSnapshot: { dummy: true },
        inputHash: 'dummy_run_hash_sentinel_123',
        output: { ranked: [prop.id] },
      },
      [
        {
          runId: 'temporary_placeholder_overwritten_by_createRun',
          variant: 'qloo_informed',
          proposalId: prop.id,
          coverage: '1.000000',
          status: 'selected',
          criteria: {},
          explanation: {},
        },
      ],
    );

    // Now delete proposal
    const res = await lifecycle.deleteProposal(wsId, prop.id);
    expect(res.softDeleted).toBe(true);

    // Excluded from active proposals list
    const active = await proposalRepo.listByWorkspace(wsId, false);
    expect(active.some((p) => p.id === prop.id)).toBe(false);

    // Included when includeDeleted = true
    const all = await proposalRepo.listByWorkspace(wsId, true);
    const deletedProp = all.find((p) => p.id === prop.id);
    expect(deletedProp).toBeDefined();
    expect(deletedProp?.deletedAt).not.toBeNull();
  });

  it('purges expired workspaces and cascades tenant data', async () => {
    // Create an expired workspace
    const expiredWs = await workspaceRepo.create({
      expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 min ago
    });

    // Add a game to it
    await gameRepo.upsert(expiredWs.id, {
      name: 'Doomed Game',
      dataOrigin: 'synthetic_demo',
    });

    const purgedCount = await lifecycle.purgeExpiredWorkspaces();
    expect(purgedCount).toBeGreaterThanOrEqual(1);

    // Verify workspace is gone
    const lookup = await workspaceRepo.getById(expiredWs.id);
    expect(lookup).toBeNull();

    // Verify cascaded game is also gone
    const gameLookup = await gameRepo.getByWorkspace(expiredWs.id);
    expect(gameLookup).toBeNull();
  });

  it('nulls raw response payloads older than retention days while keeping items intact', async () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
    const query = await qlooRepo.insertQuery({
      workspaceId: wsId,
      purpose: 'insights_s1',
      endpoint: '/v2/insights',
      sanitizedParams: {},
      requestFingerprint: 'old_query_sentinel_789',
      status: 'success',
      retrievedAt: oldDate,
      durationMs: 200,
      adapterVersion: '1.0.0',
      cacheState: 'live',
      dataOrigin: 'live_qloo',
      rawResponse: { big: 'payload', sentinels: 123 },
    });

    const [_item] = await qlooRepo.insertEvidenceItems([
      {
        workspaceId: wsId,
        queryId: query.id,
        position: 0,
        qlooEntityId: 'urn:entity:artist:test',
        entityName: 'Test Artist',
        entityType: 'urn:entity:artist',
        dataOrigin: 'live_qloo',
      },
    ]);

    // Purge older than 14 days
    const purged = await lifecycle.purgeExpiredRawResponses(14);
    expect(purged).toBeGreaterThanOrEqual(1);

    // Verify raw_response is nulled
    const updatedQuery = await qlooRepo.getQueryById(query.id);
    expect(updatedQuery?.rawResponse).toBeNull();

    // Verify normalized item is still completely intact
    const items = await qlooRepo.listEvidenceForQuery(query.id);
    expect(items).toHaveLength(1);
    expect(items[0].entityName).toBe('Test Artist');
  });
});
