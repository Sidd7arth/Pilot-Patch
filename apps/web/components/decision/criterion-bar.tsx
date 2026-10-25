// apps/web/components/decision/criterion-bar.tsx
import React from 'react';

export type CriterionCategory =
  | 'cultural'
  | 'operational'
  | 'commercial'
  | 'stakeholder'
  | 'confidence';

interface CriterionBarProps {
  label: string;
  category: CriterionCategory;
  value: number | null;
  weight: number;
  contribution: number;
  available: boolean;
  notes?: string | undefined;
  className?: string;
}

const CATEGORY_STYLES: Record<CriterionCategory, { bar: string; text: string; bg: string }> = {
  cultural: {
    bar: 'bg-[#7048E8]',
    text: 'text-[#7048E8]',
    bg: 'bg-[#7048E8]/10',
  },
  operational: {
    bar: 'bg-[#0C8599]',
    text: 'text-[#0C8599]',
    bg: 'bg-[#0C8599]/10',
  },
  commercial: {
    bar: 'bg-[#E67700]',
    text: 'text-[#E67700]',
    bg: 'bg-[#E67700]/10',
  },
  confidence: {
    bar: 'bg-indigo-600',
    text: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  stakeholder: {
    bar: 'bg-slate-600',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
  },
};

export function CriterionBar({
  label,
  category,
  value,
  weight,
  contribution,
  available,
  notes,
  className = '',
}: CriterionBarProps) {
  const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES.operational;
  const weightPct = (weight * 100).toFixed(0);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-text">{label}</span>
          <span className="text-[10px] text-text-muted font-mono bg-surface-2 px-1.5 py-0.5 rounded">
            {weightPct}% wt
          </span>
        </div>
        <div className="text-right font-mono">
          {available && value !== null ? (
            <span className="font-semibold text-text">
              {(value * 100).toFixed(1)}
              <span className="text-[10px] text-text-muted font-normal ml-1">
                (+{(contribution * 100).toFixed(1)} pts)
              </span>
            </span>
          ) : (
            <span className="text-xs text-text-muted italic">Unavailable</span>
          )}
        </div>
      </div>

      {available && value !== null ? (
        <div
          className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden border border-border/60"
          role="progressbar"
          aria-valuenow={value * 100}
          aria-valuemin={0}
          aria-valuemax={100}
          title={`${label}: ${(value * 100).toFixed(1)}% (weight: ${weightPct}%)`}
        >
          <div
            style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
            className={`h-full ${styles.bar} transition-all duration-300 rounded-full`}
          />
        </div>
      ) : (
        <div
          className="w-full h-2.5 rounded-full border border-dashed border-slate-300 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_4px,#e2e8f0_4px,#e2e8f0_8px)] flex items-center justify-center"
          title="Unavailable — not scored. Missing evidence is not penalized."
        >
          <span className="sr-only">Unavailable — not scored</span>
        </div>
      )}

      {notes && <p className="text-[11px] text-text-muted leading-tight">{notes}</p>}
    </div>
  );
}
