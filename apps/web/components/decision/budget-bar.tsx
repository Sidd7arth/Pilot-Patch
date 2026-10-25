// apps/web/components/decision/budget-bar.tsx
import React from 'react';

interface SelectedSegment {
  id: string;
  name: string;
  rank: number;
  costMinor: string | bigint | number;
}

interface BudgetBarProps {
  totalBudgetMinor: string | bigint | number;
  contingencyMinor: string | bigint | number;
  selectedProposals: SelectedSegment[];
  currency?: string;
  className?: string;
}

const SEGMENT_COLORS = [
  'bg-indigo-600',
  'bg-blue-600',
  'bg-cyan-600',
  'bg-teal-600',
  'bg-emerald-600',
  'bg-violet-600',
];

export function BudgetBar({
  totalBudgetMinor,
  contingencyMinor,
  selectedProposals,
  currency = '$',
  className = '',
}: BudgetBarProps) {
  const total = Number(totalBudgetMinor);
  const contingency = Number(contingencyMinor);

  if (total <= 0) {
    return <div className="text-xs text-text-muted">No budget configured</div>;
  }

  const used = selectedProposals.reduce((sum, p) => sum + Number(p.costMinor), 0);
  const segments = selectedProposals.map((p, idx) => {
    const cost = Number(p.costMinor);
    const pct = (cost / total) * 100;
    return {
      ...p,
      cost,
      pct,
      color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
    };
  });

  const contingencyPct = (contingency / total) * 100;
  const remaining = Math.max(0, total - contingency - used);
  const remainingPct = Math.max(0, (remaining / total) * 100);
  const utilizationPct = ((used / (total - contingency)) * 100).toFixed(1);

  const formatMoney = (minor: number) => {
    return `${currency}${(minor / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Top Header Metrics */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-text font-semibold">
            Allocated: <span className="text-accent">{formatMoney(used)}</span>
          </span>
          <span className="text-text-muted">
            Available: {formatMoney(total - contingency)} ({utilizationPct}%)
          </span>
        </div>
        <div className="flex items-center gap-3 text-text-muted">
          <span>Remaining: {formatMoney(remaining)}</span>
          <span>Reserve: {formatMoney(contingency)}</span>
          <span>Total: {formatMoney(total)}</span>
        </div>
      </div>

      {/* Visual Stacked Bar */}
      <div
        className="w-full h-4 bg-surface-2 rounded-full overflow-hidden flex border border-border/80 shadow-inner"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={total - contingency}
        aria-label="Portfolio budget allocation bar"
      >
        {/* Selected Proposal Segments */}
        {segments.map((seg) => (
          <div
            key={seg.id}
            style={{ width: `${seg.pct}%` }}
            className={`${seg.color} h-full transition-all duration-300 relative group cursor-pointer border-r border-white/20 last:border-r-0`}
            title={`#${seg.rank} ${seg.name}: ${formatMoney(seg.cost)} (${seg.pct.toFixed(1)}%)`}
          />
        ))}

        {/* Unallocated Remaining */}
        {remainingPct > 0 && (
          <div
            style={{ width: `${remainingPct}%` }}
            className="bg-emerald-500/10 h-full border-r border-dashed border-emerald-500/30"
            title={`Unallocated Budget: ${formatMoney(remaining)} (${remainingPct.toFixed(1)}%)`}
          />
        )}

        {/* Contingency Reserve (Striped / Hatched) */}
        {contingencyPct > 0 && (
          <div
            style={{ width: `${contingencyPct}%` }}
            className="bg-amber-400/20 h-full bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.06)_25%,rgba(0,0,0,0.06)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.06)_75%)] bg-[length:8px_8px]"
            title={`Contingency Reserve: ${formatMoney(contingency)} (${contingencyPct.toFixed(1)}%)`}
          />
        )}
      </div>

      {/* Segment Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted pt-0.5">
        {segments.map((seg) => (
          <div key={seg.id} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${seg.color}`} />
            <span className="truncate max-w-[140px] text-text font-medium" title={seg.name}>
              #{seg.rank} {seg.name}
            </span>
            <span className="font-mono text-text-muted">({formatMoney(seg.cost)})</span>
          </div>
        ))}
        {contingencyPct > 0 && (
          <div className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-amber-400/40 border border-amber-500/30" />
            <span>Reserve ({formatMoney(contingency)})</span>
          </div>
        )}
      </div>
    </div>
  );
}
