// apps/web/app/decision/compare/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GitCompare,
  Sliders,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Play,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../../../components/ui/origin-badge';
import { DisclaimerStrip } from '../../../components/ui/disclaimer-strip';
import {
  api,
  type ComparisonAttribution,
  type RunDiff,
  type DecisionRunSummary,
} from '../../../lib/api';

function CompareContent() {
  const searchParams = useSearchParams();
  const initialRunId = searchParams.get('runId');

  const [activeTab, setActiveTab] = useState<'compare' | 'replan'>('compare');
  const [runs, setRuns] = useState<DecisionRunSummary[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRunId);
  const [attributions, setAttributions] = useState<ComparisonAttribution[]>([]);
  const [diff, setDiff] = useState<RunDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [replanRunning, setReplanRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replan overrides
  const [overrideBudget, setOverrideBudget] = useState('150000');
  const [overrideCapacity, setOverrideCapacity] = useState('300');
  const [weightRelevance, setWeightRelevance] = useState(0.4);
  const [weightFeasibility, setWeightFeasibility] = useState(0.2);

  const loadRunsAndComparison = async (targetId?: string) => {
    try {
      setError(null);
      const rList = await api.listDecisionRuns();
      setRuns(rList.decisionRuns);

      const target = targetId ?? selectedRunId ?? rList.decisionRuns[0]?.id;
      if (target) {
        setSelectedRunId(target);
        const compRes = await api.getComparison(target);
        setAttributions(compRes.comparison);

        // Check if run has diffFromParent
        const runDetail = await api.getDecisionRun(target);
        if (runDetail.run.diffFromParent) {
          setDiff(runDetail.run.diffFromParent);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison data');
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const rList = await api.listDecisionRuns();
        if (!ignore) {
          setRuns(rList.decisionRuns);
          const target = initialRunId ?? rList.decisionRuns[0]?.id;
          if (target) {
            setSelectedRunId(target);
            const compRes = await api.getComparison(target);
            setAttributions(compRes.comparison);

            const runDetail = await api.getDecisionRun(target);
            if (runDetail.run.diffFromParent) {
              setDiff(runDetail.run.diffFromParent);
            }
          }
        }
      } catch (err: unknown) {
        if (!ignore)
          setError(err instanceof Error ? err.message : 'Failed to load comparison data');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, [initialRunId]);

  const handleReplan = async () => {
    if (!selectedRunId) return;
    try {
      setReplanRunning(true);
      setError(null);
      const budgetMinor = Math.round(Number(overrideBudget) * 100).toString();

      const res = await api.replanDecisionRun(selectedRunId, {
        label: `Re-plan (Budget $${Number(overrideBudget).toLocaleString()})`,
        constraintsOverride: {
          budgetTotalMinor: budgetMinor,
          capacityPersonDays: Number(overrideCapacity),
        },
        weights: {
          cultural_relevance: weightRelevance,
          feasibility: weightFeasibility,
          evidence_confidence: 0.15,
          commercial_evidence: 0.15,
          stakeholder_priority: 0.1,
        },
      });

      if (res.diffFromParent) {
        setDiff(res.diffFromParent);
      }
      setSelectedRunId(res.run.id);
      await loadRunsAndComparison(res.run.id);
      setActiveTab('replan');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Re-plan execution failed');
    } finally {
      setReplanRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex items-center justify-center space-x-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading variant comparison...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">Compare & Replan</h1>
            <OriginBadge origin="system_derived" />
          </div>
          <p className="text-xs text-text-muted mt-1">
            Attribution analysis between Baseline and Qloo-informed variants, plus interactive
            scenario replanning.
          </p>
        </div>

        {runs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-medium">Select Run:</span>
            <select
              value={selectedRunId ?? ''}
              onChange={(e) => {
                setSelectedRunId(e.target.value);
                loadRunsAndComparison(e.target.value);
              }}
              className="text-xs font-mono bg-surface border border-border rounded-lg px-2.5 py-1.5 outline-none text-text"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label ?? r.id.slice(0, 8)} ({new Date(r.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border space-x-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'compare'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Baseline vs Qloo-Informed Comparison</span>
        </button>
        <button
          onClick={() => setActiveTab('replan')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'replan'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Scenario Re-planning & Live Diff</span>
        </button>
      </div>

      {/* Tab 1: Compare (Baseline vs Qloo-informed per DESIGN §5.8) */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          {/* Persistent Banner per DESIGN §5.8 */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Important Interpretation Notice:</span>
              Different ranking does not guarantee a better commercial outcome. The Qloo-informed
              view incorporates cultural-affinity evidence across target geographies, which has not
              been validated against real revenue or player conversion.
            </div>
          </div>

          <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 border-b border-border text-text-muted uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Initiative Name</th>
                    <th className="py-3 px-4 text-center">Baseline Rank</th>
                    <th className="py-3 px-4 text-center">Qloo-Informed Rank</th>
                    <th className="py-3 px-4 text-center">Rank Delta</th>
                    <th className="py-3 px-4">Selection Impact</th>
                    <th className="py-3 px-4">Primary Attribution Drivers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attributions.map((att) => {
                    const rankDelta = att.rankDelta ?? 0;
                    const movedUp = rankDelta > 0;
                    const movedDown = rankDelta < 0;

                    return (
                      <tr key={att.proposalId} className="hover:bg-surface-2/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-text text-sm">
                            {att.proposalName}
                          </span>
                          <span className="block text-[10px] font-mono text-text-muted">
                            {att.proposalId}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-sm">
                          {att.baselineRank ? `#${att.baselineRank}` : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-sm font-bold text-accent">
                          {att.qlooRank ? `#${att.qlooRank}` : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono">
                          {movedUp && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                              <ArrowUpRight className="w-3.5 h-3.5" />+{rankDelta}
                            </span>
                          )}
                          {movedDown && (
                            <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              {rankDelta}
                            </span>
                          )}
                          {rankDelta === 0 && <span className="text-text-muted">0</span>}
                        </td>

                        <td className="py-3.5 px-4">
                          {att.statusChanged ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-800">
                              {att.baselineStatus} → {att.qlooStatus}
                            </span>
                          ) : (
                            <span className="text-text-muted font-mono capitalize">
                              {att.qlooStatus.replace(/_/g, ' ')}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {att.drivers.map((d: string, i: number) => (
                              <span
                                key={i}
                                className="text-[10px] font-mono bg-surface-2 px-2 py-0.5 rounded border border-border text-text"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Replan & Live Diff (DESIGN §5.7) */}
      {activeTab === 'replan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Scenario Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5 bg-surface p-6 rounded-xl border border-border shadow-xs">
            <div>
              <h3 className="text-sm font-semibold text-text">Interactive Scenario Overrides</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Adjust constraints to generate a branched decision run linked to this parent run.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-text">Budget Cap ($)</label>
                <input
                  type="number"
                  value={overrideBudget}
                  onChange={(e) => setOverrideBudget(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                />
                <span className="text-[10px] text-text-muted">
                  Test constrained scenarios (e.g. $150,000 budget crunch)
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text">Studio Capacity (Person-Days)</label>
                <input
                  type="number"
                  value={overrideCapacity}
                  onChange={(e) => setOverrideCapacity(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between font-semibold text-text">
                  <span>Cultural Relevance Weight</span>
                  <span className="font-mono text-accent">
                    {(weightRelevance * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={weightRelevance}
                  onChange={(e) => setWeightRelevance(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold text-text">
                  <span>Feasibility Weight</span>
                  <span className="font-mono text-accent">
                    {(weightFeasibility * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={weightFeasibility}
                  onChange={(e) => setWeightFeasibility(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <Button
                size="sm"
                onClick={handleReplan}
                disabled={replanRunning}
                className="w-full bg-accent hover:bg-accent/90 text-white gap-2 font-medium"
              >
                <Play
                  className={`w-3.5 h-3.5 fill-current ${replanRunning ? 'animate-spin' : ''}`}
                />
                <span>{replanRunning ? 'Executing Re-plan...' : 'Execute Re-plan Scenario'}</span>
              </Button>
            </div>
          </div>

          {/* Right: Live Diff View (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text">
                Differential Analysis vs Parent Run
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Pure deterministic comparison of shortlist inclusions and rank adjustments.
              </p>
            </div>

            {diff ? (
              <div className="space-y-4">
                {/* Summary Sentence Box */}
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl text-xs text-text leading-relaxed">
                  <span className="font-bold text-accent block uppercase text-[10px] tracking-wider mb-1">
                    Differential Summary
                  </span>
                  {diff.summarySentence}
                </div>

                {/* Entered and Left Shortlist Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Entered Shortlist ({diff.enteredShortlist.length})</span>
                    </span>
                    {diff.enteredShortlist.length > 0 ? (
                      <ul className="text-xs text-emerald-950 font-medium space-y-1">
                        {diff.enteredShortlist.map((name: string, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-text-muted italic">No new initiatives entered</p>
                    )}
                  </div>

                  <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                      <span>Left Shortlist ({diff.leftShortlist.length})</span>
                    </span>
                    {diff.leftShortlist.length > 0 ? (
                      <ul className="text-xs text-rose-950 font-medium space-y-1">
                        {diff.leftShortlist.map((name: string, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-text-muted italic">No initiatives displaced</p>
                    )}
                  </div>
                </div>

                {/* Rank Changes Table */}
                {diff.rankChanges.length > 0 && (
                  <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-xs">
                    <div className="p-3 bg-surface-2 border-b border-border text-xs font-semibold text-text">
                      Rank Movement ({diff.rankChanges.length})
                    </div>
                    <div className="divide-y divide-border text-xs">
                      {diff.rankChanges.map(
                        (rc: { proposalId: string; proposalName: string; reason: string }) => (
                          <div
                            key={rc.proposalId}
                            className="p-3 flex items-center justify-between"
                          >
                            <span className="font-semibold text-text">{rc.proposalName}</span>
                            <span className="text-text-muted font-mono">{rc.reason}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 bg-surface rounded-xl border border-border text-center space-y-3 text-xs text-text-muted">
                <Sliders className="w-8 h-8 text-text-muted mx-auto" />
                <p className="font-medium text-text">No Diff Available Yet</p>
                <p className="max-w-xs mx-auto">
                  Adjust budget or weights on the left and click &apos;Execute Re-plan
                  Scenario&apos; to generate a real-time delta.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <DisclaimerStrip />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-text-muted">Loading compare screen...</div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
