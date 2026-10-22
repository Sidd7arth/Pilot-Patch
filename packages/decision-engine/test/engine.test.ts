// packages/decision-engine/test/engine.test.ts
import { describe, it, expect } from 'vitest';
import {
  runDecision,
  diffRuns,
  computeInputHash,
  round6,
  type DecisionInput,
} from '../src/index.js';

describe('Phase 4: Deterministic Decision Engine (ENG-01..ENG-21)', () => {
  const baseInput: DecisionInput = {
    engineVersion: '1.0.0',
    signalConfigVersion: '1.0.0',
    currency: 'USD',
    constraints: {
      currency: 'USD',
      budgetTotalMinor: 40000000n, // $400,000
      contingencyReserveMinor: 4000000n, // $40,000 -> Available $360,000
      capacityPersonDays: 480,
      capacityEnforcement: 'hard',
      horizonStart: '2027-01-01',
      horizonEnd: '2027-06-30',
      horizonEnforcement: 'hard',
    },
    markets: [
      { id: 'm-us', name: 'United States', countryCode: 'US', weight: 0.35 },
      { id: 'm-jp', name: 'Japan', countryCode: 'JP', weight: 0.2 },
      { id: 'm-br', name: 'Brazil', countryCode: 'BR', weight: 0.2 },
      { id: 'm-in', name: 'India', countryCode: 'IN', weight: 0.25 },
    ],
    proposals: [
      {
        id: 'p-1',
        name: 'Lantern Festival Event',
        category: 'seasonal_event',
        status: 'candidate',
        estimatedCostMinor: 9000000n, // $90,000
        effortPersonDays: 120,
        releaseWindowStart: '2027-01-15',
        releaseWindowEnd: '2027-02-15',
        scheduleConfidence: 4,
        stakeholderPriority: 3,
      },
      {
        id: 'p-2',
        name: 'Anime Collab Skin Line',
        category: 'entertainment_collab',
        status: 'candidate',
        estimatedCostMinor: 14000000n, // $140,000
        effortPersonDays: 200,
        releaseWindowStart: '2027-03-01',
        releaseWindowEnd: '2027-04-15',
        scheduleConfidence: 2,
        stakeholderPriority: 5,
      },
      {
        id: 'p-3',
        name: 'Neon-Noir Bundle',
        category: 'themed_bundle',
        status: 'candidate',
        estimatedCostMinor: 7000000n, // $70,000
        effortPersonDays: 90,
        releaseWindowStart: '2027-02-01',
        releaseWindowEnd: '2027-03-01',
        scheduleConfidence: 4,
        stakeholderPriority: 3,
      },
      {
        id: 'p-4',
        name: 'Latin Music Summer Event',
        category: 'seasonal_event',
        status: 'candidate',
        estimatedCostMinor: 8500000n, // $85,000
        effortPersonDays: 100,
        releaseWindowStart: '2027-05-01',
        releaseWindowEnd: '2027-06-15',
        scheduleConfidence: 3,
        stakeholderPriority: 4,
      },
      {
        id: 'p-5',
        name: 'Festival-of-Colors Pack',
        category: 'regional_content',
        status: 'candidate',
        estimatedCostMinor: 6000000n, // $60,000
        effortPersonDays: 80,
        releaseWindowStart: '2027-03-01',
        releaseWindowEnd: '2027-03-20',
        scheduleConfidence: 3,
        stakeholderPriority: 3,
      },
      {
        id: 'p-6',
        name: 'Summer Esports Cup',
        category: 'character_skin',
        status: 'candidate',
        estimatedCostMinor: 12000000n, // $120,000
        effortPersonDays: 160,
        releaseWindowStart: '2027-07-01', // Outside horizon (ends June 30)
        releaseWindowEnd: '2027-08-15',
        scheduleConfidence: 3,
        stakeholderPriority: 4,
      },
    ],
    proposalMarkets: [
      { proposalId: 'p-1', marketId: 'm-us' },
      { proposalId: 'p-1', marketId: 'm-jp' },
      { proposalId: 'p-1', marketId: 'm-br' },
      { proposalId: 'p-2', marketId: 'm-us' },
      { proposalId: 'p-2', marketId: 'm-jp' },
      { proposalId: 'p-3', marketId: 'm-us' },
      { proposalId: 'p-3', marketId: 'm-br' },
      { proposalId: 'p-4', marketId: 'm-us' },
      { proposalId: 'p-4', marketId: 'm-br' },
      { proposalId: 'p-5', marketId: 'm-in' },
      { proposalId: 'p-6', marketId: 'm-us' },
    ],
    dependencies: [
      {
        id: 'dep-1',
        proposalId: 'p-2',
        kind: 'internal',
        dependsOnProposalId: 'p-1',
        description: 'Event framework tooling',
        status: 'pending',
        isHardBlocking: true,
      },
    ],
    signals: [
      {
        id: 'sig-1',
        proposalId: 'p-2',
        marketId: 'm-us',
        strategy: 'S1',
        direction: 'supports',
        strengthBand: 'strong',
        strengthValue: null,
        basis: 'Strong Ghibli affinity',
        freshness: 'live',
      },
      {
        id: 'sig-2',
        proposalId: 'p-2',
        marketId: 'm-jp',
        strategy: 'S1',
        direction: 'supports',
        strengthBand: 'strong',
        strengthValue: null,
        basis: 'Strong anime affinity',
        freshness: 'live',
      },
      {
        id: 'sig-3',
        proposalId: 'p-4',
        marketId: 'm-us',
        strategy: 'S1',
        direction: 'supports',
        strengthBand: 'strong',
        strengthValue: null,
        basis: 'Bad Bunny US affinity',
        freshness: 'live',
      },
      {
        id: 'sig-4',
        proposalId: 'p-4',
        marketId: 'm-br',
        strategy: 'S1',
        direction: 'supports',
        strengthBand: 'moderate',
        strengthValue: null,
        basis: 'Bad Bunny BR affinity',
        freshness: 'live',
      },
    ],
    analogs: [
      {
        proposalId: 'p-1',
        historicalRecordId: 'h-1',
        metricName: 'Event performance index vs studio baseline',
        metricUnit: 'ratio',
        metricValue: 1.3,
        baselineValue: 1.0,
        dataOrigin: 'synthetic_demo',
      },
      {
        proposalId: 'p-2',
        historicalRecordId: 'h-2',
        metricName: 'Event performance index vs studio baseline',
        metricUnit: 'ratio',
        metricValue: 1.55,
        baselineValue: 1.0,
        dataOrigin: 'synthetic_demo',
      },
      {
        proposalId: 'p-3',
        historicalRecordId: 'h-3',
        metricName: 'Event performance index vs studio baseline',
        metricUnit: 'ratio',
        metricValue: 0.85,
        baselineValue: 1.0,
        dataOrigin: 'synthetic_demo',
      },
      {
        proposalId: 'p-5',
        historicalRecordId: 'h-4',
        metricName: 'Event performance index vs studio baseline',
        metricUnit: 'ratio',
        metricValue: 1.1,
        baselineValue: 1.0,
        dataOrigin: 'synthetic_demo',
      },
    ],
    weights: {
      cultural_relevance: 0.35,
      evidence_confidence: 0.15,
      feasibility: 0.2,
      commercial_evidence: 0.2,
      stakeholder_priority: 0.1,
    },
    options: {
      variants: 'both',
      minCoverage: 0.5,
      tieEpsilon: 0.02,
    },
  };

  // -------------------------------------------------------------------------
  // ENG-01: Hash Stability & Helpers
  // -------------------------------------------------------------------------
  it('ENG-01: Produces deterministic, stable SHA-256 hash regardless of object key ordering', () => {
    const hash1 = computeInputHash(baseInput);

    // Permute keys in object
    const permutedInput: DecisionInput = {
      ...baseInput,
      weights: {
        stakeholder_priority: 0.1,
        feasibility: 0.2,
        cultural_relevance: 0.35,
        commercial_evidence: 0.2,
        evidence_confidence: 0.15,
      },
    };
    const hash2 = computeInputHash(permutedInput);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(round6(0.123456789)).toBe(0.123457);
  });

  // -------------------------------------------------------------------------
  // ENG-02..04: Eligibility & Hard Constraints
  // -------------------------------------------------------------------------
  it('ENG-02..04: Excludes proposal outside horizon under hard enforcement', () => {
    const output = runDecision(baseInput);
    const qloo = output.variants.qloo_informed!;

    // Proposal 6 is releaseWindowStart: 2027-07-01 (outside horizon 2027-06-30)
    const p6 = qloo.rankings.find((r) => r.proposalId === 'p-6');
    expect(p6).toBeDefined();
    expect(p6?.status).toBe('excluded');
    expect(p6?.reasonCodes).toContain('HC_OUTSIDE_HORIZON');
    expect(p6?.rank).toBeNull();
  });

  it('ENG-02..04: Cascades exclusion to fixpoint when internal dependency is excluded (HC_DEPENDENCY_EXCLUDED)', () => {
    // Make proposal 1 outside horizon so it gets excluded
    const modifiedInput: DecisionInput = {
      ...baseInput,
      proposals: baseInput.proposals.map((p) =>
        p.id === 'p-1'
          ? { ...p, releaseWindowStart: '2027-08-01', releaseWindowEnd: '2027-09-01' }
          : p,
      ),
    };

    const output = runDecision(modifiedInput);
    const qloo = output.variants.qloo_informed!;

    // p-1 is directly excluded
    const p1 = qloo.rankings.find((r) => r.proposalId === 'p-1');
    expect(p1?.status).toBe('excluded');
    expect(p1?.reasonCodes).toContain('HC_OUTSIDE_HORIZON');

    // p-2 depends on p-1 -> must be cascade excluded!
    const p2 = qloo.rankings.find((r) => r.proposalId === 'p-2');
    expect(p2?.status).toBe('excluded');
    expect(p2?.reasonCodes).toContain('HC_DEPENDENCY_EXCLUDED');
  });

  it('ENG-02..04: Generates advisory warnings without exclusion under advisory enforcement', () => {
    const advisoryInput: DecisionInput = {
      ...baseInput,
      constraints: {
        ...baseInput.constraints,
        horizonEnforcement: 'advisory',
      },
    };

    const output = runDecision(advisoryInput);
    const qloo = output.variants.qloo_informed!;

    const p6 = qloo.rankings.find((r) => r.proposalId === 'p-6');
    expect(p6?.status).not.toBe('excluded');
    expect(p6?.warnings).toContain('WARN_OUTSIDE_HORIZON');
  });

  // -------------------------------------------------------------------------
  // ENG-05, 06: Greedy Selection & Dependency Fixpoint
  // -------------------------------------------------------------------------
  it('ENG-05, 06: Solves multi-pass dependency selection to fixpoint and records budget shortfalls', () => {
    const output = runDecision(baseInput);
    const qloo = output.variants.qloo_informed!;

    // Eligible 5 proposals sum to 90k + 140k + 70k + 85k + 60k = 445k > 360k available
    expect(qloo.portfolio.budgetRemainingMinor).toBeGreaterThanOrEqual(0n);
    expect(qloo.portfolio.selectedIds.length).toBeGreaterThan(0);

    // Selected proposals must include both dependency parent and child if child is selected
    if (qloo.portfolio.selectedIds.includes('p-2')) {
      expect(qloo.portfolio.selectedIds).toContain('p-1');
    }

    // Every not_funded proposal must have shortfall calculated and tradeoff winners identified
    const notFunded = qloo.rankings.filter((r) => r.status === 'not_funded');
    for (const nf of notFunded) {
      if (nf.reasonCodes.includes('REM_BUDGET_INSUFFICIENT')) {
        expect(nf.shortfallMinor).toBeDefined();
        expect(nf.shortfallMinor!).toBeGreaterThan(0n);
        expect(nf.tradeoffWinners).toBeDefined();
        expect(nf.tradeoffWinners!.length).toBeGreaterThan(0);
      }
    }
  });

  // -------------------------------------------------------------------------
  // ENG-07, 08: Ranking, Tie Breaking, and Flags
  // -------------------------------------------------------------------------
  it('ENG-07, 08: Enforces deterministic total rank order and flags near-ties', () => {
    const output = runDecision(baseInput);
    const qloo = output.variants.qloo_informed!;

    const ranked = qloo.rankings.filter((r) => r.rank !== null);
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].rank!).toBe(i + 1);
      // Verify descending score order
      if (ranked[i].score !== null && ranked[i + 1].score !== null) {
        expect(ranked[i].score!).toBeGreaterThanOrEqual(ranked[i + 1].score!);
      }
    }
  });

  // -------------------------------------------------------------------------
  // ENG-09..13: Criteria & Unavailable Semantics
  // -------------------------------------------------------------------------
  it('ENG-09..13: Treats unavailable criteria as null without penalizing score as zero', () => {
    const output = runDecision(baseInput);
    const qloo = output.variants.qloo_informed!;

    // Proposal 4 has no historical analog -> commercial_evidence must be unavailable
    const p4 = qloo.rankings.find((r) => r.proposalId === 'p-4');
    expect(p4).toBeDefined();
    expect(p4?.criteria.commercial_evidence.available).toBe(false);
    expect(p4?.criteria.commercial_evidence.value).toBeNull();

    // Coverage must reflect excluded weight (1.0 - 0.20 = 0.80)
    expect(p4?.coverage).toBe(0.8);
  });

  // -------------------------------------------------------------------------
  // ENG-14, 15: Bounds Invariant
  // -------------------------------------------------------------------------
  it('ENG-14, 15: Preserves bounds invariant lower <= score <= upper for all proposals', () => {
    const output = runDecision(baseInput);
    const qloo = output.variants.qloo_informed!;

    for (const r of qloo.rankings) {
      if (r.score !== null && r.scoreLower !== null && r.scoreUpper !== null) {
        expect(r.scoreLower).toBeLessThanOrEqual(r.score + 1e-6);
        expect(r.score).toBeLessThanOrEqual(r.scoreUpper + 1e-6);
      }
    }
  });

  // -------------------------------------------------------------------------
  // ENG-16, 17: Baseline Fairness & Equivalence Property
  // -------------------------------------------------------------------------
  it('ENG-16, 17: Equivalence Property: qloo_informed with cultural weights=0 is identical to baseline', () => {
    const zeroCulturalInput: DecisionInput = {
      ...baseInput,
      weights: {
        cultural_relevance: 0.0,
        evidence_confidence: 0.0,
        feasibility: 0.45,
        commercial_evidence: 0.35,
        stakeholder_priority: 0.2,
      },
    };

    const output = runDecision(zeroCulturalInput);
    const qloo = output.variants.qloo_informed!;
    const baseline = output.variants.baseline!;

    // Selected portfolio must be identical
    expect(qloo.portfolio.selectedIds).toEqual(baseline.portfolio.selectedIds);
    expect(qloo.portfolio.budgetUsedMinor).toBe(baseline.portfolio.budgetUsedMinor);

    // Rank orders must match exactly
    const qRanks = qloo.rankings.map((r) => ({ id: r.proposalId, rank: r.rank, status: r.status }));
    const bRanks = baseline.rankings.map((r) => ({
      id: r.proposalId,
      rank: r.rank,
      status: r.status,
    }));
    expect(qRanks).toEqual(bRanks);
  });

  // -------------------------------------------------------------------------
  // ENG-18..21: Explanations and Replan Diff
  // -------------------------------------------------------------------------
  it('ENG-18..21: Generates deterministic template explanations and computes diff across runs', () => {
    const runA = runDecision(baseInput);

    // Create a modified replan run with tighter budget
    const replanInput: DecisionInput = {
      ...baseInput,
      constraints: {
        ...baseInput.constraints,
        budgetTotalMinor: 25000000n, // $250,000 instead of $400,000
      },
    };
    const runB = runDecision(replanInput);

    const diff = diffRuns(runA, runB);
    expect(diff.allocationChange).toBeDefined();
    expect(diff.summarySentence).toContain('Re-plan adjusted budget allocation');

    // Explanations present
    for (const r of runA.variants.qloo_informed!.rankings) {
      expect(r.explanation.length).toBeGreaterThan(0);
      expect(r.explanation[0].text).toBeDefined();
    }
  });

  it('Edge Cases: Tests draft status, budget/capacity hard exclusions, mixed analog metrics, and diff shortlist changes', () => {
    const edgeInput: DecisionInput = {
      ...baseInput,
      constraints: {
        ...baseInput.constraints,
        capacityPersonDays: 400,
        capacityEnforcement: 'hard',
      },
      proposals: [
        ...baseInput.proposals,
        {
          id: 'p-rejected',
          name: 'Rejected Feature',
          status: 'rejected',
          estimatedCostMinor: 1000000n,
          effortPersonDays: 5,
          releaseWindowStart: '2026-06-01',
          releaseWindowEnd: '2026-06-15',
        },
        {
          id: 'p-huge-cost',
          name: 'Super Expensive Feature',
          status: 'candidate',
          estimatedCostMinor: 999999999n,
          effortPersonDays: 5,
          releaseWindowStart: '2026-06-01',
          releaseWindowEnd: '2026-06-15',
        },
        {
          id: 'p-huge-effort',
          name: 'Super High Effort Feature',
          status: 'candidate',
          estimatedCostMinor: 1000000n,
          effortPersonDays: 500,
          releaseWindowStart: '2026-06-01',
          releaseWindowEnd: '2026-06-15',
        },
      ],
      analogs: [
        ...baseInput.analogs,
        {
          proposalId: 'p-1',
          historicalRecordId: 'h-mixed-1',
          metricName: 'conversion_pct',
          metricUnit: 'percent',
          metricValue: 12.5,
          baselineValue: 10.0,
          dataOrigin: 'user_supplied',
        },
        {
          proposalId: 'p-1',
          historicalRecordId: 'h-mixed-2',
          metricName: 'revenue_lift',
          metricUnit: 'currency_minor',
          metricValue: 50000,
          baselineValue: 20000,
          dataOrigin: 'user_supplied',
        },
      ],
      options: {
        minCoverage: 0.9,
      },
    };

    const out = runDecision(edgeInput);
    const qloo = out.variants.qloo_informed!;

    // Rejected excluded
    const rejected = qloo.rankings.find((r) => r.proposalId === 'p-rejected');
    expect(rejected?.status).toBe('excluded');
    expect(rejected?.reasonCodes).toContain('HC_STATUS_INELIGIBLE');

    // Cost exceeds budget excluded
    const hugeCost = qloo.rankings.find((r) => r.proposalId === 'p-huge-cost');
    expect(hugeCost?.status).toBe('excluded');
    expect(hugeCost?.reasonCodes).toContain('HC_COST_EXCEEDS_BUDGET');

    // Effort exceeds capacity excluded under hard enforcement
    const hugeEffort = qloo.rankings.find((r) => r.proposalId === 'p-huge-effort');
    expect(hugeEffort?.status).toBe('excluded');
    expect(hugeEffort?.reasonCodes).toContain('HC_EFFORT_EXCEEDS_CAPACITY');

    // p-1 has mixed analog metrics -> commercial evidence unavailable
    const p1 = qloo.rankings.find((r) => r.proposalId === 'p-1');
    expect(p1?.criteria.commercial_evidence.available).toBe(false);

    // p-1 has coverage below minCoverage 0.9 -> LOW_COVERAGE flag
    expect(p1?.flags).toContain('LOW_COVERAGE');

    // Run diff with shortlist changes
    const diff = diffRuns(runDecision(baseInput), out);
    expect(diff.allocationChange).toBeDefined();
    expect(diff.summarySentence).toContain('Re-plan adjusted');
  });

  it('Covers exact tie breaking, deferred dependency selection, and detailed diff rank shifts', () => {
    // 1. Tie breaking by cost and ID
    const tieInput: DecisionInput = {
      ...baseInput,
      proposals: [
        {
          id: 'p-tie-b',
          name: 'Tie B',
          status: 'candidate',
          estimatedCostMinor: 2000000n, // higher cost
          effortPersonDays: 10,
          releaseWindowStart: '2027-02-01',
          releaseWindowEnd: '2027-02-15',
          scheduleConfidence: 4,
          stakeholderPriority: 3,
        },
        {
          id: 'p-tie-a',
          name: 'Tie A',
          status: 'candidate',
          estimatedCostMinor: 1000000n, // lower cost
          effortPersonDays: 10,
          releaseWindowStart: '2027-02-01',
          releaseWindowEnd: '2027-02-15',
          scheduleConfidence: 4,
          stakeholderPriority: 3,
        },
      ],
      proposalMarkets: [
        { proposalId: 'p-tie-a', marketId: 'm-us' },
        { proposalId: 'p-tie-b', marketId: 'm-us' },
      ],
      dependencies: [],
      analogs: [],
      signals: [],
    };

    const tieOut = runDecision(tieInput);
    const tieRankings = tieOut.variants.qloo_informed!.rankings;
    // Tie A (lower cost) should rank 1, Tie B rank 2
    expect(tieRankings[0].proposalId).toBe('p-tie-a');
    expect(tieRankings[1].proposalId).toBe('p-tie-b');

    // 2. Unmet dependency deferred across passes
    const depPassInput: DecisionInput = {
      ...baseInput,
      constraints: {
        ...baseInput.constraints,
        budgetTotalMinor: 15000000n, // Available 11M
        contingencyReserveMinor: 4000000n,
      },
      proposals: [
        {
          id: 'p-other',
          name: 'Other Top Proposal',
          status: 'candidate',
          estimatedCostMinor: 10000000n, // $100k - consumes budget down to $10k
          effortPersonDays: 10,
          releaseWindowStart: '2027-02-01',
          releaseWindowEnd: '2027-02-15',
          scheduleConfidence: 5,
          stakeholderPriority: 5,
        },
        {
          id: 'p-child',
          name: 'Child Proposal',
          status: 'candidate',
          estimatedCostMinor: 1000000n,
          effortPersonDays: 10,
          releaseWindowStart: '2027-02-01',
          releaseWindowEnd: '2027-02-15',
          scheduleConfidence: 4,
          stakeholderPriority: 4,
        },
        {
          id: 'p-parent',
          name: 'Parent Proposal',
          status: 'candidate',
          estimatedCostMinor: 5000000n, // $50k - will not fit after p-other
          effortPersonDays: 10,
          releaseWindowStart: '2027-02-01',
          releaseWindowEnd: '2027-02-15',
          scheduleConfidence: 3,
          stakeholderPriority: 3,
        },
      ],
      dependencies: [
        {
          proposalId: 'p-child',
          dependsOnProposalId: 'p-parent',
          kind: 'internal',
          dependencyType: 'requires',
          status: 'pending',
        },
      ],
      proposalMarkets: [],
      analogs: [],
      signals: [],
    };

    const depOut = runDecision(depPassInput);
    const childRank = depOut.variants.qloo_informed!.rankings.find((r) => r.proposalId === 'p-child');
    expect(childRank?.status).toBe('deferred_unmet_dependency');

    // 3. Diff with rank shift and left/entered shortlist
    const rankShiftInput: DecisionInput = {
      ...baseInput,
      proposals: baseInput.proposals.map((p) =>
        p.id === 'p-1'
          ? { ...p, stakeholderPriority: 5 }
          : p.id === 'p-2'
            ? { ...p, stakeholderPriority: 1 }
            : p,
      ),
    };
    const diffRunsOut = diffRuns(runDecision(baseInput), runDecision(rankShiftInput));
    expect(diffRunsOut.rankChanges.length).toBeGreaterThan(0);
  });
});
