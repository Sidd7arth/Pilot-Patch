// apps/web/components/ui/disclaimer-strip.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { STANDARD_DISCLAIMER } from '@patchpilot/shared';

interface DisclaimerStripProps {
  className?: string;
  variant?: 'banner' | 'subtle';
}

export function DisclaimerStrip({ className = '', variant = 'banner' }: DisclaimerStripProps) {
  if (variant === 'subtle') {
    return (
      <div className={`flex items-center gap-2 text-xs text-text-muted select-none ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <span>{STANDARD_DISCLAIMER}</span>
      </div>
    );
  }

  return (
    <div
      role="note"
      className={`flex items-start gap-3 p-3.5 rounded-lg border border-border bg-surface-2/60 text-xs text-text-muted leading-relaxed select-none ${className}`}
    >
      <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-text uppercase tracking-wider text-[10px] block mb-0.5">
          Decision Support Notice
        </span>
        {STANDARD_DISCLAIMER}
      </div>
    </div>
  );
}
