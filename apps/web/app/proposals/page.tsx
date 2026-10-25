// apps/web/app/proposals/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../../components/ui/origin-badge';
import { SignalChip } from '../../components/ui/signal-chip';
import { DisclaimerStrip } from '../../components/ui/disclaimer-strip';
import { api, type ProposalData, type WorkspaceData } from '../../lib/api';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Add proposal modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('seasonal_event');
  const [newCost, setNewCost] = useState('80000');
  const [newEffort, setNewEffort] = useState('100');
  const [newStart, setNewStart] = useState('2027-02-01');
  const [newEnd, setNewEnd] = useState('2027-03-15');
  const [newDesc, setNewDesc] = useState('');

  const loadData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([api.getProposals(), api.getWorkspace()]);
      setProposals(pRes.proposals);
      setWorkspace(wRes.workspace);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [pRes, wRes] = await Promise.all([api.getProposals(), api.getWorkspace()]);
        if (!ignore) {
          setProposals(pRes.proposals);
          setWorkspace(wRes.workspace);
        }
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load proposals');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRefreshEvidence = async (proposalId: string) => {
    if (!workspace) return;
    try {
      setRefreshing(true);
      setActionMessage(`Querying Qloo API for proposal ${proposalId}...`);
      const res = await api.refreshProposalEvidence(workspace.id, proposalId);
      setActionMessage(`Qloo evidence refreshed: ${res.signalsCreated} cultural signals updated.`);
      await loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      setActionMessage(`Error refreshing evidence: ${err instanceof Error ? err.message : 'Failed'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProposal({
        name: newName,
        category: newCategory,
        description: newDesc,
        estimatedCostMinor: (Math.round(Number(newCost) * 100)).toString(),
        currency: 'USD',
        effortPersonDays: Number(newEffort),
        releaseWindowStart: newStart,
        releaseWindowEnd: newEnd,
        scheduleConfidence: 4,
        stakeholderPriority: 3,
        assumptions: ['Studio art team capacity committed'],
        openQuestions: ['License sign-off timeline'],
      });
      setShowAddModal(false);
      setNewName('');
      setNewDesc('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal');
    }
  };

  const filtered = proposals.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex items-center justify-center space-x-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading content initiatives...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">Content Proposals</h1>
            <span className="text-xs font-mono font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {proposals.length} Initiatives
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Live-service features and events evaluated against budget limits and Qloo cultural affinity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-accent hover:bg-accent/90 text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Proposal</span>
          </Button>

          <Link href="/decision">
            <Button size="sm" variant="outline" className="gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-[#7048E8]" />
              <span>Open Decision Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-surface-2 border border-border rounded-lg text-xs font-mono text-text flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-accent animate-spin" />
            {actionMessage}
          </span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-text-muted hover:text-text text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar / Search */}
      <div className="flex items-center justify-between gap-4 bg-surface p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search proposals by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent outline-none text-text placeholder:text-text-muted"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-surface-2 border border-border rounded px-2 py-1 outline-none text-text"
          >
            <option value="all">All Categories</option>
            <option value="seasonal_event">Seasonal Event</option>
            <option value="entertainment_collab">Entertainment Collab</option>
            <option value="themed_bundle">Themed Bundle</option>
            <option value="regional_content">Regional Content</option>
            <option value="character_skin">Character Skin</option>
          </select>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-border text-text-muted uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Initiative Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Estimated Cost</th>
                <th className="py-3 px-4 text-right">Effort</th>
                <th className="py-3 px-4">Release Window</th>
                <th className="py-3 px-4">Cultural Signals</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const costFmt = `$${(Number(p.estimatedCostMinor) / 100).toLocaleString()}`;
                const signals = p.signals ?? [];
                const topSignal = signals.find((s) => s.direction === 'supports');

                return (
                  <tr key={p.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text text-sm flex items-center gap-2">
                        <Link
                          href={`/proposals/${p.id}`}
                          className="hover:text-accent transition-colors flex items-center gap-1.5"
                        >
                          <span>{p.name}</span>
                          <ExternalLink className="w-3 h-3 text-text-muted" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <OriginBadge origin={p.dataOrigin} />
                        {p.dependencies && p.dependencies.length > 0 && (
                          <span className="text-[10px] text-text-muted font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                            {p.dependencies.length} dep{p.dependencies.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 capitalize text-text-muted">
                      {p.category.replace(/_/g, ' ')}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-text">
                      {costFmt}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-text-muted">
                      {p.effortPersonDays ?? '—'}d
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-text-muted">
                      {p.releaseWindowStart && p.releaseWindowEnd ? (
                        <span>
                          {p.releaseWindowStart.slice(5)} → {p.releaseWindowEnd.slice(5)}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {topSignal ? (
                        <SignalChip
                          direction={topSignal.direction}
                          strengthBand={topSignal.strengthBand}
                        />
                      ) : (
                        <span className="text-text-muted text-[11px] italic">No signals yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRefreshEvidence(p.id)}
                        disabled={refreshing}
                        className="h-7 text-xs px-2 text-text-muted hover:text-accent"
                        title="Query live Qloo API for this proposal"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="sr-only">Refresh Evidence</span>
                      </Button>
                      <Link href={`/proposals/${p.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Proposal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-base text-text">Add Content Initiative</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-text">Initiative Title</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                  placeholder="e.g. Cyber Samurai Skin Collection"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-text">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                  >
                    <option value="seasonal_event">Seasonal Event</option>
                    <option value="entertainment_collab">Entertainment Collab</option>
                    <option value="themed_bundle">Themed Bundle</option>
                    <option value="regional_content">Regional Content</option>
                    <option value="character_skin">Character Skin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text">Estimated Cost ($)</label>
                  <input
                    type="number"
                    required
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-text">Effort (Person-Days)</label>
                  <input
                    type="number"
                    value={newEffort}
                    onChange={(e) => setNewEffort(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text">Start Date</label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text">End Date</label>
                  <input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface-2 outline-none focus:border-accent"
                  placeholder="Creative concept and scope..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-accent text-white">
                  Create Initiative
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DisclaimerStrip />
    </div>
  );
}
