// apps/api/src/modules/briefs/brief-builder.ts
import { STANDARD_DISCLAIMER, LIMITATION_DISCLAIMER, checkBannedClaims } from '@patchpilot/shared';
import type { DecisionOutput, ProposalRanking } from '@patchpilot/decision-engine';

export interface BriefInputData {
  run: {
    id: string;
    label?: string | null;
    createdAt: Date | string;
    engineVersion: string;
    signalConfigVersion: string;
    inputHash: string;
  };
  output: DecisionOutput;
  proposals: Array<{
    id: string;
    name: string;
    category: string;
    assumptions?: string[];
    openQuestions?: string[];
  }>;
  references: Array<{
    proposalId: string | null;
    name: string;
    referenceType: string;
    resolvedEntityName?: string | null;
    resolvedQlooId?: string | null;
    resolutionStatus?: string;
  }>;
  signals: Array<{
    proposalId: string;
    marketId: string;
    category: string;
    strengthBand: string;
    basis: string;
    freshness: string;
  }>;
  markets: Array<{
    id: string;
    name: string;
    countryCode?: string | null;
    weight: number;
  }>;
  queries: Array<{
    id: string;
    endpoint: string;
    retrievedAt: Date | string;
    dataOrigin: string;
  }>;
}

export interface GeneratedBrief {
  markdown: string;
  content: Record<string, unknown>;
  bannedClaimViolations: Array<{ pattern: string; matchedText: string }>;
}

export function buildDeterministicBrief(data: BriefInputData): GeneratedBrief {
  const qlooVariant = data.output.variants.qloo_informed ?? data.output.variants.baseline;
  const portfolio = qlooVariant?.portfolio;
  const rankings: ProposalRanking[] = qlooVariant?.rankings ?? [];

  const selectedRankings = rankings.filter((r: ProposalRanking) => r.status === 'selected');
  const notFundedRankings = rankings.filter((r: ProposalRanking) => r.status === 'not_funded');
  const deferredRankings = rankings.filter(
    (r: ProposalRanking) => r.status === 'deferred_unmet_dependency',
  );
  const excludedRankings = rankings.filter((r: ProposalRanking) => r.status === 'excluded');

  const budgetUsedFmt =
    portfolio && portfolio.budgetUsedMinor
      ? `$${(Number(portfolio.budgetUsedMinor) / 100).toLocaleString()}`
      : '$0';
  const budgetAvailFmt =
    portfolio && portfolio.availableBudgetMinor
      ? `$${(Number(portfolio.availableBudgetMinor) / 100).toLocaleString()}`
      : '$0';

  const lines: string[] = [];

  // 1. Header & Title
  lines.push(`# PatchPilot Decision Brief: ${data.run.label ?? 'Strategic Live-Ops Plan'}`);
  lines.push('');
  lines.push(`> [!IMPORTANT]`);
  lines.push(`> **Disclaimer**: ${STANDARD_DISCLAIMER}`);
  lines.push('');
  lines.push(`- **Run ID**: \`${data.run.id}\``);
  lines.push(`- **Date**: ${new Date(data.run.createdAt).toISOString().split('T')[0]}`);
  lines.push(
    `- **Engine Version**: \`${data.run.engineVersion}\` · **Signal Config**: \`${data.run.signalConfigVersion}\``,
  );
  lines.push(`- **Input Hash**: \`${data.run.inputHash}\``);
  lines.push('');

  // 2. Executive Summary
  lines.push('## 1. Executive Summary');
  lines.push('');
  lines.push(
    `PatchPilot evaluated ${rankings.length} proposed initiatives against planning constraints and target market preferences. A total of **${selectedRankings.length} initiatives** were selected into the funded portfolio, committing **${budgetUsedFmt}** of available ${budgetAvailFmt} budget (**${portfolio?.budgetUtilizationPct ?? 0}%** utilization) and **${portfolio?.effortUsedDays ?? 0} person-days** of studio capacity.`,
  );
  lines.push('');

  // 3. Selected Portfolio
  lines.push('## 2. Selected Initiatives (Shortlist)');
  lines.push('');
  lines.push(
    '| Rank | Initiative | Category | Estimated Cost | Effort (Days) | Aggregate Score | Rationale Summary |',
  );
  lines.push('|---|---|---|---|---|---|---|');
  for (const r of selectedRankings) {
    const costFmt = r.criteria?.feasibility?.notes?.match(/\$[\d,]+/)?.[0] ?? '—';
    const explanationText =
      r.explanation?.[0]?.text ?? 'Meets hard constraints and optimizes cultural relevance';
    lines.push(
      `| #${r.rank} | **${r.proposalName}** | \`${r.proposalId}\` | ${costFmt} | ${r.criteria?.feasibility?.notes?.match(/\d+ person-days/)?.[0] ?? '—'} | ${r.score !== null ? r.score.toFixed(4) : '—'} | ${explanationText} |`,
    );
  }
  lines.push('');

  // 4. Cultural Evidence Summary
  lines.push('## 3. Cultural Evidence Summary');
  lines.push('');
  lines.push(`> [!NOTE]`);
  lines.push(`> ${LIMITATION_DISCLAIMER}`);
  lines.push('');
  if (data.signals.length === 0) {
    lines.push('No cultural signals were queried or attached to this run.');
  } else {
    lines.push(
      '| Proposal | Market | Signal Category | Strength Band | Evidence Basis | Freshness |',
    );
    lines.push('|---|---|---|---|---|---|');
    for (const s of data.signals) {
      const p = data.proposals.find((prop) => prop.id === s.proposalId);
      const m = data.markets.find((mkt) => mkt.id === s.marketId);
      lines.push(
        `| ${p?.name ?? s.proposalId} | ${m?.name ?? s.marketId} | \`${s.category}\` | **${s.strengthBand.toUpperCase()}** | ${s.basis} | \`${s.freshness}\` |`,
      );
    }
  }
  lines.push('');

  // 5. Trade-off Analysis
  lines.push('## 4. Trade-off & Capacity Analysis');
  lines.push('');
  if (notFundedRankings.length > 0) {
    lines.push('### Not Funded (Budget / Capacity Constraints)');
    lines.push('');
    for (const nf of notFundedRankings) {
      const shortfallFmt = nf.shortfallMinor
        ? `$${(Number(nf.shortfallMinor) / 100).toLocaleString()}`
        : 'budget limit';
      lines.push(
        `- **${nf.proposalName}** (Rank #${nf.rank ?? '—'}): Not selected due to **${nf.reasonCodes.join(', ')}** (shortfall: ${shortfallFmt}).`,
      );
      if (nf.tradeoffWinners && nf.tradeoffWinners.length > 0) {
        lines.push(
          `  - Budget consumed by higher-priority initiatives: \`${nf.tradeoffWinners.join('`, `')}\``,
        );
      }
    }
    lines.push('');
  }

  if (deferredRankings.length > 0) {
    lines.push('### Deferred (Unmet Dependencies)');
    lines.push('');
    for (const df of deferredRankings) {
      lines.push(
        `- **${df.proposalName}**: Deferred because prerequisite dependencies were not funded or satisfied.`,
      );
    }
    lines.push('');
  }

  if (excludedRankings.length > 0) {
    lines.push('### Ineligible Initiatives');
    lines.push('');
    for (const ex of excludedRankings) {
      lines.push(`- **${ex.proposalName}**: Ineligible due to **${ex.reasonCodes.join(', ')}**.`);
    }
    lines.push('');
  }

  // 6. Assumptions and Open Questions
  lines.push('## 5. Assumptions & Open Questions');
  lines.push('');
  let hasAssumptions = false;
  for (const p of data.proposals) {
    if (p.assumptions && p.assumptions.length > 0) {
      hasAssumptions = true;
      lines.push(`**${p.name} Assumptions:**`);
      for (const a of p.assumptions) {
        lines.push(`- ${a}`);
      }
    }
    if (p.openQuestions && p.openQuestions.length > 0) {
      hasAssumptions = true;
      lines.push(`**${p.name} Open Questions:**`);
      for (const q of p.openQuestions) {
        lines.push(`- [ ] ${q}`);
      }
    }
  }
  if (!hasAssumptions) {
    lines.push('No open questions or assumptions recorded.');
  }
  lines.push('');

  // 7. Provenance & Audit Trail
  lines.push('## 6. Audit Trail & Provenance');
  lines.push('');
  lines.push(`- **Snapshot Hash**: \`${data.run.inputHash}\``);
  lines.push(`- **Total Qloo Evidence Queries**: ${data.queries.length}`);
  if (data.queries.length > 0) {
    lines.push(`- **Sample Queries**:`);
    for (const q of data.queries.slice(0, 5)) {
      lines.push(
        `  - \`${q.endpoint}\` (retrieved: ${new Date(q.retrievedAt).toISOString()}, origin: \`${q.dataOrigin}\`)`,
      );
    }
  }
  lines.push('');

  const markdown = lines.join('\n');
  const violations = checkBannedClaims(markdown);

  const content = {
    title: data.run.label ?? 'Strategic Live-Ops Plan',
    runId: data.run.id,
    portfolioSummary: portfolio,
    selectedProposals: selectedRankings.map((r: ProposalRanking) => ({
      id: r.proposalId,
      name: r.proposalName,
      rank: r.rank,
      score: r.score,
    })),
    tradeoffs: {
      notFundedCount: notFundedRankings.length,
      deferredCount: deferredRankings.length,
      excludedCount: excludedRankings.length,
    },
    provenance: {
      inputHash: data.run.inputHash,
      engineVersion: data.run.engineVersion,
      signalConfigVersion: data.run.signalConfigVersion,
      queryCount: data.queries.length,
    },
  };

  return {
    markdown,
    content,
    bannedClaimViolations: violations,
  };
}
