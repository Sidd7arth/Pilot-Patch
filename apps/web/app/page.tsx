import { Sparkles, ShieldAlert, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* SEC-34 Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-surface border border-border text-xs text-text-muted">
        <ShieldAlert className="w-4 h-4 text-warn shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-text">Demo Workspace Environment:</span> Do not enter
          confidential studio data. Workspace sessions expire after 7 days. All cultural evidence is
          retrieved live from the official Qloo API.
        </div>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cultural/10 text-cultural border border-cultural/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Qloo Cultural Intelligence Hackathon 2026</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-text">
          Prioritize Live-Service Content with Real Cultural Evidence
        </h1>
        <p className="text-base text-text-muted leading-relaxed max-w-2xl">
          PatchPilot connects your game audience taste profiles to potential seasonal events, skins,
          and collabs using verified Qloo cultural intelligence and deterministic budget-constrained
          prioritization.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-surface border border-border space-y-4 shadow-sm hover:border-cultural/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-cultural/10 text-cultural flex items-center justify-center font-bold">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-semibold text-text">Start with Seeded Demo</h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Explore Ember Arena with 6 proposals across US, Japan, Brazil, and India, with real
              Qloo affinity evidence.
            </p>
          </div>
          <Link href="/proposals" className="inline-block">
            <Button size="sm" className="bg-cultural hover:bg-cultural/90 text-white gap-2">
              <span>Open Proposals</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-xl bg-surface border border-border space-y-4 shadow-sm hover:border-accent/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text">Decision Workspace</h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Run deterministic multi-criteria ranking, inspect greedy trade-offs, and compare
              Qloo-informed vs baseline variants.
            </p>
          </div>
          <Link href="/decision" className="inline-block">
            <Button size="sm" variant="outline" className="gap-2">
              <span>View Decision</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Data Origin Legend (DESIGN §3) */}
      <div className="p-5 rounded-lg bg-surface border border-border space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Evidence Provenance & Origin Legend
        </h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-cultural text-white font-medium">
            LIVE · Qloo
          </span>
          <span className="px-2.5 py-1 rounded-full border border-cultural text-cultural font-medium">
            CACHED · Qloo
          </span>
          <span className="px-2.5 py-1 rounded-full bg-warn/15 text-warn border border-warn/30 font-medium">
            STALE CACHE
          </span>
          <span className="px-2.5 py-1 rounded-full bg-surface-2 text-text-muted border border-dashed border-border font-medium">
            SYNTHETIC DEMO
          </span>
          <span className="px-2.5 py-1 rounded-full bg-surface-2 text-text border border-border font-medium">
            USER SUPPLIED
          </span>
          <span className="px-2.5 py-1 rounded-full bg-surface-2 text-cultural border border-dotted border-cultural font-medium">
            SYSTEM DERIVED
          </span>
        </div>
      </div>
    </div>
  );
}
