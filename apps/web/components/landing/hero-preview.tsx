'use client';

import React from 'react';
import { Sparkles, DollarSign, Clock, Music } from 'lucide-react';

export function HeroWorkspacePreview() {
  return (
    <div className="relative rounded-2xl bg-[#0D1428] border border-[#27314A] shadow-2xl overflow-hidden text-left">
      {/* Gloss / subtle gradient background effect */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#7865F5]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#42D9C5]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mock Window Top Bar */}
      <div className="px-4 py-3 bg-[#080D1B] border-b border-[#27314A] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono text-[11px] text-slate-400 ml-2">
            patchpilot.app/workspace
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-[#151F38] border border-[#27314A] text-slate-300 font-medium">
            Ember Arena (LiveOps)
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Qloo Live
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4 relative z-10">
        {/* Workspace Budget & Capacity Meter */}
        <div className="p-3.5 rounded-xl bg-[#151F38]/90 border border-[#27314A] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Q4 2026 LiveOps Allocation</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#7865F5]/20 text-[#8B9BFF] rounded">
                Hash: 8a822473...
              </span>
            </div>
            <span className="text-emerald-400 font-medium font-mono text-[11px]">
              $315k / $360k Allocated (87.5%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-[#080D1B] rounded-full overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-[#7865F5] to-[#42D9C5] rounded-full w-[87.5%]" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#8B9BFF]" />
                Remaining: <strong className="text-slate-200 font-mono">$45,000</strong>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#42D9C5]" />
                Capacity: <strong className="text-slate-200 font-mono">420 / 480d</strong>
              </span>
            </div>
            <span className="text-slate-400">3 of 6 Proposals Funded</span>
          </div>
        </div>

        {/* Shortlist Table Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
            <span>Funded Portfolio Recommendations</span>
            <span>Score · Status</span>
          </div>

          {/* Proposal Card 1 */}
          <div className="p-3 rounded-lg bg-[#151F38]/60 hover:bg-[#151F38] border border-[#27314A] flex items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 rounded bg-[#7865F5]/20 text-[#8B9BFF] font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-white truncate">
                    Latin Music Summer Event
                  </h4>
                  <span className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-300 rounded border border-slate-700">
                    Seasonal Event
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-mono font-medium">$85,000</span>
                  <span>·</span>
                  <span>100 person-days</span>
                  <span>·</span>
                  <span className="text-[#42D9C5] flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    Bad Bunny (Affinity: 0.99)
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-400 font-mono">75.9</span>
              <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                SELECTED
              </div>
            </div>
          </div>

          {/* Proposal Card 2 */}
          <div className="p-3 rounded-lg bg-[#151F38]/60 hover:bg-[#151F38] border border-[#27314A] flex items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 rounded bg-[#7865F5]/20 text-[#8B9BFF] font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-white truncate">
                    Lantern Festival Seasonal Event
                  </h4>
                  <span className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-300 rounded border border-slate-700">
                    Regional
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-mono font-medium">$90,000</span>
                  <span>·</span>
                  <span>120 person-days</span>
                  <span>·</span>
                  <span className="text-slate-300">East Asia Market</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-400 font-mono">68.5</span>
              <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                SELECTED
              </div>
            </div>
          </div>

          {/* Proposal Card 3 */}
          <div className="p-3 rounded-lg bg-[#151F38]/60 hover:bg-[#151F38] border border-[#27314A] flex items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 rounded bg-[#7865F5]/20 text-[#8B9BFF] font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-white truncate">
                    Anime Studio Collab Skin Line
                  </h4>
                  <span className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-300 rounded border border-slate-700">
                    Collab
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-mono font-medium">$140,000</span>
                  <span>·</span>
                  <span>200 person-days</span>
                  <span>·</span>
                  <span className="text-[#42D9C5]">High US/JP Affinity</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-400 font-mono">65.4</span>
              <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                SELECTED
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Callout */}
        <div className="p-2.5 rounded-lg bg-[#080D1B] border border-[#27314A] text-[11px] text-slate-300 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#7865F5] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Transparent Reasoning:</span> Latin Music
            Summer Event ranked #1 due to strong operational feasibility (score 76.4/100) and
            verified taste affinity for Latin trap artists across US/BR markets.
          </div>
        </div>

        {/* Honest Provenance Footer */}
        <div className="text-center pt-1 border-t border-[#27314A]/40 text-[10px] text-slate-300 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7865F5]" />
          <span>Illustrative Decision Workspace Preview · Synthetic Demo Portfolio</span>
        </div>
      </div>
    </div>
  );
}
