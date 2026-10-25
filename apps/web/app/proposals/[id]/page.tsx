// apps/web/app/proposals/[id]/page.tsx
'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../../../components/ui/origin-badge';
import { SignalChip } from '../../../components/ui/signal-chip';
import { DisclaimerStrip } from '../../../components/ui/disclaimer-strip';
import { api, type ProposalData } from '../../../lib/api';

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const proposalId = resolvedParams.id;

  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'references' | 'evidence' | 'dependencies' | 'analogs'
  >('references');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await api.getProposal(proposalId);
      setProposal(res.proposal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load proposal');
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await api.getProposal(proposalId);
        if (!ignore) setProposal(res.proposal);
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load proposal');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, [proposalId]);

  const handleRefreshEvidence = async () => {
    if (!proposal) return;
    try {
      setRefreshing(true);
      setActionMessage('Querying Qloo API to derive cultural signals...');
      const res = await api.refreshProposalEvidence(proposal.workspaceId, proposal.id);
      setActionMessage(
        `Updated! ${res.signalsCreated} cultural signals derived from live Qloo calls.`,
      );
      await loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      setActionMessage(`Error: ${err instanceof Error ? err.message : 'Evidence refresh failed'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleChooseCandidate = async (
    referenceId: string,
    candidate: { id: string; name: string; type: string },
  ) => {
    try {
      setActionMessage(`Resolving "${candidate.name}" with Qloo entity ID ${candidate.id}...`);
      await api.chooseResolution(referenceId, candidate);
      setActionMessage(`Resolved entity updated.`);
      await loadData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      setActionMessage(`Resolution error: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex items-center justify-center space-x-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading proposal details...</span>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-lg font-semibold text-text">Proposal Not Found</h2>
        <Link href="/proposals">
          <Button size="sm" variant="outline">
            Return to Proposals
          </Button>
        </Link>
      </div>
    );
  }

  const costFmt = `$${(Number(proposal.estimatedCostMinor) / 100).toLocaleString()}`;
  const refs = proposal.references ?? [];
  const signals = proposal.signals ?? [];
  const deps = proposal.dependencies ?? [];
  const analogs = proposal.analogs ?? [];

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/proposals"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Proposals</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleRefreshEvidence}
            disabled={refreshing}
            className="bg-[#7048E8] hover:bg-[#7048E8]/90 text-white gap-2 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Querying Qloo...' : 'Refresh Qloo Evidence'}</span>
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-surface-2 border border-border rounded-lg text-xs font-mono text-text flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#7048E8] shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Proposal Summary Card */}
      <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-text">{proposal.name}</h1>
              <OriginBadge origin={proposal.dataOrigin} />
            </div>
            <p className="text-xs text-text-muted capitalize mt-1">
              Category:{' '}
              <span className="text-text font-medium">{proposal.category.replace(/_/g, ' ')}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
              <span className="text-text-muted block text-[10px] uppercase font-semibold">
                Cost
              </span>
              <span className="text-base font-bold text-text">{costFmt}</span>
            </div>
            <div className="bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
              <span className="text-text-muted block text-[10px] uppercase font-semibold">
                Effort
              </span>
              <span className="text-base font-bold text-text">
                {proposal.effortPersonDays ?? '—'}d
              </span>
            </div>
            <div className="bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
              <span className="text-text-muted block text-[10px] uppercase font-semibold">
                Confidence
              </span>
              <span className="text-base font-bold text-accent">
                {proposal.scheduleConfidence}/5
              </span>
            </div>
          </div>
        </div>

        {proposal.description && (
          <p className="text-xs text-text-muted leading-relaxed">{proposal.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('references')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'references'
              ? 'border-[#7048E8] text-[#7048E8]'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Cultural References & Resolution ({refs.length})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-[#7048E8] text-[#7048E8]'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Qloo Evidence & Signals ({signals.length})
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Operational Overview
        </button>
        <button
          onClick={() => setActiveTab('dependencies')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'dependencies'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Dependencies ({deps.length})
        </button>
        <button
          onClick={() => setActiveTab('analogs')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'analogs'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Historical Analogs ({analogs.length})
        </button>
      </div>

      {/* Tab: References & Resolution (DESIGN §5.4) */}
      {activeTab === 'references' && (
        <div className="space-y-4">
          <div className="text-xs text-text-muted">
            Cultural themes and audience anchors mapped to Qloo entities. User text and
            Qloo-resolved entities are displayed in visibly separate blocks.
          </div>

          <div className="space-y-3">
            {refs.map((ref) => (
              <div
                key={ref.id}
                className="p-5 rounded-xl bg-surface border border-border shadow-xs space-y-4"
              >
                {/* Top row: User input block */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted block">
                      User-Supplied Input ({ref.role})
                    </span>
                    <span className="text-base font-semibold text-text">{ref.label}</span>
                    {ref.entityTypeHint && (
                      <span className="text-xs text-text-muted block">
                        Entity Type Hint:{' '}
                        <code className="text-xs font-mono">{ref.entityTypeHint}</code>
                      </span>
                    )}
                  </div>
                  <OriginBadge origin={ref.dataOrigin} />
                </div>

                {/* Bottom row: Qloo Resolved Entity Block (Visibly distinct per DESIGN §5.4) */}
                <div className="p-4 rounded-lg bg-[#7048E8]/5 border border-[#7048E8]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#7048E8]">
                      Qloo API Entity Resolution
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        ref.resolutionStatus === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ref.resolutionStatus === 'ambiguous'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ref.resolutionStatus}
                    </span>
                  </div>

                  {ref.resolutionStatus === 'resolved' && (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-semibold text-text">{ref.resolvedEntityName}</span>
                        <span className="text-text-muted ml-2">({ref.resolvedEntityType})</span>
                      </div>
                      <span className="text-text-muted text-[11px]">
                        ID: {ref.resolvedEntityId}
                      </span>
                    </div>
                  )}

                  {/* Ambiguity Chooser per DESIGN §5.4 */}
                  {ref.resolutionStatus === 'ambiguous' && ref.ambiguityCandidates && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-amber-800">
                        Multiple entities found. Select the intended cultural reference:
                      </p>
                      <div className="space-y-1.5">
                        {ref.ambiguityCandidates.map((cand) => (
                          <div
                            key={cand.id}
                            className="flex items-center justify-between p-2 rounded bg-surface border border-border text-xs"
                          >
                            <div>
                              <span className="font-semibold text-text">{cand.name}</span>
                              <span className="text-text-muted ml-2 font-mono">({cand.type})</span>
                              <span className="text-[10px] text-text-muted ml-2 font-mono">
                                ID: {cand.id}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChooseCandidate(ref.id, cand)}
                              className="h-6 text-xs px-2 gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Choose</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Evidence (DESIGN §5.4) */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="text-xs text-text-muted">
            Observed cultural affinity signals from official Qloo queries across target markets.
          </div>

          {signals.length === 0 ? (
            <div className="p-8 bg-surface rounded-xl border border-border text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#7048E8] mx-auto" />
              <p className="text-sm font-medium text-text">No Qloo signals derived yet</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Click Refresh Evidence to query the live Qloo API using this proposal&apos;s
                cultural references.
              </p>
              <Button
                size="sm"
                onClick={handleRefreshEvidence}
                disabled={refreshing}
                className="bg-[#7048E8] text-white"
              >
                Query Qloo Now
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-xl bg-surface overflow-hidden">
              {signals.map((sig) => (
                <div key={sig.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SignalChip direction={sig.direction} strengthBand={sig.strengthBand} />
                      <span className="font-mono text-xs text-text font-semibold uppercase bg-surface-2 px-1.5 py-0.5 rounded">
                        Strategy {sig.strategy}
                      </span>
                      <OriginBadge
                        origin={sig.freshness === 'live' ? 'live_qloo' : 'cached_qloo'}
                      />
                    </div>
                    <p className="text-xs text-text-muted">{sig.basis}</p>
                  </div>

                  {sig.strengthValue && (
                    <div className="text-right font-mono">
                      <span className="text-sm font-bold text-text">
                        {(Number(sig.strengthValue) * 100).toFixed(1)}%
                      </span>
                      <span className="block text-[10px] text-text-muted">Affinity Score</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4 bg-surface p-6 rounded-xl border border-border">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Assumptions
            </h3>
            <ul className="list-disc list-inside text-xs text-text-muted space-y-1">
              {proposal.assumptions?.length ? (
                proposal.assumptions.map((a, i) => <li key={i}>{a}</li>)
              ) : (
                <li>No recorded assumptions</li>
              )}
            </ul>
          </div>

          <div className="space-y-2 pt-3 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Open Questions
            </h3>
            <ul className="list-disc list-inside text-xs text-text-muted space-y-1">
              {proposal.openQuestions?.length ? (
                proposal.openQuestions.map((q, i) => <li key={i}>{q}</li>)
              ) : (
                <li>No open questions recorded</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Dependencies */}
      {activeTab === 'dependencies' && (
        <div className="space-y-3 bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Prerequisites & Constraints
          </h3>
          {deps.length === 0 ? (
            <p className="text-xs text-text-muted">
              No dependencies registered for this initiative.
            </p>
          ) : (
            <div className="space-y-2">
              {deps.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-surface-2 rounded-lg border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-text capitalize">
                      {d.kind} Dependency:{' '}
                    </span>
                    <span className="text-text-muted">{d.description ?? d.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.isHardBlocking && (
                      <span className="text-[10px] font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Hard Blocking
                      </span>
                    )}
                    <span className="font-mono text-xs capitalize text-text font-medium">
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Analogs */}
      {activeTab === 'analogs' && (
        <div className="space-y-3 bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Historical Studio Analogs
          </h3>
          {analogs.length === 0 ? (
            <p className="text-xs text-text-muted">
              No historical analogs linked. Commercial evidence criterion will register as
              &apos;Unavailable&apos; (not scored).
            </p>
          ) : (
            <div className="space-y-2">
              {analogs.map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-surface-2 rounded-lg border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-text">Analog {a.historicalRecordId}</span>
                    <p className="text-[11px] text-text-muted">
                      {a.notes ?? 'Performance reference'}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-semibold text-text">
                      Weight: {Number(a.relevanceWeight).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DisclaimerStrip />
    </div>
  );
}
