// apps/web/app/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldAlert, ArrowRight, Play, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../components/ui/origin-badge';
import { DisclaimerStrip } from '../components/ui/disclaimer-strip';
import { api } from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingBlank, setLoadingBlank] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleStartDemo = async () => {
    try {
      setLoadingDemo(true);
      setStatusMessage('Creating workspace and seeding Appendix A Ember Arena domain data...');
      await api.createWorkspace({ isDemo: true, seedDemo: true });
      setStatusMessage('Workspace ready! Redirecting to Proposals...');
      router.push('/proposals');
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
      router.push('/setup');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace';
      setStatusMessage(`Error: ${msg}`);
      setLoadingBlank(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* SEC-34 Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-surface border border-border text-xs text-text-muted">
        <ShieldAlert className="w-4 h-4 text-warn shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-text">Demo Workspace Environment:</span> Do not enter
          confidential studio data. Workspace sessions expire after 7 days. All cultural affinity
          evidence is retrieved live from the official Qloo API.
        </div>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#7048E8]/10 text-[#7048E8] border border-[#7048E8]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Qloo Cultural Intelligence Hackathon 2026</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-text">
          Prioritize Live-Service Content with Real Cultural Evidence
        </h1>
        <p className="text-base text-text-muted leading-relaxed max-w-2xl">
          PatchPilot connects your game audience taste profiles to proposed live-ops events,
          bundles, and collabs using verified Qloo cultural intelligence and deterministic
          budget-constrained prioritization.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-surface-2 rounded-lg border border-border text-xs font-mono text-text flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-xl bg-surface border border-border space-y-4 shadow-sm hover:border-[#7048E8]/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-[#7048E8]/10 text-[#7048E8] flex items-center justify-center font-bold">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text">Start with Seeded Demo</h3>
              <OriginBadge origin="synthetic_demo" />
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              Explore Ember Arena with 6 proposals across US, Japan, Brazil, and India, with real
              Qloo affinity evidence and budget trade-offs.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleStartDemo}
            disabled={loadingDemo || loadingBlank}
            className="bg-[#7048E8] hover:bg-[#7048E8]/90 text-white gap-2"
          >
            <span>{loadingDemo ? 'Initializing...' : 'Launch Demo Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 rounded-xl bg-surface border border-border space-y-4 shadow-sm hover:border-accent/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text">Start Blank Workspace</h3>
              <OriginBadge origin="user_supplied" />
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              Set up your own game title, define custom target markets, planning horizon, budget
              caps, and input new content initiatives.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartBlank}
            disabled={loadingDemo || loadingBlank}
            className="gap-2"
          >
            <span>{loadingBlank ? 'Creating...' : 'Create Blank Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Data Origin Legend (DESIGN §3, §4) */}
      <div className="p-5 rounded-lg bg-surface border border-border space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Evidence Provenance & Origin Legend
        </h4>
        <p className="text-xs text-text-muted">
          PatchPilot tracks data origin end-to-end so game executives always know what is real
          cultural evidence vs synthetic or user inputs.
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
