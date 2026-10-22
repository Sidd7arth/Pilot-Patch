// packages/decision-engine/src/selection.ts
import type {
  DecisionConstraints,
  DecisionDependency,
  ProposalRanking,
  ReasonCode,
  PortfolioSummary,
} from './types.js';
import type { EvaluatedProposal } from './ranking.js';
import { round6 } from './canonical.js';

export interface SelectionResult {
  rankings: ProposalRanking[];
  portfolio: PortfolioSummary;
}

export function selectPortfolio(
  rankedProposals: EvaluatedProposal[],
  constraints: DecisionConstraints,
  dependencies: DecisionDependency[],
  exclusions: Map<string, ReasonCode[]>,
  warnings: Map<string, WarningCode[]>,
): SelectionResult {
  const availableBudget = constraints.budgetTotalMinor - constraints.contingencyReserveMinor;
  let remainingBudget = availableBudget;

  const hasHardCapacity =
    constraints.capacityPersonDays !== null &&
    constraints.capacityPersonDays !== undefined &&
    constraints.capacityEnforcement === 'hard';

  let remainingCapacity = hasHardCapacity ? constraints.capacityPersonDays! : null;
  const maxSelections = constraints.maxSelections ?? null;

  const selectedIds = new Set<string>();
  const notFundedReasons = new Map<string, ReasonCode[]>();
  const shortfalls = new Map<string, bigint>();
  const tradeoffWinnersMap = new Map<string, string[]>();
  const deferredIds = new Set<string>();

  // Helper to check internal dependencies
  function areInternalDependenciesSatisfied(proposalId: string): boolean {
    const pDeps = dependencies.filter(
      (d) => d.proposalId === proposalId && d.kind === 'internal' && d.dependsOnProposalId,
    );

    for (const dep of pDeps) {
      const depTargetId = dep.dependsOnProposalId!;
      // Satisfied if explicitly status satisfied OR already selected in this run
      const isSatisfied = dep.status === 'satisfied' || selectedIds.has(depTargetId);
      if (!isSatisfied) {
        return false;
      }
    }
    return true;
  }

  // Multi-pass greedy selection to fixpoint (ENG-05, ENG-06)
  let changed = true;
  while (changed) {
    changed = false;

    for (const item of rankedProposals) {
      const p = item.proposal;
      if (exclusions.has(p.id) || selectedIds.has(p.id) || notFundedReasons.has(p.id)) {
        continue;
      }

      // Check budget
      if (p.estimatedCostMinor > remainingBudget) {
        notFundedReasons.set(p.id, ['REM_BUDGET_INSUFFICIENT']);
        shortfalls.set(p.id, p.estimatedCostMinor - remainingBudget);
        tradeoffWinnersMap.set(p.id, Array.from(selectedIds));
        deferredIds.delete(p.id);
        changed = true;
        continue;
      }

      // Check hard capacity
      if (hasHardCapacity && remainingCapacity !== null) {
        if (p.effortPersonDays > remainingCapacity) {
          notFundedReasons.set(p.id, ['REM_CAPACITY_INSUFFICIENT']);
          tradeoffWinnersMap.set(p.id, Array.from(selectedIds));
          deferredIds.delete(p.id);
          changed = true;
          continue;
        }
      }

      // Check max selections
      if (maxSelections !== null && selectedIds.size >= maxSelections) {
        notFundedReasons.set(p.id, ['REM_MAX_SELECTIONS']);
        tradeoffWinnersMap.set(p.id, Array.from(selectedIds));
        deferredIds.delete(p.id);
        changed = true;
        continue;
      }

      // Check internal dependency readiness
      if (!areInternalDependenciesSatisfied(p.id)) {
        deferredIds.add(p.id);
        continue; // Keep deferred for next pass
      }

      // Proposal selected!
      selectedIds.add(p.id);
      deferredIds.delete(p.id);
      remainingBudget -= p.estimatedCostMinor;
      if (remainingCapacity !== null) {
        remainingCapacity -= p.effortPersonDays;
      }
      changed = true;
    }
  }

  // Build final rankings
  const rankings: ProposalRanking[] = [];
  let rankCounter = 1;

  for (let i = 0; i < rankedProposals.length; i++) {
    const item = rankedProposals[i];
    if (!item) continue;
    const p = item.proposal;
    const pWarnings = warnings.get(p.id) ?? [];

    if (exclusions.has(p.id)) {
      rankings.push({
        proposalId: p.id,
        proposalName: p.name,
        rank: null,
        score: null,
        scoreLower: null,
        scoreUpper: null,
        coverage: 0,
        status: 'excluded',
        reasonCodes: exclusions.get(p.id)!,
        warnings: pWarnings,
        flags: [],
        criteria: item.criteria,
        explanation: [],
      });
      continue;
    }

    const rank = rankCounter++;
    let status: ProposalRanking['status'] = 'not_funded';
    let reasons: ReasonCode[] = [];

    if (selectedIds.has(p.id)) {
      status = 'selected';
    } else if (deferredIds.has(p.id)) {
      status = 'deferred_unmet_dependency';
      reasons = ['DEP_UNMET_IN_PASS'];
    } else if (notFundedReasons.has(p.id)) {
      status = 'not_funded';
      reasons = notFundedReasons.get(p.id)!;
    }

    rankings.push({
      proposalId: p.id,
      proposalName: p.name,
      rank,
      score: item.score,
      scoreLower: item.scoreLower,
      scoreUpper: item.scoreUpper,
      coverage: item.coverage,
      status,
      reasonCodes: reasons,
      warnings: pWarnings,
      flags: item.flags,
      criteria: item.criteria,
      shortfallMinor: shortfalls.get(p.id),
      tradeoffWinners: tradeoffWinnersMap.get(p.id),
      explanation: [],
    });
  }

  // Portfolio Summary
  const budgetUsedMinor = availableBudget - remainingBudget;
  const budgetUtilizationPct =
    availableBudget > 0n ? round6((Number(budgetUsedMinor) / Number(availableBudget)) * 100) : 0;

  const selectedProposals = rankedProposals.filter((r) => selectedIds.has(r.proposal.id));
  const effortUsedDays = selectedProposals.reduce((acc, r) => acc + r.proposal.effortPersonDays, 0);

  let capacityUtilizationPct: number | null = null;
  if (constraints.capacityPersonDays && constraints.capacityPersonDays > 0) {
    capacityUtilizationPct = round6((effortUsedDays / constraints.capacityPersonDays) * 100);
  }

  const portfolio: PortfolioSummary = {
    selectedIds: Array.from(selectedIds),
    budgetTotalMinor: constraints.budgetTotalMinor,
    contingencyReserveMinor: constraints.contingencyReserveMinor,
    availableBudgetMinor: availableBudget,
    budgetUsedMinor,
    budgetRemainingMinor: remainingBudget,
    budgetUtilizationPct,
    capacityTotalDays: constraints.capacityPersonDays ?? null,
    effortUsedDays,
    capacityRemainingDays:
      constraints.capacityPersonDays !== null && constraints.capacityPersonDays !== undefined
        ? Math.max(0, constraints.capacityPersonDays - effortUsedDays)
        : null,
    capacityUtilizationPct,
    selectedCount: selectedIds.size,
  };

  return {
    rankings,
    portfolio,
  };
}

import type { WarningCode } from './types.js';
