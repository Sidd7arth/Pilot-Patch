// packages/decision-engine/src/explanations.ts
import type { ProposalRanking, ExplanationNode } from './types.js';

export function generateProposalExplanations(ranking: ProposalRanking): ExplanationNode[] {
  const nodes: ExplanationNode[] = [];

  // 1. Summary
  if (ranking.status === 'selected') {
    nodes.push({
      type: 'summary',
      text: `Ranked #${ranking.rank} with score ${(ranking.score! * 100).toFixed(1)}/100 (coverage ${(ranking.coverage * 100).toFixed(0)}%). Selected into the portfolio.`,
    });
  } else if (ranking.status === 'not_funded') {
    nodes.push({
      type: 'summary',
      text: `Ranked #${ranking.rank} with score ${(ranking.score! * 100).toFixed(1)}/100, but not funded due to portfolio constraint limits.`,
    });
  } else if (ranking.status === 'deferred_unmet_dependency') {
    nodes.push({
      type: 'summary',
      text: `Ranked #${ranking.rank}, but deferred because a required internal dependency could not be funded.`,
    });
  } else if (ranking.status === 'excluded') {
    nodes.push({
      type: 'exclusion',
      text: `Excluded from evaluation due to hard constraint violations: ${ranking.reasonCodes.join(', ')}.`,
    });
    return nodes;
  }

  // 2. Criteria Explanations
  for (const [key, detail] of Object.entries(ranking.criteria)) {
    const formattedKey = key.replace(/_/g, ' ');
    if (detail.available && detail.value !== null) {
      nodes.push({
        type: 'criterion',
        code: key,
        text: `${formattedKey}: score ${(detail.value * 100).toFixed(1)}/100 (weight ${(detail.weight * 100).toFixed(0)}%, contribution ${(detail.contribution * 100).toFixed(1)} pts). ${detail.notes ?? ''}`.trim(),
      });
    } else {
      nodes.push({
        type: 'criterion',
        code: key,
        text: `${formattedKey}: unavailable. Excluded from weighting without penalizing score. ${detail.notes ?? ''}`.trim(),
      });
    }
  }

  // 3. Tradeoff Explanations
  if (ranking.status === 'not_funded' && ranking.reasonCodes.includes('REM_BUDGET_INSUFFICIENT')) {
    const shortfallFmt = ranking.shortfallMinor
      ? `$${(Number(ranking.shortfallMinor) / 100).toFixed(2)}`
      : 'the required budget';
    nodes.push({
      type: 'tradeoff',
      code: 'REM_BUDGET_INSUFFICIENT',
      text: `Budget exhausted. Exceeded remaining available budget by ${shortfallFmt}. Prior rank proposals consumed available funds.`,
    });
  }

  if (
    ranking.status === 'not_funded' &&
    ranking.reasonCodes.includes('REM_CAPACITY_INSUFFICIENT')
  ) {
    nodes.push({
      type: 'tradeoff',
      code: 'REM_CAPACITY_INSUFFICIENT',
      text: `Effort required exceeds remaining person-day capacity.`,
    });
  }

  if (ranking.status === 'not_funded' && ranking.reasonCodes.includes('REM_MAX_SELECTIONS')) {
    nodes.push({
      type: 'tradeoff',
      code: 'REM_MAX_SELECTIONS',
      text: `Maximum portfolio selection count limit reached.`,
    });
  }

  return nodes;
}
