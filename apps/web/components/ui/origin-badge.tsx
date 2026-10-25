// apps/web/components/ui/origin-badge.tsx
import React from 'react';

export type DataOrigin =
  | 'live_qloo'
  | 'cached_qloo'
  | 'cached_stale'
  | 'synthetic_demo'
  | 'user_supplied'
  | 'system_derived'
  | 'test_fixture'
  | string;

interface OriginBadgeProps {
  origin: DataOrigin;
  timestamp?: string | Date;
  className?: string;
}

export function OriginBadge({ origin, timestamp, className = '' }: OriginBadgeProps) {
  let label = 'USER SUPPLIED';
  let badgeStyle = 'bg-surface-2 text-text-muted border-border';
  let dotColor = 'bg-text-muted';

  switch (origin) {
    case 'live_qloo':
      label = 'LIVE · Qloo';
      badgeStyle = 'bg-[#7048E8]/10 text-[#7048E8] border-[#7048E8]/30 font-medium';
      dotColor = 'bg-[#7048E8]';
      break;
    case 'cached_qloo':
      label = timestamp ? `CACHED · Qloo` : 'CACHED · Qloo';
      badgeStyle = 'bg-[#7048E8]/5 text-[#7048E8] border-[#7048E8]/20 border-dashed';
      dotColor = 'bg-[#7048E8]/70';
      break;
    case 'cached_stale':
      label = 'STALE CACHE';
      badgeStyle = 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      dotColor = 'bg-amber-500';
      break;
    case 'synthetic_demo':
      label = 'SYNTHETIC DEMO';
      badgeStyle = 'bg-slate-500/10 text-slate-500 border-slate-400/30 border-dashed';
      dotColor = 'bg-slate-400';
      break;
    case 'user_supplied':
      label = 'USER SUPPLIED';
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      break;
    case 'system_derived':
      label = 'SYSTEM DERIVED';
      badgeStyle = 'bg-blue-500/10 text-blue-600 border-blue-400/30 border-dotted';
      dotColor = 'bg-blue-500';
      break;
    case 'test_fixture':
      label = 'TEST FIXTURE';
      badgeStyle = 'bg-rose-500/10 text-rose-600 border-rose-300';
      dotColor = 'bg-rose-500';
      break;
  }

  const tooltipText = timestamp
    ? `Origin: ${origin} (Retrieved: ${new Date(timestamp).toLocaleString()})`
    : `Origin: ${origin}`;

  return (
    <span
      title={tooltipText}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono tracking-wider border transition-colors select-none ${badgeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}
