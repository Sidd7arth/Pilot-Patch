// packages/decision-engine/src/variants.ts
import type {
  DecisionInput,
  VariantOutput,
  ComparisonAttribution,
  ProposalRanking,
} from './types.js';
import { evaluateEligibility } from './eligibility.js';
import { calculateAllCriteria } from './criteria.js';
import { rankProposals } from './ranking.js';
import { selectPortfolio } from './selection.js';
import { generateProposalExplanations } from './explanations.js';
import { round6 } from './canonical.js';

export function runVariant(
  input: DecisionInput,
  variant: 'qloo_informed' | 'baseline',
): VariantOutput {
  // 1. Evaluate eligibility & hard constraints
  const eligibility = evaluateEligibility(input.proposals, input.constraints, input.dependencies);

  // 2. Evaluate criteria for all proposals
  const criteriaMap = new Map();
  for (const p of input.proposals) {
    const pCriteria = calculateAllCriteria(
      p,
      input.constraints,
      input.markets,
      input.proposalMarkets,
      input.dependencies,
      input.signals,
      input.analogs,
      input.options,
    );

    if (variant === 'baseline') {
      // Force Qloo criteria to unavailable in baseline variant (§8.6)
      pCriteria.cultural_relevance = {
        value: null,
        available: false,
        weight: 0,
        contribution: 0,
        origin: 'system_derived',
        notes: 'Excluded in baseline variant',
      };
      pCriteria.evidence_confidence = {
        value: null,
        available: false,
        weight: 0,
        contribution: 0,
        origin: 'system_derived',
        notes: 'Excluded in baseline variant',
      };
    }

    criteriaMap.set(p.id, pCriteria);
  }

  // 3. Rank proposals
  const ranked = rankProposals(input.proposals, criteriaMap, input.weights, input.options);

  // 4. Select portfolio
  const selection = selectPortfolio(
    ranked,
    input.constraints,
    input.dependencies,
    eligibility.exclusions,
    eligibility.warnings,
  );

  // 5. Generate deterministic explanations
  for (const r of selection.rankings) {
    r.explanation = generateProposalExplanations(r);
  }

  const exclusionsList = Array.from(eligibility.exclusions.entries()).map(
    ([proposalId, reasons]) => ({ proposalId, reasons }),
  );
  const warningsList = Array.from(eligibility.warnings.entries()).map(([proposalId, warnings]) => ({
    proposalId,
    warnings,
  }));

  return {
    variant,
    rankings: selection.rankings,
    portfolio: selection.portfolio,
    exclusions: exclusionsList,
    warnings: warningsList,
  };
}

export function compareVariants(
  qlooRankings: ProposalRanking[],
  baselineRankings: ProposalRanking[],
): ComparisonAttribution[] {
  const comparison: ComparisonAttribution[] = [];

  const baseMap = new Map(baselineRankings.map((r) => [r.proposalId, r]));

  for (const q of qlooRankings) {
    const b = baseMap.get(q.proposalId);
    if (!b) continue;

    const rankDelta = b.rank !== null && q.rank !== null ? b.rank - q.rank : null; // positive = promoted
    const scoreDelta = b.score !== null && q.score !== null ? round6(q.score - b.score) : null;
    const statusChanged = b.status !== q.status;

    const drivers: string[] = [];
    if (q.criteria.cultural_relevance.available && q.criteria.cultural_relevance.value !== null) {
      drivers.push(
        `Cultural relevance added ${q.criteria.cultural_relevance.contribution.toFixed(2)} pts`,
      );
    }
    if (q.criteria.evidence_confidence.available && q.criteria.evidence_confidence.value !== null) {
      drivers.push(
        `Evidence confidence factor: ${q.criteria.evidence_confidence.value.toFixed(2)}`,
      );
    }
    if (rankDelta && rankDelta > 0) {
      drivers.push(`Promoted +${rankDelta} ranks above baseline`);
    } else if (rankDelta && rankDelta < 0) {
      drivers.push(`Demoted ${rankDelta} ranks below baseline`);
    }

    comparison.push({
      proposalId: q.proposalId,
      proposalName: q.proposalName,
      baselineRank: b.rank,
      qlooRank: q.rank,
      rankDelta,
      baselineStatus: b.status,
      qlooStatus: q.status,
      statusChanged,
      baselineScore: b.score,
      qlooScore: q.score,
      scoreDelta,
      drivers,
    });
  }

  return comparison;
}
