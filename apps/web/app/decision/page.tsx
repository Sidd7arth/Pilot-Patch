// apps/web/app/decision/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  GitCompare,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { BudgetBar } from '../../components/decision/budget-bar';
import { CriterionBar, type CriterionCategory } from '../../components/decision/criterion-bar';
import { CoverageMeter } from '../../components/decision/coverage-meter';
import { ReasonChip } from '../../components/decision/reason-chip';
import { OriginBadge } from '../../components/ui/origin-badge';
import { DisclaimerStrip } from '../../components/ui/disclaimer-strip';
import { api, type DecisionRunDetail, type DecisionRunSummary } from '../../lib/api';

export default function DecisionPage() {
  const [, setRuns] = useState<DecisionRunSummary[]>([]);
  const [currentRun, setCurrentRun] = useState<DecisionRunDetail | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [variants, setVariants] = useState<'both' | 'qloo_informed' | 'baseline'>('both');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await api.listDecisionRuns();
        if (!ignore) {
          setRuns(res.decisionRuns);
          if (res.decisionRuns.length > 0) {
            const latest = res.decisionRuns[0];
            const detail = await api.getDecisionRun(latest!.id);
            setCurrentRun(detail);
            if (detail.rankings.length > 0) {
              setSelectedProposalId(detail.rankings[0]!.proposalId);
            }
          }
        }
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load decision runs');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRunDecision = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.createDecisionRun({
        label: `Strategic Run ${new Date().toLocaleDateString()}`,
        variants,
      });
      const detail = await api.getDecisionRun(res.run.id);
      setCurrentRun(detail);
      setRuns((prev) => [res.run, ...prev]);
      if (detail.rankings.length > 0) {
        setSelectedProposalId(detail.rankings[0]!.proposalId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Decision engine execution failed');
    } finally {
      setRunning(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!currentRun) return;
    try {
      setGeneratingBrief(true);
      const res = await api.generateBrief(currentRun.run.id);
      setBriefId(res.brief.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Brief generation failed');
    } finally {
      setGeneratingBrief(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex items-center justify-center space-x-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Evaluating content portfolio...</span>
      </div>
    );
  }

  const primaryVariant =
    currentRun?.run?.output?.variants?.qloo_informed ?? currentRun?.run?.output?.variants?.baseline;
  const portfolio = primaryVariant?.portfolio;
  const allRankings = currentRun?.rankings ?? [];

  const selectedRankings = allRankings.filter((r) => r.status === 'selected');
  const notFundedRankings = allRankings.filter((r) => r.status === 'not_funded');
  const excludedRankings = allRankings.filter(
    (r) => r.status === 'excluded' || r.status === 'deferred_unmet_dependency',
  );

  const selectedDetail = allRankings.find((r) => r.proposalId === selectedProposalId);
  const inputSnapshot = currentRun?.run?.inputSnapshot as Record<string, unknown> | undefined;
  const proposalsInSnapshot =
    (inputSnapshot?.proposals as Array<{ id: string; name: string }>) ?? [];

  const getProposalName = (id: string) => {
    const p = proposalsInSnapshot.find((item) => item.id === id);
    return p?.name ?? id;
  };

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text">Decision Workspace</h1>
            <OriginBadge origin="system_derived" />
          </div>
          <p className="text-xs text-text-muted mt-1">
            Deterministic multi-criteria prioritization with real Qloo cultural affinity and budget
            constraints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Variants Selector */}
          <div className="flex items-center bg-surface-2 p-0.5 rounded-lg border border-border text-xs">
            <button
              onClick={() => setVariants('both')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                variants === 'both'
                  ? 'bg-surface text-text shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Both Variants
            </button>
            <button
              onClick={() => setVariants('qloo_informed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                variants === 'qloo_informed'
                  ? 'bg-surface text-cultural shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Qloo-Informed
            </button>
            <button
              onClick={() => setVariants('baseline')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                variants === 'baseline'
                  ? 'bg-surface text-text shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Baseline Only
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleRunDecision}
            disabled={running}
            className="bg-accent hover:bg-accent/90 text-white gap-2 font-medium"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Running Engine...' : 'Run Decision Engine'}</span>
          </Button>

          {currentRun && (
            <Link href={`/decision/compare?runId=${currentRun.run.id}`}>
              <Button size="sm" variant="outline" className="gap-2 font-medium">
                <GitCompare className="w-4 h-4 text-accent" />
                <span>Compare & Replan</span>
              </Button>
            </Link>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateBrief}
            disabled={generatingBrief || !currentRun}
            className="gap-2 font-medium"
          >
            <FileText className="w-4 h-4 text-[#7048E8]" />
            <span>{generatingBrief ? 'Generating...' : 'Generate Brief'}</span>
          </Button>

          {briefId && (
            <Link href={`/briefs/${briefId}`}>
              <Button size="sm" className="bg-[#7048E8] text-white gap-1.5 font-medium">
                <span>View Brief</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Budget Bar Card */}
      {portfolio && (
        <div className="p-5 rounded-xl bg-surface border border-border shadow-xs">
          <BudgetBar
            totalBudgetMinor={portfolio.budgetTotalMinor}
            contingencyMinor={portfolio.contingencyReserveMinor}
            selectedProposals={selectedRankings.map((r) => {
              const critCost =
                (r.criteria as Record<string, { notes?: string }>).feasibility?.notes?.match(
                  /\$[\d,]+/,
                )?.[0] ?? '$0';
              const cleanCost = Number(critCost.replace(/[$,]/g, '')) * 100;
              return {
                id: r.proposalId,
                name: getProposalName(r.proposalId),
                rank: r.rank ?? 1,
                costMinor: cleanCost,
              };
            })}
          />
        </div>
      )}

      {/* Main Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Shortlist & Rankings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text flex items-center gap-2">
              <span>Funded Shortlist</span>
              <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                {selectedRankings.length} Selected
              </span>
            </h2>
            <span className="text-xs text-text-muted font-mono">
              Engine v{currentRun?.run.engineVersion} · Hash:{' '}
              {currentRun?.run.inputHash.slice(0, 8)}
            </span>
          </div>

          {/* Selected Proposal Cards */}
          <div className="space-y-2.5">
            {selectedRankings.map((r) => {
              const isSelected = r.proposalId === selectedProposalId;
              const name = getProposalName(r.proposalId);
              const scoreNum = r.score !== null ? (Number(r.score) * 100).toFixed(1) : '—';
              const coverageNum = Math.round(Number(r.coverage) * 100);

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedProposalId(r.proposalId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-accent bg-surface shadow-sm ring-1 ring-accent/30'
                      : 'border-border bg-surface hover:border-accent/40 hover:bg-surface-2/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-accent/10 text-accent font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          #{r.rank}
                        </span>
                        <span className="font-semibold text-text text-sm">{name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                          Selected
                        </span>
                      </div>
                      <p className="text-xs text-text-muted line-clamp-1">
                        {r.explanation?.nodes?.[0]?.text ?? 'Selected into portfolio.'}
                      </p>
                    </div>

                    <div className="text-right font-mono shrink-0 ml-4">
                      <span className="text-base font-bold text-text">{scoreNum}</span>
                      <span className="text-[10px] text-text-muted block">
                        {coverageNum}% coverage
                      </span>
                    </div>
                  </div>

                  {r.reasonCodes && r.reasonCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-border/60">
                      {r.reasonCodes.map((code) => (
                        <ReasonChip key={code} code={code} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Not Funded Section */}
          {notFundedRankings.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Not Funded (Capacity / Budget Limits)
              </h3>
              <div className="space-y-2">
                {notFundedRankings.map((r) => {
                  const isSelected = r.proposalId === selectedProposalId;
                  const name = getProposalName(r.proposalId);
                  const scoreNum = r.score !== null ? (Number(r.score) * 100).toFixed(1) : '—';

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedProposalId(r.proposalId)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-surface ring-1 ring-amber-500/30'
                          : 'border-border bg-surface-2/40 hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-800 font-mono text-xs flex items-center justify-center shrink-0">
                            #{r.rank ?? '—'}
                          </span>
                          <span className="font-medium text-text text-xs">{name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.reasonCodes.map((c) => (
                            <ReasonChip key={c} code={c} />
                          ))}
                          <span className="font-mono text-xs font-semibold text-text">
                            {scoreNum}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible Excluded & Ineligible Section */}
          {excludedRankings.length > 0 && (
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => setShowExcluded(!showExcluded)}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text font-medium"
              >
                {showExcluded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Ineligible & Excluded Initiatives ({excludedRankings.length})</span>
              </button>

              {showExcluded && (
                <div className="space-y-2 pt-2">
                  {excludedRankings.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedProposalId(r.proposalId)}
                      className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-rose-900">
                          {getProposalName(r.proposalId)}
                        </span>
                        <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          Excluded
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {r.reasonCodes.map((c) => (
                          <ReasonChip key={c} code={c} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Pane: Proposal Explanation & Multi-Criteria Bars (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text">
              Multi-Criteria Evaluation
            </h2>
            {selectedDetail && (
              <span className="text-xs font-mono font-bold text-accent">
                Rank #{selectedDetail.rank ?? '—'}
              </span>
            )}
          </div>

          {selectedDetail ? (
            <div className="p-5 rounded-xl bg-surface border border-border shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-text">
                  {getProposalName(selectedDetail.proposalId)}
                </h3>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  ID: {selectedDetail.proposalId}
                </p>
              </div>

              {/* Coverage Whisker Meter */}
              <CoverageMeter
                coverage={Number(selectedDetail.coverage)}
                score={selectedDetail.score !== null ? Number(selectedDetail.score) : null}
                scoreLower={
                  selectedDetail.scoreLower !== null ? Number(selectedDetail.scoreLower) : null
                }
                scoreUpper={
                  selectedDetail.scoreUpper !== null ? Number(selectedDetail.scoreUpper) : null
                }
              />

              {/* Criterion Bars Grouped */}
              <div className="space-y-3 pt-2 border-t border-border">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Criterion Scores & Contributions
                </h4>

                {Object.entries(
                  selectedDetail.criteria as Record<
                    string,
                    {
                      value: number | null;
                      weight: number;
                      contribution: number;
                      available: boolean;
                      notes?: string;
                    }
                  >,
                ).map(([key, crit]) => {
                  let cat: CriterionCategory = 'operational';
                  if (key === 'cultural_relevance') cat = 'cultural';
                  if (key === 'evidence_confidence') cat = 'confidence';
                  if (key === 'commercial_evidence') cat = 'commercial';
                  if (key === 'stakeholder_priority') cat = 'stakeholder';

                  return (
                    <CriterionBar
                      key={key}
                      label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      category={cat}
                      value={crit.value}
                      weight={crit.weight}
                      contribution={crit.contribution}
                      available={crit.available}
                      notes={crit.notes}
                    />
                  );
                })}
              </div>

              {/* Template Rationale Summary */}
              {selectedDetail.explanation?.nodes && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Engine Rationale
                  </h4>
                  <div className="space-y-1.5 text-xs text-text leading-relaxed">
                    {selectedDetail.explanation.nodes.map((node, i) => (
                      <p key={i} className="bg-surface-2 p-2.5 rounded-lg border border-border">
                        {node.text}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* What this does not tell you (DESIGN §5.6) */}
              <div className="p-3 bg-surface-2/60 rounded-lg border border-border text-[11px] text-text-muted space-y-1 leading-normal">
                <div className="flex items-center gap-1.5 font-semibold text-text text-xs">
                  <Info className="w-3.5 h-3.5 text-accent" />
                  <span>What this score does not tell you</span>
                </div>
                <p>
                  Cultural affinity reflects audience taste correlation. It does not predict
                  monetization, conversion, or purchase intent.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-surface border border-border text-center text-xs text-text-muted">
              Select an initiative on the left to inspect multi-criteria scores and rationale.
            </div>
          )}
        </div>
      </div>

      <DisclaimerStrip />
    </div>
  );
}
