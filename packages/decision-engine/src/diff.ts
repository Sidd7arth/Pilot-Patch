// packages/decision-engine/src/diff.ts
import type { DecisionOutput, RunDiff, RankChange } from './types.js';

export function diffRuns(a: DecisionOutput, b: DecisionOutput): RunDiff {
  const qA = a.variants.qloo_informed ?? a.variants.baseline;
  const qB = b.variants.qloo_informed ?? b.variants.baseline;

  if (!qA || !qB) {
    throw new Error('Cannot diff runs: missing variant outputs in one or both runs');
  }

  const selectedA = new Set(qA.portfolio.selectedIds);
  const selectedB = new Set(qB.portfolio.selectedIds);

  const enteredShortlist: string[] = [];
  const leftShortlist: string[] = [];

  for (const id of selectedB) {
    if (!selectedA.has(id)) {
      const p = qB.rankings.find((r) => r.proposalId === id);
      enteredShortlist.push(p ? p.proposalName : id);
    }
  }

  for (const id of selectedA) {
    if (!selectedB.has(id)) {
      const p = qA.rankings.find((r) => r.proposalId === id);
      leftShortlist.push(p ? p.proposalName : id);
    }
  }

  const rankChanges: RankChange[] = [];
  const mapA = new Map(qA.rankings.map((r) => [r.proposalId, r]));

  for (const rB of qB.rankings) {
    const rA = mapA.get(rB.proposalId);
    if (!rA) continue;

    if (rA.rank !== rB.rank) {
      const delta = (rA.rank ?? 99) - (rB.rank ?? 99);
      const direction = delta > 0 ? `promoted +${delta}` : `demoted ${delta}`;
      rankChanges.push({
        proposalId: rB.proposalId,
        proposalName: rB.proposalName,
        fromRank: rA.rank,
        toRank: rB.rank,
        reason: `Rank shifted from #${rA.rank ?? 'none'} to #${rB.rank ?? 'none'} (${direction})`,
      });
    }
  }

  const bUsedA = BigInt(qA.portfolio.budgetUsedMinor);
  const bUsedB = BigInt(qB.portfolio.budgetUsedMinor);
  const budgetDeltaMinor = bUsedB - bUsedA;
  const budgetDeltaFmt = (Number(budgetDeltaMinor) / 100).toFixed(2);
  const summarySentence = `Re-plan adjusted budget allocation by $${budgetDeltaFmt}, with ${enteredShortlist.length} proposals entering and ${leftShortlist.length} leaving the funded shortlist.`;

  return {
    parameterChanges: [],
    enteredShortlist,
    leftShortlist,
    rankChanges,
    allocationChange: {
      budgetUsedFromMinor: bUsedA,
      budgetUsedToMinor: bUsedB,
      effortUsedFromDays: qA.portfolio.effortUsedDays,
      effortUsedToDays: qB.portfolio.effortUsedDays,
    },
    summarySentence,
  };
}
