// packages/decision-engine/src/eligibility.ts
import type {
  DecisionConstraints,
  DecisionProposal,
  DecisionDependency,
  ReasonCode,
  WarningCode,
} from './types.js';

export interface EligibilityResult {
  eligibleProposals: DecisionProposal[];
  exclusions: Map<string, ReasonCode[]>;
  warnings: Map<string, WarningCode[]>;
}

export function evaluateEligibility(
  proposals: DecisionProposal[],
  constraints: DecisionConstraints,
  dependencies: DecisionDependency[],
): EligibilityResult {
  const exclusions = new Map<string, ReasonCode[]>();
  const warnings = new Map<string, WarningCode[]>();

  const availableBudget = constraints.budgetTotalMinor - constraints.contingencyReserveMinor;

  // 1. Initial pass: evaluate direct hard constraints & warnings per proposal
  for (const p of proposals) {
    const reasons: ReasonCode[] = [];
    const pWarnings: WarningCode[] = [];

    // HC_STATUS_INELIGIBLE
    if (p.status === 'rejected' || p.status === 'shipped') {
      reasons.push('HC_STATUS_INELIGIBLE');
    }

    // HC_COST_EXCEEDS_BUDGET
    if (p.estimatedCostMinor > availableBudget) {
      reasons.push('HC_COST_EXCEEDS_BUDGET');
    }

    // Capacity checks
    if (constraints.capacityPersonDays !== null && constraints.capacityPersonDays !== undefined) {
      if (p.effortPersonDays > constraints.capacityPersonDays) {
        if (constraints.capacityEnforcement === 'hard') {
          reasons.push('HC_EFFORT_EXCEEDS_CAPACITY');
        } else {
          pWarnings.push('WARN_EFFORT_EXCEEDS_CAPACITY');
        }
      }
    }

    // Horizon window checks
    const outsideHorizon =
      p.releaseWindowStart < constraints.horizonStart ||
      p.releaseWindowEnd > constraints.horizonEnd;

    if (outsideHorizon) {
      if (constraints.horizonEnforcement === 'hard') {
        reasons.push('HC_OUTSIDE_HORIZON');
      } else {
        pWarnings.push('WARN_OUTSIDE_HORIZON');
      }
    }

    // Direct dependency checks (blocked dependencies)
    const pDeps = dependencies.filter((d) => d.proposalId === p.id);
    const hasBlockedHardDep = pDeps.some((d) => d.status === 'blocked' && d.isHardBlocking);
    if (hasBlockedHardDep) {
      reasons.push('HC_BLOCKED_DEPENDENCY');
    }

    if (reasons.length > 0) {
      exclusions.set(p.id, reasons);
    }
    if (pWarnings.length > 0) {
      warnings.set(p.id, pWarnings);
    }
  }

  // 2. Cascade exclusion pass to fixpoint (HC_DEPENDENCY_EXCLUDED)
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of proposals) {
      if (exclusions.has(p.id)) continue;

      const pInternalDeps = dependencies.filter(
        (d) => d.proposalId === p.id && d.kind === 'internal' && d.dependsOnProposalId,
      );

      for (const dep of pInternalDeps) {
        const targetId = dep.dependsOnProposalId!;
        if (exclusions.has(targetId)) {
          exclusions.set(p.id, ['HC_DEPENDENCY_EXCLUDED']);
          changed = true;
          break;
        }
      }
    }
  }

  const eligibleProposals = proposals.filter((p) => !exclusions.has(p.id));

  return {
    eligibleProposals,
    exclusions,
    warnings,
  };
}
