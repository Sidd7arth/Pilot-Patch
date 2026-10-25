// apps/web/components/decision/reason-chip.tsx
import React from 'react';

const REASON_LABELS: Record<string, { label: string; tooltip: string; variant: 'danger' | 'warning' | 'info' | 'neutral' }> = {
  // Hard Constraints
  HC_COST_EXCEEDS_BUDGET: {
    label: 'Cost exceeds budget',
    tooltip: 'Proposal cost alone exceeds total available planning budget.',
    variant: 'danger',
  },
  HC_CAPACITY_EXCEEDED: {
    label: 'Capacity exceeded',
    tooltip: 'Required person-days exceed total studio capacity.',
    variant: 'danger',
  },
  HC_OUTSIDE_HORIZON: {
    label: 'Outside horizon',
    tooltip: 'Release window falls outside planning horizon dates.',
    variant: 'danger',
  },
  HC_SCHEDULE_CONFIDENCE_LOW: {
    label: 'Low schedule confidence',
    tooltip: 'Schedule confidence rating is below minimum feasibility threshold.',
    variant: 'danger',
  },
  HC_DEPENDENCY_EXCLUDED: {
    label: 'Blocking dependency excluded',
    tooltip: 'A prerequisite initiative was excluded from the portfolio.',
    variant: 'danger',
  },
  HC_NO_TARGET_MARKET: {
    label: 'No target market',
    tooltip: 'Proposal has no overlapping target markets in planning setup.',
    variant: 'danger',
  },

  // Greedy Selection & Budget Limits
  REM_BUDGET_INSUFFICIENT: {
    label: 'Budget exhausted',
    tooltip: 'Not enough unallocated budget remaining to fund this initiative.',
    variant: 'warning',
  },
  REM_CAPACITY_INSUFFICIENT: {
    label: 'Capacity exhausted',
    tooltip: 'Not enough studio person-days remaining to staff this initiative.',
    variant: 'warning',
  },
  MAX_SELECTIONS_REACHED: {
    label: 'Max selections reached',
    tooltip: 'Portfolio selection cap has been met.',
    variant: 'warning',
  },
  DEP_UNMET_BLOCKING: {
    label: 'Prerequisite unselected',
    tooltip: 'Depends on a prerequisite initiative that was not selected into this portfolio.',
    variant: 'warning',
  },

  // Advisory Warnings
  WARN_DEPENDENCY_PENDING: {
    label: 'External dep pending',
    tooltip: 'Depends on external approval or contract with pending status.',
    variant: 'neutral',
  },
  WARN_SCHEDULE_WINDOW_TIGHT: {
    label: 'Tight schedule window',
    tooltip: 'Release window ends near the planning horizon boundary.',
    variant: 'neutral',
  },
};

interface ReasonChipProps {
  code: string;
  className?: string;
}

export function ReasonChip({ code, className = '' }: ReasonChipProps) {
  const item = REASON_LABELS[code] ?? {
    label: code.replace(/^[A-Z]+_/, '').replace(/_/g, ' ').toLowerCase(),
    tooltip: code,
    variant: 'neutral',
  };

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  if (item.variant === 'danger') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (item.variant === 'warning') {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
  }

  return (
    <span
      title={`[${code}] ${item.tooltip}`}
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border select-none transition-colors ${styles} ${className}`}
    >
      {item.label}
    </span>
  );
}
