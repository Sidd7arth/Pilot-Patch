// apps/api/src/services/seed-service.ts
import type { Database } from '../db/index.js';
import {
  WorkspaceRepository,
  GameRepository,
  MarketRepository,
  PlanningConstraintsRepository,
  ProposalRepository,
  HistoricalRecordRepository,
  CulturalReferenceRepository,
} from '../db/repositories/index.js';

export interface SeedOptions {
  workspaceId?: string;
  expiresInDays?: number;
}

export async function seedDemoWorkspace(db: Database, options: SeedOptions = {}) {
  const workspaceRepo = new WorkspaceRepository(db);
  const gameRepo = new GameRepository(db);
  const marketRepo = new MarketRepository(db);
  const constraintsRepo = new PlanningConstraintsRepository(db);
  const proposalRepo = new ProposalRepository(db);
  const historicalRepo = new HistoricalRecordRepository(db);
  const referenceRepo = new CulturalReferenceRepository(db);

  const days = options.expiresInDays ?? 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // 1. Create or get workspace
  let wsId = options.workspaceId;
  if (!wsId) {
    const ws = await workspaceRepo.create({
      expiresAt,
      demoSeeded: true,
    });
    if (!ws) throw new Error('Failed to create workspace during seed');
    wsId = ws.id;
  }

  // 2. Game: "Ember Arena"
  const game = await gameRepo.upsert(wsId, {
    name: 'Ember Arena',
    description: 'Fictional team-based competitive action F2P game',
    genreTags: ['action', 'team-based', 'competitive'],
    platforms: ['PC', 'mobile'],
    dataOrigin: 'synthetic_demo',
  });
  if (!game) throw new Error('Failed to create game during seed');

  // 3. Audience Anchors on Game
  await referenceRepo.create(wsId, {
    ownerType: 'game',
    gameId: game.id,
    role: 'audience_anchor',
    label: 'League of Legends',
    entityTypeHint: 'urn:entity:videogame',
    dataOrigin: 'synthetic_demo',
  });
  await referenceRepo.create(wsId, {
    ownerType: 'game',
    gameId: game.id,
    role: 'audience_anchor',
    label: 'Overwatch',
    entityTypeHint: 'urn:entity:videogame',
    dataOrigin: 'synthetic_demo',
  });
  await referenceRepo.create(wsId, {
    ownerType: 'game',
    gameId: game.id,
    role: 'audience_anchor',
    label: 'Valorant',
    entityTypeHint: 'urn:entity:videogame',
    dataOrigin: 'synthetic_demo',
  });

  // 4. Markets (relative weights summing to 1.0)
  const mUS = await marketRepo.create(wsId, {
    gameId: game.id,
    name: 'United States',
    countryCode: 'US',
    weight: '0.35000',
    dataOrigin: 'synthetic_demo',
  });
  const mJP = await marketRepo.create(wsId, {
    gameId: game.id,
    name: 'Japan',
    countryCode: 'JP',
    weight: '0.20000',
    dataOrigin: 'synthetic_demo',
  });
  const mBR = await marketRepo.create(wsId, {
    gameId: game.id,
    name: 'Brazil',
    countryCode: 'BR',
    weight: '0.20000',
    dataOrigin: 'synthetic_demo',
  });
  const mIN = await marketRepo.create(wsId, {
    gameId: game.id,
    name: 'India',
    countryCode: 'IN',
    weight: '0.25000',
    dataOrigin: 'synthetic_demo',
  });

  if (!mUS || !mJP || !mBR || !mIN) {
    throw new Error('Failed to create markets during seed');
  }

  // 5. Planning Constraints
  await constraintsRepo.upsert(wsId, {
    currency: 'USD',
    budgetTotalMinor: 40000000n, // $400,000.00
    contingencyReserveMinor: 4000000n, // $40,000.00 -> available $360,000.00
    capacityPersonDays: 480,
    capacityEnforcement: 'hard',
    horizonStart: '2027-01-01',
    horizonEnd: '2027-06-30',
    horizonEnforcement: 'hard',
    maxSelections: null,
    weights: {
      cultural: 0.35,
      confidence: 0.15,
      feasibility: 0.2,
      commercial: 0.2,
      stakeholder: 0.1,
    },
    minCoverage: '0.500',
  });

  // 6. Historical Records
  const histA = await historicalRepo.create(wsId, {
    title: 'Past Winter Event A',
    contentCategory: 'seasonal_event',
    metricName: 'Event performance index vs studio baseline',
    metricUnit: 'ratio',
    metricValue: '1.3000',
    baselineValue: '1.0000',
    dataOrigin: 'synthetic_demo',
  });
  const histB = await historicalRepo.create(wsId, {
    title: 'Past Skin Collab B',
    contentCategory: 'entertainment_collab',
    metricName: 'Event performance index vs studio baseline',
    metricUnit: 'ratio',
    metricValue: '1.5500',
    baselineValue: '1.0000',
    dataOrigin: 'synthetic_demo',
  });
  const histC = await historicalRepo.create(wsId, {
    title: 'Past Bundle C',
    contentCategory: 'themed_bundle',
    metricName: 'Event performance index vs studio baseline',
    metricUnit: 'ratio',
    metricValue: '0.8500',
    baselineValue: '1.0000',
    dataOrigin: 'synthetic_demo',
  });
  const histD = await historicalRepo.create(wsId, {
    title: 'Past Regional Pack D',
    contentCategory: 'regional_content',
    metricName: 'Event performance index vs studio baseline',
    metricUnit: 'ratio',
    metricValue: '1.1000',
    baselineValue: '1.0000',
    dataOrigin: 'synthetic_demo',
  });

  if (!histA || !histB || !histC || !histD) {
    throw new Error('Failed to create historical records during seed');
  }

  // 7. Proposals
  // Proposal 1: Lantern Festival Seasonal Event
  const p1 = await proposalRepo.create(wsId, {
    gameId: game.id,
    name: 'Lantern Festival Seasonal Event',
    category: 'seasonal_event',
    estimatedCostMinor: 9000000n, // $90,000
    currency: 'USD',
    effortPersonDays: 120,
    releaseWindowStart: '2027-01-15',
    releaseWindowEnd: '2027-02-15',
    scheduleConfidence: 4,
    stakeholderPriority: 3,
    dataOrigin: 'synthetic_demo',
  });
  if (!p1) throw new Error('Failed to create proposal 1');
  await proposalRepo.setProposalMarkets(wsId, p1.id, [mUS.id, mJP.id, mBR.id]);
  await proposalRepo.setProposalAnalogs(wsId, p1.id, [histA.id]);
  await referenceRepo.create(wsId, {
    ownerType: 'proposal',
    proposalId: p1.id,
    role: 'cultural_theme',
    label: 'Traditional Lantern Festival',
    entityTypeHint: null,
    dataOrigin: 'synthetic_demo',
  });

  // Proposal 2: Anime Studio Collab Skin Line
  const p2 = await proposalRepo.create(wsId, {
    gameId: game.id,
    name: 'Anime Studio Collab Skin Line',
    category: 'entertainment_collab',
    estimatedCostMinor: 14000000n, // $140,000
    currency: 'USD',
    effortPersonDays: 200,
    releaseWindowStart: '2027-03-01',
    releaseWindowEnd: '2027-04-15',
    scheduleConfidence: 2,
    stakeholderPriority: 5,
    dataOrigin: 'synthetic_demo',
  });
  if (!p2) throw new Error('Failed to create proposal 2');
  await proposalRepo.setProposalMarkets(wsId, p2.id, [mUS.id, mJP.id]);
  await proposalRepo.setProposalAnalogs(wsId, p2.id, [histB.id]);
  await proposalRepo.createDependency(wsId, {
    proposalId: p2.id,
    kind: 'internal',
    dependsOnProposalId: p1.id,
    description: 'Provides event framework tooling',
    status: 'pending',
    isHardBlocking: true,
  });
  await proposalRepo.createDependency(wsId, {
    proposalId: p2.id,
    kind: 'external',
    description: 'Licensing agreement with studio',
    status: 'pending',
    isHardBlocking: false,
  });
  await referenceRepo.create(wsId, {
    ownerType: 'proposal',
    proposalId: p2.id,
    role: 'cultural_theme',
    label: 'Studio Ghibli',
    entityTypeHint: 'urn:entity:artist',
    dataOrigin: 'synthetic_demo',
  });

  // Proposal 3: Neon-Noir Cyberpunk Bundle
  const p3 = await proposalRepo.create(wsId, {
    gameId: game.id,
    name: 'Neon-Noir Cyberpunk Bundle',
    category: 'themed_bundle',
    estimatedCostMinor: 7000000n, // $70,000
    currency: 'USD',
    effortPersonDays: 90,
    releaseWindowStart: '2027-02-01',
    releaseWindowEnd: '2027-03-01',
    scheduleConfidence: 4,
    stakeholderPriority: 3,
    dataOrigin: 'synthetic_demo',
  });
  if (!p3) throw new Error('Failed to create proposal 3');
  await proposalRepo.setProposalMarkets(wsId, p3.id, [mUS.id, mBR.id]);
  await proposalRepo.setProposalAnalogs(wsId, p3.id, [histC.id]);
  await referenceRepo.create(wsId, {
    ownerType: 'proposal',
    proposalId: p3.id,
    role: 'cultural_theme',
    label: 'Blade Runner',
    entityTypeHint: 'urn:entity:movie',
    dataOrigin: 'synthetic_demo',
  });

  // Proposal 4: Latin Music Summer Event
  const p4 = await proposalRepo.create(wsId, {
    gameId: game.id,
    name: 'Latin Music Summer Event',
    category: 'seasonal_event',
    estimatedCostMinor: 8500000n, // $85,000
    currency: 'USD',
    effortPersonDays: 100,
    releaseWindowStart: '2027-05-01',
    releaseWindowEnd: '2027-06-15',
    scheduleConfidence: 3,
    stakeholderPriority: 4,
    dataOrigin: 'synthetic_demo',
  });
  if (!p4) throw new Error('Failed to create proposal 4');
  await proposalRepo.setProposalMarkets(wsId, p4.id, [mUS.id, mBR.id]);
  // No analog for #4
  await referenceRepo.create(wsId, {
    ownerType: 'proposal',
    proposalId: p4.id,
    role: 'cultural_theme',
    label: 'Bad Bunny',
    entityTypeHint: 'urn:entity:artist',
    dataOrigin: 'synthetic_demo',
  });

  // Proposal 5: Festival-of-Colors Regional Pack
  const p5 = await proposalRepo.create(wsId, {
    gameId: game.id,
    name: 'Festival-of-Colors Regional Pack',
    category: 'regional_content',
    estimatedCostMinor: 6000000n, // $60,000
    currency: 'USD',
    effortPersonDays: 80,
    releaseWindowStart: '2027-03-01',
    releaseWindowEnd: '2027-03-20',
    scheduleConfidence: 3,
    stakeholderPriority: 3,
    dataOrigin: 'synthetic_demo',
  });
  if (!p5) throw new Error('Failed to create proposal 5');
  await proposalRepo.setProposalMarkets(wsId, p5.id, [mIN.id]);
  await proposalRepo.setProposalAnalogs(wsId, p5.id, [histD.id]);
  await proposalRepo.createDependency(wsId, {
    proposalId: p5.id,
    kind: 'external',
    description: 'Regional payment localization',
    status: 'satisfied',
    isHardBlocking: true,
  });
  await referenceRepo.create(wsId, {
    ownerType: 'proposal',
    proposalId: p5.id,
    role: 'cultural_theme',
    label: 'Holi Festival',
    entityTypeHint: null,
    dataOrigin: 'synthetic_demo',
  });

  // Proposal 6: Summer Esports Cup Skins
  const p6 = await proposalRepo.create(wsId, {
    gameId: game.id,
    name: 'Summer Esports Cup Skins',
    category: 'character_skin',
    estimatedCostMinor: 12000000n, // $120,000
    currency: 'USD',
    effortPersonDays: 160,
    releaseWindowStart: '2027-07-01',
    releaseWindowEnd: '2027-08-15',
    scheduleConfidence: 3,
    stakeholderPriority: 4,
    dataOrigin: 'synthetic_demo',
  });
  if (!p6) throw new Error('Failed to create proposal 6');
  await proposalRepo.setProposalMarkets(wsId, p6.id, [mUS.id, mJP.id]);
  await referenceRepo.create(wsId, {
    ownerType: 'proposal',
    proposalId: p6.id,
    role: 'cultural_theme',
    label: 'League of Legends World Championship',
    entityTypeHint: null,
    dataOrigin: 'synthetic_demo',
  });

  return {
    workspaceId: wsId,
    game,
    markets: [mUS, mJP, mBR, mIN],
    proposals: [p1, p2, p3, p4, p5, p6],
  };
}
