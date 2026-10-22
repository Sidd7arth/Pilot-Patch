// packages/decision-engine/src/criteria.ts
import type {
  DecisionProposal,
  DecisionConstraints,
  DecisionMarket,
  DecisionProposalMarket,
  DecisionCulturalSignal,
  DecisionAnalogRecord,
  DecisionDependency,
  EngineOptions,
  CriterionDetail,
  EngineWeights,
} from './types.js';
import { round6 } from './canonical.js';

export function calculateCulturalRelevance(
  proposal: DecisionProposal,
  markets: DecisionMarket[],
  proposalMarkets: DecisionProposalMarket[],
  signals: DecisionCulturalSignal[],
  options?: EngineOptions,
): CriterionDetail {
  const targetMarketIds = proposalMarkets
    .filter((pm) => pm.proposalId === proposal.id)
    .map((pm) => pm.marketId);

  const targetMarkets = markets.filter((m) => targetMarketIds.includes(m.id));

  if (targetMarkets.length === 0) {
    return {
      value: null,
      available: false,
      weight: 0,
      contribution: 0,
      origin: 'system_derived',
      notes: 'No target markets configured for proposal',
    };
  }

  const bandValues = options?.bandValues ?? { strong: 1.0, moderate: 0.66, weak: 0.33 };
  const signalMode = options?.signalMode ?? 'tiered';

  let weightedSum = 0;
  let weightsSum = 0;

  for (const market of targetMarkets) {
    const marketSignals = signals.filter(
      (s) => s.proposalId === proposal.id && s.marketId === market.id && s.direction === 'supports',
    );

    if (marketSignals.length === 0) {
      continue; // No supporting signals for this market -> v_m is null
    }

    const values = marketSignals
      .map((s) => {
        if (signalMode === 'score_normalized' && s.strengthValue !== null) {
          return s.strengthValue;
        }
        if (s.strengthBand === 'strong') return bandValues.strong;
        if (s.strengthBand === 'moderate') return bandValues.moderate;
        if (s.strengthBand === 'weak') return bandValues.weak;
        return null;
      })
      .filter((v): v is number => v !== null);

    if (values.length > 0) {
      const marketMean = values.reduce((acc, v) => acc + v, 0) / values.length;
      weightedSum += market.weight * marketMean;
      weightsSum += market.weight;
    }
  }

  if (weightsSum === 0) {
    return {
      value: null,
      available: false,
      weight: 0,
      contribution: 0,
      origin: 'system_derived',
      notes: 'No supporting cultural signals observed in top results',
    };
  }

  const finalScore = round6(weightedSum / weightsSum);

  return {
    value: finalScore,
    available: true,
    weight: 0, // Set during aggregation
    contribution: 0,
    origin: 'live_qloo',
    notes: `Derived across ${targetMarkets.length} target markets`,
  };
}

export function calculateEvidenceConfidence(
  proposal: DecisionProposal,
  _markets: DecisionMarket[],
  proposalMarkets: DecisionProposalMarket[],
  signals: DecisionCulturalSignal[],
): CriterionDetail {
  const proposalSignals = signals.filter((s) => s.proposalId === proposal.id);

  if (proposalSignals.length === 0) {
    return {
      value: null,
      available: false,
      weight: 0,
      contribution: 0,
      origin: 'system_derived',
      notes: 'No cultural evidence queries succeeded for proposal',
    };
  }

  // 1. Resolution coverage
  const totalRefs = proposal.totalReferencesCount ?? 1;
  const resolvedRefs = proposal.resolvedReferencesCount ?? (proposalSignals.length > 0 ? 1 : 0);
  const resolutionCoverage = Math.min(1.0, resolvedRefs / Math.max(1, totalRefs));

  // 2. Market coverage
  const targetMarketIds = proposalMarkets
    .filter((pm) => pm.proposalId === proposal.id)
    .map((pm) => pm.marketId);
  const totalMarkets = Math.max(1, targetMarketIds.length);
  const distinctMarketsWithSignals = new Set(proposalSignals.map((s) => s.marketId)).size;
  const marketCoverage = Math.min(1.0, distinctMarketsWithSignals / totalMarkets);

  // 3. Freshness factor: 1.0 (live or cached_fresh); 0.5 if any cached_stale
  const hasStale = proposalSignals.some((s) => s.freshness === 'cached_stale');
  const freshnessFactor = hasStale ? 0.5 : 1.0;

  const score = round6(0.4 * resolutionCoverage + 0.4 * marketCoverage + 0.2 * freshnessFactor);

  return {
    value: score,
    available: true,
    weight: 0,
    contribution: 0,
    origin: 'system_derived',
    notes: `Resolution cov: ${(resolutionCoverage * 100).toFixed(0)}%, Market cov: ${(marketCoverage * 100).toFixed(0)}%, Freshness: ${hasStale ? 'stale factor applied' : 'fresh'}`,
  };
}

export function calculateFeasibility(
  proposal: DecisionProposal,
  constraints: DecisionConstraints,
  dependencies: DecisionDependency[],
): CriterionDetail {
  const components: number[] = [];

  // 1. Budget efficiency
  const availableBudget = constraints.budgetTotalMinor - constraints.contingencyReserveMinor;
  if (availableBudget > 0n) {
    const costRatio = Number(proposal.estimatedCostMinor) / Number(availableBudget);
    components.push(Math.max(0, Math.min(1, 1 - costRatio)));
  }

  // 2. Effort fit (if capacity set)
  if (constraints.capacityPersonDays && constraints.capacityPersonDays > 0) {
    const effortRatio = proposal.effortPersonDays / constraints.capacityPersonDays;
    components.push(Math.max(0, Math.min(1, 1 - effortRatio)));
  }

  // 3. Schedule confidence (1..5 -> 0..1)
  if (
    proposal.scheduleConfidence !== null &&
    proposal.scheduleConfidence !== undefined &&
    proposal.scheduleConfidence >= 1 &&
    proposal.scheduleConfidence <= 5
  ) {
    components.push((proposal.scheduleConfidence - 1) / 4);
  }

  // 4. Dependency readiness
  const pDeps = dependencies.filter((d) => d.proposalId === proposal.id);
  if (pDeps.length === 0) {
    components.push(1.0);
  } else {
    const satisfied = pDeps.filter((d) => d.status === 'satisfied').length;
    components.push(satisfied / pDeps.length);
  }

  if (components.length === 0) {
    return {
      value: null,
      available: false,
      weight: 0,
      contribution: 0,
      origin: 'system_derived',
    };
  }

  const score = round6(components.reduce((a, b) => a + b, 0) / components.length);

  return {
    value: score,
    available: true,
    weight: 0,
    contribution: 0,
    origin: 'system_derived',
    notes: `Operational readiness derived from ${components.length} feasibility dimensions`,
  };
}

export function calculateCommercialEvidence(
  proposal: DecisionProposal,
  analogs: DecisionAnalogRecord[],
  options?: EngineOptions,
): CriterionDetail {
  const pAnalogs = analogs.filter((a) => a.proposalId === proposal.id);

  if (pAnalogs.length === 0) {
    return {
      value: null,
      available: false,
      weight: 0,
      contribution: 0,
      origin: 'user_supplied',
      notes: 'No historical analogs linked to proposal',
    };
  }

  const firstAnalog = pAnalogs[0];
  if (!firstAnalog) {
    return {
      value: null,
      available: false,
      weight: 0,
      contribution: 0,
      origin: 'user_supplied',
      notes: 'No historical analogs linked to proposal',
    };
  }

  // Verify metric consistency
  const firstMetric = firstAnalog.metricName;
  const firstUnit = firstAnalog.metricUnit;
  const mixedMetrics = pAnalogs.some(
    (a) => a.metricName !== firstMetric || a.metricUnit !== firstUnit,
  );

  if (mixedMetrics) {
    return {
      value: null,
      available: false,
      weight: 0,
      contribution: 0,
      origin: 'user_supplied',
      notes: 'Analogs have mixed metrics or units; commercial ratio unavailable',
    };
  }

  // Mean ratio
  const ratios = pAnalogs.map((a) => a.metricValue / Math.max(1e-6, a.baselineValue));
  const meanRatio = ratios.reduce((acc, r) => acc + r, 0) / ratios.length;

  const cap = options?.commercialRatioCap ?? 2.0;
  const score = round6(Math.max(0, Math.min(1, meanRatio / cap)));

  return {
    value: score,
    available: true,
    weight: 0,
    contribution: 0,
    origin: firstAnalog.dataOrigin,
    notes: `Historical index ratio: ${round6(meanRatio)} vs baseline (capped at ${cap})`,
  };
}

export function calculateStakeholderPriority(proposal: DecisionProposal): CriterionDetail {
  if (
    proposal.stakeholderPriority === null ||
    proposal.stakeholderPriority === undefined ||
    proposal.stakeholderPriority < 1 ||
    proposal.stakeholderPriority > 5
  ) {
    return {
      value: null,
      available: false,
      weight: 0,
      contribution: 0,
      origin: 'user_supplied',
      notes: 'No stakeholder priority assigned',
    };
  }

  const score = round6((proposal.stakeholderPriority - 1) / 4);

  return {
    value: score,
    available: true,
    weight: 0,
    contribution: 0,
    origin: 'user_supplied',
    notes: `Priority rating ${proposal.stakeholderPriority} of 5`,
  };
}

export function calculateAllCriteria(
  proposal: DecisionProposal,
  constraints: DecisionConstraints,
  markets: DecisionMarket[],
  proposalMarkets: DecisionProposalMarket[],
  dependencies: DecisionDependency[],
  signals: DecisionCulturalSignal[],
  analogs: DecisionAnalogRecord[],
  options?: EngineOptions,
): Record<keyof EngineWeights, CriterionDetail> {
  return {
    cultural_relevance: calculateCulturalRelevance(
      proposal,
      markets,
      proposalMarkets,
      signals,
      options,
    ),
    evidence_confidence: calculateEvidenceConfidence(proposal, markets, proposalMarkets, signals),
    feasibility: calculateFeasibility(proposal, constraints, dependencies),
    commercial_evidence: calculateCommercialEvidence(proposal, analogs, options),
    stakeholder_priority: calculateStakeholderPriority(proposal),
  };
}
