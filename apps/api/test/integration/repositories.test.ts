// apps/api/test/integration/repositories.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDbPool } from '../../src/db/index.js';
import {
  WorkspaceRepository,
  GameRepository,
  MarketRepository,
  ProposalRepository,
  QlooRepository,
  CulturalSignalRepository,
} from '../../src/db/repositories/index.js';

describe('P3-02: Workspace-Scoped Repositories & Invariants', () => {
  const db = getDb();
  const workspaceRepo = new WorkspaceRepository(db);
  const gameRepo = new GameRepository(db);
  const marketRepo = new MarketRepository(db);
  const proposalRepo = new ProposalRepository(db);
  const qlooRepo = new QlooRepository(db);
  const signalRepo = new CulturalSignalRepository(db);

  let wsA: string;
  let wsB: string;

  beforeAll(async () => {
    // Create two isolated workspaces
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const w1 = await workspaceRepo.create({ expiresAt: expires });
    const w2 = await workspaceRepo.create({ expiresAt: expires });
    wsA = w1.id;
    wsB = w2.id;
  });

  afterAll(async () => {
    await closeDbPool();
  });

  it('enforces tenant isolation across workspaces (API-14 base)', async () => {
    // Create game and markets in Workspace A
    const gameA = await gameRepo.upsert(wsA, {
      name: 'Ember Arena A',
      dataOrigin: 'synthetic_demo',
    });
    const marketA = await marketRepo.create(wsA, {
      gameId: gameA.id,
      name: 'United States',
      countryCode: 'US',
      weight: '0.40000',
      dataOrigin: 'synthetic_demo',
    });

    // Create game and markets in Workspace B
    const gameB = await gameRepo.upsert(wsB, {
      name: 'Solar Storm B',
      dataOrigin: 'synthetic_demo',
    });
    const marketB = await marketRepo.create(wsB, {
      gameId: gameB.id,
      name: 'Japan',
      countryCode: 'JP',
      weight: '0.60000',
      dataOrigin: 'synthetic_demo',
    });

    // Assert Workspace B cannot see Workspace A's markets or game
    const wsBMarkets = await marketRepo.listByWorkspace(wsB);
    expect(wsBMarkets.some((m) => m.id === marketA.id)).toBe(false);
    expect(wsBMarkets.some((m) => m.id === marketB.id)).toBe(true);

    const crossLookup = await marketRepo.getById(wsB, marketA.id);
    expect(crossLookup).toBeNull();

    const crossGame = await gameRepo.getByWorkspace(wsB);
    expect(crossGame?.name).toBe('Solar Storm B');
  });

  it('supports proposal lifecycle and soft-delete filtering', async () => {
    const gameA = await gameRepo.getByWorkspace(wsA);
    expect(gameA).not.toBeNull();

    const p1 = await proposalRepo.create(wsA, {
      gameId: gameA!.id,
      name: 'Lantern Festival Event',
      category: 'seasonal_event',
      estimatedCostMinor: 9000000n,
      currency: 'USD',
      effortPersonDays: 120,
      releaseWindowStart: '2027-01-15',
      releaseWindowEnd: '2027-02-15',
      dataOrigin: 'synthetic_demo',
    });

    // List proposals: active proposal is included
    let activeList = await proposalRepo.listByWorkspace(wsA, false);
    expect(activeList.some((p) => p.id === p1.id)).toBe(true);

    // Soft delete proposal
    const deleted = await proposalRepo.softDelete(wsA, p1.id);
    expect(deleted).toBe(true);

    // Excluded from default active list
    activeList = await proposalRepo.listByWorkspace(wsA, false);
    expect(activeList.some((p) => p.id === p1.id)).toBe(false);

    // Retained when includeDeleted is true
    const fullList = await proposalRepo.listByWorkspace(wsA, true);
    expect(fullList.some((p) => p.id === p1.id)).toBe(true);
  });

  it('enforces insert-only and forbids test_fixture data_origin in Qloo repository', async () => {
    // Attempting to write a test_fixture row to production DB must throw
    await expect(
      qlooRepo.insertQuery({
        workspaceId: wsA,
        purpose: 'probe',
        endpoint: '/v2/probe',
        sanitizedParams: {},
        requestFingerprint: 'dummy_fingerprint_sentinel_123',
        status: 'success',
        retrievedAt: new Date(),
        durationMs: 120,
        adapterVersion: '1.0.0',
        cacheState: 'live',
        dataOrigin: 'test_fixture' as unknown as 'live_qloo',
      }),
    ).rejects.toThrow(/SEC-INVARIANT/);

    // Valid live_qloo row is accepted
    const query = await qlooRepo.insertQuery({
      workspaceId: wsA,
      purpose: 'probe',
      endpoint: '/v2/probe',
      sanitizedParams: {},
      requestFingerprint: 'valid_fingerprint_sentinel_456',
      status: 'success',
      retrievedAt: new Date(),
      durationMs: 150,
      adapterVersion: '1.0.0',
      cacheState: 'live',
      dataOrigin: 'live_qloo',
    });

    expect(query.id).toBeDefined();
    expect(query.status).toBe('success');

    // Insert normalized evidence items
    const [evidence] = await qlooRepo.insertEvidenceItems([
      {
        workspaceId: wsA,
        queryId: query.id,
        position: 0,
        qlooEntityId: 'urn:entity:videogame:ember',
        entityName: 'Ember Arena',
        entityType: 'urn:entity:videogame',
        dataOrigin: 'live_qloo',
      },
    ]);
    expect(evidence.id).toBeDefined();

    // Verify evidence is linked
    const items = await qlooRepo.listEvidenceForQuery(query.id);
    expect(items.length).toBe(1);
    expect(items[0].entityName).toBe('Ember Arena');
  });

  it('enforces referential invariant: cultural_signal requires >= 1 evidence item', async () => {
    const gameA = await gameRepo.getByWorkspace(wsA);
    const marketsA = await marketRepo.listByWorkspace(wsA);

    const proposal = await proposalRepo.create(wsA, {
      gameId: gameA!.id,
      name: 'Anime Collab Skin Line',
      category: 'entertainment_collab',
      estimatedCostMinor: 14000000n,
      currency: 'USD',
      effortPersonDays: 200,
      releaseWindowStart: '2027-03-01',
      releaseWindowEnd: '2027-04-15',
      dataOrigin: 'synthetic_demo',
    });

    // Fails without evidence items
    await expect(
      signalRepo.createSignalWithEvidence(
        wsA,
        {
          proposalId: proposal.id,
          marketId: marketsA[0].id,
          strategy: 'S1',
          direction: 'supports',
          strengthBand: 'strong',
          basis: 'Strong cultural affinity observed',
          freshness: 'live',
          signalConfigVersion: '1.0.0',
        },
        [],
      ),
    ).rejects.toThrow(/REFERENTIAL-INVARIANT/);
  });
});
