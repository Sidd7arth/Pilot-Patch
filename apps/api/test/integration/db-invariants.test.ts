// apps/api/test/integration/db-invariants.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDbPool } from '../../src/db/index.js';
import {
  WorkspaceRepository,
  GameRepository,
  MarketRepository,
  ProposalRepository,
  PlanningConstraintsRepository,
  CulturalReferenceRepository,
  QlooRepository,
  CulturalSignalRepository,
  DecisionRepository,
} from '../../src/db/repositories/index.js';
import { validateCurrencyMatch } from '../../src/domain/validators.js';

describe('P3-06: Database Invariants (DATABASE.md §7)', () => {
  const db = getDb();
  const workspaceRepo = new WorkspaceRepository(db);
  const gameRepo = new GameRepository(db);
  const marketRepo = new MarketRepository(db);
  const proposalRepo = new ProposalRepository(db);
  const constraintsRepo = new PlanningConstraintsRepository(db);
  const referenceRepo = new CulturalReferenceRepository(db);
  const qlooRepo = new QlooRepository(db);
  const signalRepo = new CulturalSignalRepository(db);
  const decisionRepo = new DecisionRepository(db);

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
      name: 'Invariants Test Game',
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
      name: 'Invariants Test Proposal',
      category: 'seasonal_event',
      estimatedCostMinor: 1000000n,
      currency: 'USD',
      effortPersonDays: 20,
      releaseWindowStart: '2027-01-01',
      releaseWindowEnd: '2027-02-01',
      dataOrigin: 'synthetic_demo',
    });
    proposalId = prop.id;

    await constraintsRepo.upsert(wsId, {
      currency: 'USD',
      budgetTotalMinor: 5000000n,
      horizonStart: '2027-01-01',
      horizonEnd: '2027-06-30',
      weights: { cultural: 1.0 },
    });
  });

  afterAll(async () => {
    await closeDbPool();
  });

  // Invariant 1: Resolved resolution links to success query and matching evidence entity id
  it('Invariant 1: Resolved resolution links to query with status=success and matching chosen entity ID', async () => {
    const ref = await referenceRepo.create(wsId, {
      ownerType: 'proposal',
      proposalId,
      role: 'cultural_theme',
      label: 'Studio Ghibli',
      dataOrigin: 'synthetic_demo',
    });

    const query = await qlooRepo.insertQuery({
      workspaceId: wsId,
      purpose: 'resolve_entity',
      endpoint: '/search',
      sanitizedParams: { query: 'Studio Ghibli' },
      requestFingerprint: 'invariants_query_fingerprint_sentinel_1',
      status: 'success',
      retrievedAt: new Date(),
      durationMs: 110,
      adapterVersion: '1.0.0',
      cacheState: 'live',
      dataOrigin: 'live_qloo',
    });

    const [item] = await qlooRepo.insertEvidenceItems([
      {
        workspaceId: wsId,
        queryId: query.id,
        position: 0,
        qlooEntityId: 'urn:entity:artist:ghibli',
        entityName: 'Studio Ghibli',
        entityType: 'urn:entity:artist',
        dataOrigin: 'live_qloo',
      },
    ]);

    const resolution = await referenceRepo.upsertResolution(wsId, ref.id, {
      status: 'resolved',
      chosenQlooEntityId: item.qlooEntityId,
      chosenEntityName: item.entityName,
      chosenEntityType: item.entityType,
      chosenBy: 'auto',
      queryId: query.id,
      dataOrigin: 'live_qloo',
    });

    expect(resolution).toBeDefined();
    expect(resolution?.status).toBe('resolved');
    expect(resolution?.chosenQlooEntityId).toBe(item.qlooEntityId);
    expect(query.status).toBe('success');
  });

  // Invariant 2: Cultural signals require >= 1 evidence item from same workspace
  it('Invariant 2: Cultural signals require >= 1 evidence item', async () => {
    const query = await qlooRepo.insertQuery({
      workspaceId: wsId,
      purpose: 'insights_s1',
      endpoint: '/v2/insights',
      sanitizedParams: {},
      requestFingerprint: 'invariants_signal_query_sentinel_2',
      status: 'success',
      retrievedAt: new Date(),
      durationMs: 140,
      adapterVersion: '1.0.0',
      cacheState: 'live',
      dataOrigin: 'live_qloo',
    });

    const [evidence] = await qlooRepo.insertEvidenceItems([
      {
        workspaceId: wsId,
        queryId: query.id,
        position: 0,
        qlooEntityId: 'urn:entity:artist:affinity',
        entityName: 'Affinity Artist',
        entityType: 'urn:entity:artist',
        dataOrigin: 'live_qloo',
      },
    ]);

    // Valid signal with evidence link succeeds
    const signal = await signalRepo.createSignalWithEvidence(
      wsId,
      {
        proposalId,
        marketId,
        strategy: 'S1',
        direction: 'supports',
        strengthBand: 'strong',
        basis: 'Observed strong affinity',
        freshness: 'live',
        signalConfigVersion: '1.0.0',
      },
      [evidence.id],
    );

    expect(signal.id).toBeDefined();
    const linkedIds = await signalRepo.listEvidenceItemIdsForSignal(signal.id);
    expect(linkedIds).toContain(evidence.id);

    // Empty evidence link fails
    await expect(
      signalRepo.createSignalWithEvidence(
        wsId,
        {
          proposalId,
          marketId,
          strategy: 'S2',
          direction: 'not_observed',
          basis: 'None',
          freshness: 'live',
          signalConfigVersion: '1.0.0',
        },
        [],
      ),
    ).rejects.toThrow(/REFERENTIAL-INVARIANT/);
  });

  // Invariant 3: Decision run input snapshot signal IDs resolve to existing signals
  it('Invariant 3: Decision run snapshot preserves valid signal references', async () => {
    const activeSignals = await signalRepo.listActiveForProposal(wsId, proposalId);
    expect(activeSignals.length).toBeGreaterThan(0);

    const run = await decisionRepo.createRun(
      wsId,
      {
        variants: 'qloo_informed',
        engineVersion: '1.0.0',
        signalConfigVersion: '1.0.0',
        inputSnapshot: {
          proposalId,
          signalIds: activeSignals.map((s) => s.id),
        },
        inputHash: 'invariants_run_input_hash_sentinel_3',
        output: { ranked: [proposalId] },
      },
      [
        {
          runId: 'placeholder',
          variant: 'qloo_informed',
          proposalId,
          coverage: '1.000000',
          status: 'selected',
          criteria: {},
          explanation: {},
        },
      ],
    );

    expect(run.id).toBeDefined();
    // Look up signal referenced in snapshot
    const referencedSignal = await signalRepo.getSignalById(wsId, activeSignals[0].id);
    expect(referencedSignal).not.toBeNull();
  });

  // Invariant 4: No test_fixture rows in production
  it('Invariant 4: Rejects test_fixture data_origin in repositories', async () => {
    await expect(
      qlooRepo.insertQuery({
        workspaceId: wsId,
        purpose: 'probe',
        endpoint: '/v2/probe',
        sanitizedParams: {},
        requestFingerprint: 'test_fixture_rejection_sentinel_4',
        status: 'success',
        retrievedAt: new Date(),
        durationMs: 50,
        adapterVersion: '1.0.0',
        cacheState: 'live',
        dataOrigin: 'test_fixture' as unknown as 'live_qloo',
      }),
    ).rejects.toThrow(/SEC-INVARIANT/);
  });

  // Invariant 5: Currency consistency across proposals and planning constraints
  it('Invariant 5: Enforces currency consistency', () => {
    const constraints = { currency: 'USD' };
    const validProposal = { currency: 'USD' };
    const invalidProposal = { currency: 'EUR' };

    expect(validateCurrencyMatch(validProposal.currency, constraints.currency)).toHaveLength(0);
    const errors = validateCurrencyMatch(invalidProposal.currency, constraints.currency);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('currency');
  });

  // Invariant 6: No secrets stored in database fields
  it('Invariant 6: Verified no secret patterns in DB records', async () => {
    const queries = await qlooRepo.listQueriesByWorkspace(wsId);
    for (const q of queries) {
      const serialized = JSON.stringify(q);
      expect(serialized).not.toContain('replace-with-your-qloo-api-key');
      expect(serialized).not.toMatch(/Bearer\s+[A-Za-z0-9_-]{20,}/);
      expect(serialized).not.toMatch(/X-Api-Key/i);
    }
  });
});
