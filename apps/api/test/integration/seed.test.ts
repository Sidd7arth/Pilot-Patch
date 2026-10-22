// apps/api/test/integration/seed.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import { getDb, closeDbPool } from '../../src/db/index.js';
import { seedDemoWorkspace } from '../../src/services/seed-service.js';
import {
  GameRepository,
  MarketRepository,
  ProposalRepository,
  PlanningConstraintsRepository,
  HistoricalRecordRepository,
  CulturalReferenceRepository,
  QlooRepository,
  CulturalSignalRepository,
  DecisionRepository,
} from '../../src/db/repositories/index.js';

describe('P3-04: Appendix A Seed & Synthetic-Only Guarantee (API-01)', () => {
  const db = getDb();
  const gameRepo = new GameRepository(db);
  const marketRepo = new MarketRepository(db);
  const proposalRepo = new ProposalRepository(db);
  const constraintsRepo = new PlanningConstraintsRepository(db);
  const historicalRepo = new HistoricalRecordRepository(db);
  const referenceRepo = new CulturalReferenceRepository(db);
  const qlooRepo = new QlooRepository(db);
  const signalRepo = new CulturalSignalRepository(db);
  const decisionRepo = new DecisionRepository(db);

  afterAll(async () => {
    await closeDbPool();
  });

  it('seeds Appendix A Ember Arena domain data with synthetic_demo origin only', async () => {
    const seeded = await seedDemoWorkspace(db);
    const wsId = seeded.workspaceId;

    // 1. Game
    const game = await gameRepo.getByWorkspace(wsId);
    expect(game).not.toBeNull();
    expect(game?.name).toBe('Ember Arena');
    expect(game?.dataOrigin).toBe('synthetic_demo');

    // 2. Audience Anchors (3 real titles, synthetic_demo)
    const anchors = await referenceRepo.listByWorkspace(wsId, {
      ownerType: 'game',
      role: 'audience_anchor',
    });
    expect(anchors).toHaveLength(3);
    for (const a of anchors) {
      expect(a.dataOrigin).toBe('synthetic_demo');
    }

    // 3. Markets (4 markets: US, JP, BR, IN)
    const markets = await marketRepo.listByWorkspace(wsId);
    expect(markets).toHaveLength(4);
    for (const m of markets) {
      expect(m.dataOrigin).toBe('synthetic_demo');
    }

    // 4. Constraints
    const constraints = await constraintsRepo.getByWorkspace(wsId);
    expect(constraints).not.toBeNull();
    expect(constraints?.currency).toBe('USD');
    expect(constraints?.budgetTotalMinor).toBe(40000000n);
    expect(constraints?.contingencyReserveMinor).toBe(4000000n);
    expect(constraints?.capacityPersonDays).toBe(480);
    expect(constraints?.horizonStart).toBe('2027-01-01');
    expect(constraints?.horizonEnd).toBe('2027-06-30');

    // 5. Proposals (6 proposals, all synthetic_demo)
    const proposals = await proposalRepo.listByWorkspace(wsId, false);
    expect(proposals).toHaveLength(6);
    for (const p of proposals) {
      expect(p.dataOrigin).toBe('synthetic_demo');
    }

    // 6. Historical Records (4 records)
    const hist = await historicalRepo.listByWorkspace(wsId);
    expect(hist).toHaveLength(4);
    for (const h of hist) {
      expect(h.dataOrigin).toBe('synthetic_demo');
    }

    // 7. INVARIANT: No Qloo queries, evidence, cultural signals, or decision runs seeded!
    const queries = await qlooRepo.listQueriesByWorkspace(wsId);
    expect(queries).toHaveLength(0);

    const evidence = await qlooRepo.listEvidenceForWorkspace(wsId);
    expect(evidence).toHaveLength(0);

    const signals = await signalRepo.listActiveByWorkspace(wsId);
    expect(signals).toHaveLength(0);

    const runs = await decisionRepo.listRunsByWorkspace(wsId);
    expect(runs).toHaveLength(0);
  });
});
