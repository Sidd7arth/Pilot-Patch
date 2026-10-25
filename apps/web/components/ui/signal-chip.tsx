// apps/web/components/ui/signal-chip.tsx
import React from 'react';
import { Sparkles, EyeOff } from 'lucide-react';

interface SignalChipProps {
  direction: 'supports' | 'not_observed' | string;
  strengthBand?: 'strong' | 'moderate' | 'weak' | string | null;
  className?: string;
}

export function SignalChip({ direction, strengthBand, className = '' }: SignalChipProps) {
  if (direction === 'supports') {
    const bandLabel = strengthBand ? strengthBand.toUpperCase() : 'OBSERVED';
    let bandColor = 'bg-[#7048E8]/10 text-[#7048E8] border-[#7048E8]/30';
    if (strengthBand === 'strong') {
      bandColor = 'bg-[#7048E8]/20 text-[#7048E8] border-[#7048E8]/50 font-semibold';
    } else if (strengthBand === 'weak') {
      bandColor = 'bg-[#7048E8]/5 text-[#7048E8]/80 border-[#7048E8]/20';
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border ${bandColor} ${className}`}
      >
        <Sparkles className="w-3 h-3 shrink-0" />
        <span>SUPPORTS · {bandLabel}</span>
      </span>
    );
  }

  // Not observed (neutral hatched, never red per DESIGN §4)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border border-dashed border-slate-300 bg-slate-50 text-slate-500 ${className}`}
    >
      <EyeOff className="w-3 h-3 shrink-0" />
      <span>NO SUPPORTING EVIDENCE OBSERVED</span>
    </span>
  );
}
