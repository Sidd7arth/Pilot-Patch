// apps/web/app/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Sliders,
  Search,
  GitCompare,
  FileText,
  Globe,
  Clock,
  DollarSign,
  ShieldCheck,
  Compass,
  BarChart3,
  Scale,
  Calendar,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { LandingNavbar } from '../components/landing/navbar';
import { HeroWorkspacePreview } from '../components/landing/hero-preview';
import { FAQAccordion } from '../components/landing/faq-accordion';
import { OriginBadge } from '../components/ui/origin-badge';
import { api } from '../lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);

  const handleLaunchDemo = async () => {
    try {
      setLoadingDemo(true);
      setDemoStatus('Initializing demo workspace and seeding Ember Arena data...');
      await api.createWorkspace({ isDemo: true, seedDemo: true });
      setDemoStatus('Workspace ready! Opening proposals...');
      router.push('/proposals');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch demo';
      setDemoStatus(`Error: ${msg}`);
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D1B] text-slate-100 flex flex-col font-sans selection:bg-[#7865F5]/30 selection:text-white">
      {/* SECTION A — Navigation Bar */}
      <LandingNavbar />

      {/* SECTION B — Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-[linear-gradient(130deg,#080D1B_0%,#11172F_52%,#17152D_100%)] border-b border-[#27314A]/60">
        {/* Subtle radial ambient glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7865F5]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#42D9C5]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#7865F5]/15 text-[#8B9BFF] border border-[#7865F5]/30 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#7865F5]" />
                <span>Cultural intelligence for live-service games</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] max-w-xl">
                Turn cultural signals into smarter content investments.
              </h1>

              {/* Supporting Headline / Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-lg">
                Prioritize your next game update with Qloo-powered cultural intelligence, production
                constraints, and decision briefs that show the evidence behind every recommendation.
              </p>

              {/* Call-to-action buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link href="/app">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#7865F5] to-[#6754E8] hover:from-[#6754E8] hover:to-[#5642D8] text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-[#7865F5]/25 hover:shadow-[#7865F5]/40 transition-all gap-2 cursor-pointer text-sm"
                  >
                    <span>Explore the workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <a href="#workflow">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-[#27314A] bg-[#151F38]/50 hover:bg-[#151F38] text-slate-200 hover:text-white font-medium px-5 py-3 rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    <span>See how it works</span>
                  </Button>
                </a>

                {/* Instant Demo Launch Button (satisfies E2E test & direct exploration) */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleLaunchDemo}
                  disabled={loadingDemo}
                  className="text-xs text-slate-300 hover:text-white hover:bg-[#151F38] px-3.5 py-3 rounded-xl border border-dashed border-[#27314A] gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[#42D9C5]" />
                  <span>{loadingDemo ? 'Initializing...' : 'Launch Demo Workspace'}</span>
                </Button>
              </div>

              {demoStatus && (
                <div className="p-2.5 rounded-lg bg-[#151F38] border border-[#27314A] text-xs font-mono text-[#8B9BFF] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                  <span>{demoStatus}</span>
                </div>
              )}

              {/* Supporting Line */}
              <div className="pt-2 text-xs font-medium text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#42D9C5]" />
                <span>Evidence-led decisions. Clear trade-offs. Human control.</span>
              </div>
            </div>

            {/* Right Column — Product Preview */}
            <div className="lg:col-span-6 w-full">
              <HeroWorkspacePreview />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C — Product Credibility Strip */}
      <section className="py-8 bg-[#0D1428] border-b border-[#27314A]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#7865F5]/10 text-[#7865F5] shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Qloo Cultural Intelligence</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Direct entity resolution and taste correlation across global audiences.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#42D9C5]/10 text-[#42D9C5] shrink-0 mt-0.5">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Budget-Aware Allocation</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Deterministic knapsack optimization under hard capacity constraints.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#8B9BFF]/10 text-[#8B9BFF] shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Explainable Decisions</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Transparent criteria weights and audit-ready decision briefs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Human-Led Decisions</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Evidence-first decision support empowering producers—not replacing them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D — The Problem and Solution */}
      <section id="product" className="py-20 bg-[#F7F8FC] text-slate-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7865F5]">
              The LiveOps Dilemma
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#151A2D] tracking-tight">
              Every content update competes for budget, time, and player attention.
            </h2>
            <p className="text-base text-[#626D84] leading-relaxed">
              Live-service studios are inundated with creative proposals, but selecting the right
              updates demands balancing cultural resonance across territories with hard engineering
              sprint limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-7 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm hover:shadow-md transition-shadow text-left space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#151A2D]">
                1. Cultural relevance is difficult to evaluate across markets
              </h3>
              <p className="text-sm text-[#626D84] leading-relaxed">
                Player taste profiles vary radically between Tokyo, São Paulo, and Dallas. Studios
                often rely on subjective gut feelings or noisy social media buzz, leading to
                regional misalignment.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm hover:shadow-md transition-shadow text-left space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#151A2D]">
                2. Production constraints make it impossible to pursue every idea
              </h3>
              <p className="text-sm text-[#626D84] leading-relaxed">
                Art pipelines, QA capacity, and sprint deadlines are strictly finite. Approving one
                major collaboration or seasonal festival inherently forces dropping or delaying
                another.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm hover:shadow-md transition-shadow text-left space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#151A2D]">
                3. Teams need clear reasoning behind investment decisions
              </h3>
              <p className="text-sm text-[#626D84] leading-relaxed">
                Executive sponsors require documented evidence and auditable trade-offs, not
                unverifiable machine learning black boxes or anecdotal stakeholder preferences.
              </p>
            </div>
          </div>

          {/* The Solution Banner */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[#151F38] to-[#0D1428] text-white border border-[#27314A] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-bold uppercase tracking-wider text-[#42D9C5]">
                How PatchPilot Solves This
              </div>
              <h4 className="text-xl font-bold text-white">
                Deterministic Decision Support Powered by Real Cultural Signals
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                PatchPilot integrates verified Qloo audience affinity data directly with your
                studio’s operating budget, person-day capacity, and release horizons to compute an
                explainable, optimized content portfolio.
              </p>
            </div>
            <Link href="/app" className="shrink-0">
              <Button className="bg-[#7865F5] hover:bg-[#6754E8] text-white text-sm font-semibold px-5 py-2.5 rounded-xl gap-2 cursor-pointer">
                <span>Explore the workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION E — How It Works */}
      <section
        id="workflow"
        className="py-20 bg-[#080D1B] text-white scroll-mt-16 border-t border-[#27314A]/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#42D9C5]">
              Structured Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Three steps from cultural signal to prioritized portfolio.
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              A transparent, reproducible decision process that brings data integrity to live-ops
              planning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-[#0D1428] border border-[#27314A] space-y-4 hover:border-[#7865F5]/60 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#7865F5]/40 font-mono">01</span>
                <Link
                  href="/app/game"
                  className="text-xs font-semibold text-[#8B9BFF] hover:text-white flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Open Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <h3 className="text-lg font-bold text-white">Define the content portfolio</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Set up your game profile, identify key target regional markets (US, Japan, Brazil,
                India), enter candidate updates, development costs, effort person-days, and release
                deadlines.
              </p>
              <div className="pt-2 text-xs text-slate-500 font-mono">
                Route: <code className="text-slate-300 font-semibold">/app/game</code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-[#0D1428] border border-[#27314A] space-y-4 hover:border-[#42D9C5]/60 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#42D9C5]/40 font-mono">02</span>
                <Link
                  href="/app/evidence"
                  className="text-xs font-semibold text-[#42D9C5] hover:text-white flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Explore Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <h3 className="text-lg font-bold text-white">Examine cultural evidence</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Retrieve verified cultural intelligence through the official Qloo API. Resolve
                candidate cultural entities (artists, IP, aesthetics), map audience affinities
                across target markets, and inspect source metadata.
              </p>
              <div className="pt-2 text-xs text-slate-500 font-mono">
                Route: <code className="text-slate-300 font-semibold">/app/evidence</code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-[#0D1428] border border-[#27314A] space-y-4 hover:border-[#8B9BFF]/60 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#8B9BFF]/40 font-mono">03</span>
                <Link
                  href="/app/decisions"
                  className="text-xs font-semibold text-[#8B9BFF] hover:text-white flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Run Decisions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <h3 className="text-lg font-bold text-white">Prioritize and replan</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Execute the zero-IO decision engine to generate an explainable shortlist. Test
                alternative scenarios by adjusting budgets, compare diffs, and generate audit-ready
                decision briefs.
              </p>
              <div className="pt-2 text-xs text-slate-500 font-mono">
                Route: <code className="text-slate-300 font-semibold">/app/decisions</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F — Feature Showcase */}
      <section id="intelligence" className="py-20 bg-[#F7F8FC] text-slate-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7865F5]">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#151A2D] tracking-tight">
              Purpose-built tools for evidence-based content governance.
            </h2>
            <p className="text-base text-[#626D84] leading-relaxed">
              Explore four integrated capabilities that bridge market taste data with production
              execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm hover:border-[#7865F5]/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#7865F5]/10 text-[#7865F5] flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#151A2D]">Cultural Evidence Explorer</h3>
                <p className="text-sm text-[#626D84] mt-2 leading-relaxed">
                  Directly inspect supported Qloo-derived taste signals, sample sizes, and
                  provenance tags across target territories. Filter by origin label (
                  <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                    live_qloo
                  </code>
                  ,{' '}
                  <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                    cached_qloo
                  </code>
                  ) and trace exact query fingerprints.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/app/evidence"
                  className="text-xs font-bold text-[#7865F5] hover:text-[#6754E8] inline-flex items-center gap-1.5"
                >
                  <span>Explore evidence explorer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm hover:border-[#7865F5]/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#42D9C5]/10 text-teal-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#151A2D]">
                  Investment Prioritization Engine
                </h3>
                <p className="text-sm text-[#626D84] mt-2 leading-relaxed">
                  Evaluate proposed content updates under documented scoring criteria and production
                  constraints. Pure, zero-IO deterministic ranking ensures identical inputs always
                  produce identical portfolio allocations and canonical hashes.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/app/decisions"
                  className="text-xs font-bold text-[#7865F5] hover:text-[#6754E8] inline-flex items-center gap-1.5"
                >
                  <span>View decision workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm hover:border-[#7865F5]/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#151A2D]">Scenario Replanning & Diffs</h3>
                <p className="text-sm text-[#626D84] mt-2 leading-relaxed">
                  Simulate tighter budget caps or expanded sprint capacity with instant scenario
                  branching. Inspect live diffs showing exactly which candidate initiatives enter or
                  leave the funded shortlist, alongside baseline attribution comparisons.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/app/scenarios"
                  className="text-xs font-bold text-[#7865F5] hover:text-[#6754E8] inline-flex items-center gap-1.5"
                >
                  <span>Test scenario replanning</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm hover:border-[#7865F5]/40 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#151A2D]">Executive Decision Briefs</h3>
                <p className="text-sm text-[#626D84] mt-2 leading-relaxed">
                  Generate structured Markdown briefs ready for executive greenlight reviews. Every
                  brief documents exact scoring formulas, evidence links, operational limitations,
                  and passes automated scans against misleading revenue claims.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/briefs"
                  className="text-xs font-bold text-[#7865F5] hover:text-[#6754E8] inline-flex items-center gap-1.5"
                >
                  <span>Inspect decision briefs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G — Evidence, Trust, and Limitations */}
      <section className="py-20 bg-[#0D1428] text-white border-t border-[#27314A]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#42D9C5]">
              Scientific Honesty & Trust
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Data integrity is our core differentiator.
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              PatchPilot is designed around strict transparency rules. We never fabricate commercial
              guarantees or disguise uncertainties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left mb-12">
            <div className="p-6 rounded-xl bg-[#151F38]/70 border border-[#27314A] space-y-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7865F5]" />
                Cultural Affinity ≠ Purchase Intent
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                A player audience exhibiting high taste affinity for an artist or anime does not
                guarantee in-game microtransaction spending. Cultural resonance informs creative
                positioning, not financial forecasts.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#151F38]/70 border border-[#27314A] space-y-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#42D9C5]" />
                Zero Fabricated Revenue Claims
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Decision briefs and recommendations are systematically audited against banned
                claims. We never output “guaranteed ROI”, “projected conversion multipliers”, or
                fabricated commercial performance metrics.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#151F38]/70 border border-[#27314A] space-y-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8B9BFF]" />
                Missing Data is Never Penalized
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Missing evidence is not negative evidence. When cultural signals are unavailable,
                that criterion evaluates to null and weights renormalize cleanly without unfairly
                penalizing the proposal.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#151F38]/70 border border-[#27314A] space-y-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Separated Evidence Categories
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cultural signals, operational costs, commercial analogs, and speculative hypotheses
                are strictly segregated in storage and UI. Categories are never conflated into
                opaque blended numbers.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#151F38]/70 border border-[#27314A] space-y-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Human Decision Governance
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                PatchPilot delivers decision-support hypotheses, not autonomous commands. Studio
                producers and LiveOps leadership retain full authority over roadmap approvals and
                creative execution.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#151F38]/70 border border-[#27314A] space-y-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Auditable Provenance Tracking
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every data point displayed in PatchPilot carries an immutable origin label.
                Stakeholders can immediately verify whether an insight came from live Qloo, cached
                responses, or synthetic demo data.
              </p>
            </div>
          </div>

          {/* Evidence Provenance & Origin Legend Display (Satisfies E2E selector & PRD) */}
          <div className="p-6 rounded-2xl bg-[#080D1B] border border-[#27314A] text-left space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Evidence Provenance & Origin Legend
              </h4>
              <span className="text-[11px] text-slate-400">PRD §4 & DESIGN §3 Compliant</span>
            </div>
            <p className="text-xs text-slate-400">
              PatchPilot attaches origin labels end-to-end so game executives always know what is
              real cultural evidence vs synthetic or user inputs.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <OriginBadge origin="live_qloo" />
              <OriginBadge origin="cached_qloo" />
              <OriginBadge origin="cached_stale" />
              <OriginBadge origin="synthetic_demo" />
              <OriginBadge origin="user_supplied" />
              <OriginBadge origin="system_derived" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION H — Built for Studio Teams */}
      <section id="studios" className="py-20 bg-[#F7F8FC] text-slate-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7865F5]">
              Tailored For Games
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#151A2D] tracking-tight">
              Built for live-ops cross-functional teams.
            </h2>
            <p className="text-base text-[#626D84] leading-relaxed">
              How different roles in your studio leverage PatchPilot to streamline roadmap planning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#7865F5]/10 text-[#7865F5] flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#151A2D]">LiveOps Managers</h3>
              <p className="text-xs text-[#626D84] leading-relaxed">
                Plan seasonal calendars, themed battle passes, and event cadences with regional
                cultural relevance rather than relying on domestic assumptions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#151A2D]">Game Producers</h3>
              <p className="text-xs text-[#626D84] leading-relaxed">
                Enforce engineering capacity, art pipeline limits, and contingency reserves to avoid
                sprint overruns and scope creep across live updates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#151A2D]">Content Strategists</h3>
              <p className="text-xs text-[#626D84] leading-relaxed">
                Vet external IP crossovers, musical artist collaborations, and fashion aesthetics
                with empirically verified audience affinity data.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E5E8F1] shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#151A2D]">Regional Publishing</h3>
              <p className="text-xs text-[#626D84] leading-relaxed">
                Advocate for local territory priorities with verifiable cultural signals, ensuring
                non-domestic markets receive targeted, high-resonance content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION I — FAQ */}
      <section className="py-20 bg-white text-slate-900 border-t border-[#E5E8F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7865F5]">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#151A2D] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-[#626D84] leading-relaxed">
              Transparent answers regarding integration, evidence handling, and decision governance.
            </p>
          </div>

          <FAQAccordion />
        </div>
      </section>

      {/* SECTION J — Final Call to Action */}
      <section className="py-20 bg-gradient-to-br from-[#080D1B] via-[#11172F] to-[#1A1838] text-white border-t border-[#27314A] relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,101,245,0.12),transparent_70%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#7865F5]/20 text-[#8B9BFF] border border-[#7865F5]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to prioritize your roadmap?</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Make your next content investment a more informed decision.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Bring cultural evidence, production constraints, and transparent reasoning into one
            cohesive decision workflow.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <Link href="/app">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#7865F5] to-[#6754E8] hover:from-[#6754E8] hover:to-[#5642D8] text-white font-semibold px-7 py-3.5 rounded-xl shadow-xl shadow-[#7865F5]/30 hover:shadow-[#7865F5]/50 transition-all gap-2 text-base cursor-pointer"
              >
                <span>Explore PatchPilot</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={handleLaunchDemo}
              disabled={loadingDemo}
              className="border-[#27314A] bg-[#151F38]/70 hover:bg-[#151F38] text-slate-200 hover:text-white font-medium px-6 py-3.5 rounded-xl transition-colors gap-2 cursor-pointer text-sm"
            >
              <Play className="w-4 h-4 fill-current text-[#42D9C5]" />
              <span>{loadingDemo ? 'Initializing Demo...' : 'Launch Instant Demo'}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION K — Footer */}
      <footer className="py-14 bg-[#080D1B] border-t border-[#27314A]/80 text-left text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#27314A]/60">
            {/* Col 1: Brand & Mission */}
            <div className="md:col-span-2 space-y-3.5">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7865F5] to-[#6754E8] text-white flex items-center justify-center font-bold text-xs shadow-md">
                  P
                </div>
                <span className="font-bold text-base tracking-tight text-white">PatchPilot</span>
              </Link>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Qloo-powered cultural-intelligence and content-investment decision platform for
                live-service and free-to-play game studios.
              </p>
              <div className="text-[11px] text-slate-500">
                Official Submission for the Qloo AI Hackathon 2026.
              </div>
            </div>

            {/* Col 2: Product Sections */}
            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Product</h5>
              <ul className="space-y-2">
                <li>
                  <a href="#product" className="hover:text-white transition-colors">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#intelligence" className="hover:text-white transition-colors">
                    Cultural intelligence
                  </a>
                </li>
                <li>
                  <a href="#studios" className="hover:text-white transition-colors">
                    For studios
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Workspace Navigation */}
            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Workspace
              </h5>
              <ul className="space-y-2">
                <li>
                  <Link href="/app" className="hover:text-white transition-colors">
                    Workspace Overview
                  </Link>
                </li>
                <li>
                  <Link href="/app/game" className="hover:text-white transition-colors">
                    Game Setup
                  </Link>
                </li>
                <li>
                  <Link href="/app/proposals" className="hover:text-white transition-colors">
                    Content Proposals
                  </Link>
                </li>
                <li>
                  <Link href="/app/evidence" className="hover:text-white transition-colors">
                    Evidence Explorer
                  </Link>
                </li>
                <li>
                  <Link href="/app/decisions" className="hover:text-white transition-colors">
                    Decision Workspace
                  </Link>
                </li>
                <li>
                  <Link href="/app/scenarios" className="hover:text-white transition-colors">
                    Compare & Replan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/app/settings/integrations"
                    className="hover:text-white transition-colors"
                  >
                    Qloo Integration
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Resources & Repositories */}
            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Resources
              </h5>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/Sidd7arth/Pilot-Patch"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>GitHub Repository</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.qloo.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Qloo Platform</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <Link href="/briefs" className="hover:text-white transition-colors">
                    Decision Briefs Export
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>© 2026 PatchPilot Contributors. Released under the OSI MIT License.</div>
            <div className="flex items-center gap-4">
              <span>Pure Deterministic Decision Engine</span>
              <span>·</span>
              <span>Zero Fabricated Data Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
