// apps/web/app/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Play,
  PlusCircle,
  CheckCircle2,
  Sliders,
  Layers,
  Search,
  GitCompare,
  Activity,
  Database,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../../components/ui/origin-badge';
import { DisclaimerStrip } from '../../components/ui/disclaimer-strip';
import { api, type WorkspaceData } from '../../lib/api';

export default function WorkspaceOverviewPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingBlank, setLoadingBlank] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrent() {
      try {
        const res = await api.getWorkspace();
        setWorkspace(res.workspace);
      } catch {
        // No active workspace session yet
      }
    }
    loadCurrent();
  }, []);

  const handleStartDemo = async () => {
    try {
      setLoadingDemo(true);
      setStatusMessage('Creating workspace and seeding Appendix A Ember Arena domain data...');
      await api.createWorkspace({ isDemo: true, seedDemo: true });
      setStatusMessage('Workspace ready! Redirecting to Proposals...');
      router.push('/app/proposals');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace';
      setStatusMessage(`Error: ${msg}`);
      setLoadingDemo(false);
    }
  };

  const handleStartBlank = async () => {
    try {
      setLoadingBlank(true);
      setStatusMessage('Creating empty workspace session...');
      await api.createWorkspace({ isDemo: false, seedDemo: false });
      router.push('/app/game');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace';
      setStatusMessage(`Error: ${msg}`);
      setLoadingBlank(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* SEC-34 Security Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-surface border border-border text-xs text-text-muted">
        <ShieldAlert className="w-4 h-4 text-warn shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-text">Workspace Security & Privacy:</span> Sessions
          are ephemeral and expire after 7 days. Never enter confidential game IP or unreleased
          source code. All cultural affinity evidence is retrieved live from the official Qloo API.
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#7865F5]/10 text-[#7865F5] border border-[#7865F5]/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PatchPilot Decision Workspace</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Workspace Overview</h1>
          <p className="text-sm text-text-muted mt-1 max-w-2xl">
            Prioritize live-ops content updates using Qloo cultural intelligence, production
            constraints, and deterministic portfolio optimization.
          </p>
        </div>

        {workspace && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface border border-border text-xs shrink-0">
            <Database className="w-4 h-4 text-cultural" />
            <div>
              <div className="font-semibold text-text">
                {workspace.game?.title || 'Active Session'}
              </div>
              <div className="text-[11px] text-text-muted">
                {workspace.proposalCount} proposals · {workspace.quota?.callsRemaining ?? 150} calls
                remaining
              </div>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="p-3 bg-surface-2 rounded-lg border border-border text-xs font-mono text-text flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-ok shrink-0 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Quick Action Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-xl bg-surface border border-border space-y-4 shadow-sm hover:border-[#7865F5]/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-[#7865F5]/10 text-[#7865F5] flex items-center justify-center font-bold">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text">Start with Seeded Demo</h3>
              <OriginBadge origin="synthetic_demo" />
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              Explore Ember Arena with 6 candidate proposals across US, Japan, Brazil, and India,
              with verified Qloo cultural affinity signals and budget trade-offs.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleStartDemo}
            disabled={loadingDemo || loadingBlank}
            className="bg-[#6754E8] hover:bg-[#6754E8]/90 text-white gap-2 font-medium"
          >
            <span>{loadingDemo ? 'Initializing...' : 'Launch Demo Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 rounded-xl bg-surface border border-border space-y-4 shadow-sm hover:border-cultural/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-cultural/10 text-cultural flex items-center justify-center font-bold">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text">Start Blank Workspace</h3>
              <OriginBadge origin="user_supplied" />
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              Configure your studio title, select target geographic markets, enter capacity and
              budget constraints, and input custom content proposals.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartBlank}
            disabled={loadingDemo || loadingBlank}
            className="gap-2 font-medium"
          >
            <span>{loadingBlank ? 'Creating...' : 'Create Blank Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Workspace Modules & Planning Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Link
            href="/app/game"
            className="p-4 rounded-lg bg-surface border border-border hover:border-cultural/40 transition-all group flex items-start gap-3"
          >
            <div className="p-2 rounded bg-surface-2 text-cultural group-hover:scale-105 transition-transform">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text flex items-center gap-1.5">
                <span>Game & Setup</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cultural" />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Game title, genre, target markets, budget caps, and release horizons.
              </p>
            </div>
          </Link>

          <Link
            href="/app/proposals"
            className="p-4 rounded-lg bg-surface border border-border hover:border-cultural/40 transition-all group flex items-start gap-3"
          >
            <div className="p-2 rounded bg-surface-2 text-cultural group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text flex items-center gap-1.5">
                <span>Content Proposals</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cultural" />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Candidate update initiatives, production costs, effort, and cultural themes.
              </p>
            </div>
          </Link>

          <Link
            href="/app/evidence"
            className="p-4 rounded-lg bg-surface border border-border hover:border-cultural/40 transition-all group flex items-start gap-3"
          >
            <div className="p-2 rounded bg-surface-2 text-cultural group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text flex items-center gap-1.5">
                <span>Evidence Explorer</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cultural" />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Raw Qloo taste graph queries, affinity scores, entity resolution, and provenance.
              </p>
            </div>
          </Link>

          <Link
            href="/app/decisions"
            className="p-4 rounded-lg bg-surface border border-border hover:border-cultural/40 transition-all group flex items-start gap-3"
          >
            <div className="p-2 rounded bg-surface-2 text-cultural group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text flex items-center gap-1.5">
                <span>Decision Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cultural" />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Deterministic prioritization run, funded shortlist, budget meters, and score
                breakdowns.
              </p>
            </div>
          </Link>

          <Link
            href="/app/scenarios"
            className="p-4 rounded-lg bg-surface border border-border hover:border-cultural/40 transition-all group flex items-start gap-3"
          >
            <div className="p-2 rounded bg-surface-2 text-cultural group-hover:scale-105 transition-transform">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text flex items-center gap-1.5">
                <span>Compare & Replan</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cultural" />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Scenario replanning, budget overrides, baseline vs Qloo attribution, and shortlist
                diffs.
              </p>
            </div>
          </Link>

          <Link
            href="/app/settings/integrations"
            className="p-4 rounded-lg bg-surface border border-border hover:border-cultural/40 transition-all group flex items-start gap-3"
          >
            <div className="p-2 rounded bg-surface-2 text-cultural group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text flex items-center gap-1.5">
                <span>Integration & API</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cultural" />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Live Qloo API connection status, circuit breaker, quota meters, and latency probes.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Data Origin Legend (DESIGN §3, §4) */}
      <div className="p-5 rounded-lg bg-surface border border-border space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Evidence Provenance & Origin Legend
        </h4>
        <p className="text-xs text-text-muted">
          PatchPilot tracks data origin end-to-end so game executives always know what is real
          cultural evidence vs synthetic demo data or user inputs.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <OriginBadge origin="live_qloo" />
          <OriginBadge origin="cached_qloo" />
          <OriginBadge origin="cached_stale" />
          <OriginBadge origin="synthetic_demo" />
          <OriginBadge origin="user_supplied" />
          <OriginBadge origin="system_derived" />
        </div>
      </div>

      <DisclaimerStrip />
    </div>
  );
}
