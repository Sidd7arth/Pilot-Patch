// packages/decision-engine/src/ranking.ts
import type {
  DecisionProposal,
  EngineWeights,
  EngineOptions,
  CriterionDetail,
  FlagCode,
} from './types.js';
import { round6 } from './canonical.js';

export interface EvaluatedProposal {
  proposal: DecisionProposal;
  criteria: Record<keyof EngineWeights, CriterionDetail>;
  score: number | null;
  scoreLower: number | null;
  scoreUpper: number | null;
  coverage: number;
  flags: FlagCode[];
}

export function rankProposals(
  proposals: DecisionProposal[],
  criteriaMap: Map<string, Record<keyof EngineWeights, CriterionDetail>>,
  weights: EngineWeights,
  options?: EngineOptions,
): EvaluatedProposal[] {
  const minCoverage = options?.minCoverage ?? 0.5;
  const tieEpsilon = options?.tieEpsilon ?? 0.02;

  const evaluated: EvaluatedProposal[] = [];

  for (const proposal of proposals) {
    const pCriteria = criteriaMap.get(proposal.id);
    if (!pCriteria) continue;

    let availableWeightSum = 0;
    let weightedScoreSum = 0;

    for (const [key, detail] of Object.entries(pCriteria) as Array<
      [keyof EngineWeights, CriterionDetail]
    >) {
      const w = weights[key] ?? 0;
      detail.weight = w;

      if (detail.available && detail.value !== null) {
        availableWeightSum += w;
        weightedScoreSum += w * detail.value;
        detail.contribution = round6(w * detail.value);
      } else {
        detail.contribution = 0;
      }
    }

    const coverage = round6(availableWeightSum);
    const flags: FlagCode[] = [];

    let score: number | null = null;
    let scoreLower: number | null = null;
    let scoreUpper: number | null = null;

    if (coverage > 0) {
      score = round6(weightedScoreSum / coverage);
      scoreLower = round6(weightedScoreSum);
      scoreUpper = round6(scoreLower + (1.0 - coverage));

      // Guard bounds invariant: lower <= score <= upper
      if (score < scoreLower) score = scoreLower;
      if (score > scoreUpper) score = scoreUpper;

      if (coverage < minCoverage) {
        flags.push('LOW_COVERAGE');
      }
    } else {
      flags.push('NO_EVIDENCE');
    }

    evaluated.push({
      proposal,
      criteria: pCriteria,
      score,
      scoreLower,
      scoreUpper,
      coverage,
      flags,
    });
  }

  // Deterministic Total Ordering (ENG-07 / §8.4):
  // 1. score DESC (nulls at end)
  // 2. coverage DESC
  // 3. cost ASC
  // 4. proposalId ASC
  evaluated.sort((a, b) => {
    if (a.score === null && b.score !== null) return 1;
    if (a.score !== null && b.score === null) return -1;
    if (a.score !== null && b.score !== null) {
      if (Math.abs(a.score - b.score) > 1e-9) {
        return b.score - a.score;
      }
    }

    if (Math.abs(a.coverage - b.coverage) > 1e-9) {
      return b.coverage - a.coverage;
    }

    if (a.proposal.estimatedCostMinor !== b.proposal.estimatedCostMinor) {
      return a.proposal.estimatedCostMinor < b.proposal.estimatedCostMinor ? -1 : 1;
    }

    return a.proposal.id.localeCompare(b.proposal.id);
  });

  // Flag NEAR_TIE with adjacent ranks
  for (let i = 0; i < evaluated.length; i++) {
    const cur = evaluated[i];
    if (!cur || cur.score === null) continue;

    const prev = i > 0 ? evaluated[i - 1] : undefined;
    const next = i < evaluated.length - 1 ? evaluated[i + 1] : undefined;

    let nearTie = false;
    if (prev && prev.score !== null) {
      if (Math.abs(cur.score - prev.score) < tieEpsilon) {
        nearTie = true;
      }
    }
    if (next && next.score !== null) {
      if (Math.abs(cur.score - next.score) < tieEpsilon) {
        nearTie = true;
      }
    }

    if (nearTie && !cur.flags.includes('NEAR_TIE')) {
      cur.flags.push('NEAR_TIE');
    }
  }

  return evaluated;
}
