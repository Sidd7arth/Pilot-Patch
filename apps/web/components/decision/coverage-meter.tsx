// apps/web/components/decision/coverage-meter.tsx
import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface CoverageMeterProps {
  coverage: number; // 0..1
  score: number | null; // 0..1
  scoreLower?: number | null; // 0..1
  scoreUpper?: number | null; // 0..1
  className?: string;
}

export function CoverageMeter({
  coverage,
  score,
  scoreLower,
  scoreUpper,
  className = '',
}: CoverageMeterProps) {
  const coveragePct = Math.round(coverage * 100);
  const pointScore = score !== null ? Math.round(score * 100) : null;
  const lowerScore = scoreLower !== null && scoreLower !== undefined ? Math.round(scoreLower * 100) : pointScore;
  const upperScore = scoreUpper !== null && scoreUpper !== undefined ? Math.round(scoreUpper * 100) : pointScore;

  const whiskerLeft = lowerScore !== null ? Math.max(0, Math.min(100, lowerScore)) : 0;
  const whiskerRight = upperScore !== null ? Math.max(0, Math.min(100, upperScore)) : 100;
  const whiskerWidth = Math.max(2, whiskerRight - whiskerLeft);

  return (
    <div className={`p-3 rounded-lg border border-border bg-surface space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-text">
          <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
          <span>Evidence Coverage</span>
        </div>
        <div className="font-mono text-xs font-semibold text-text">
          {coveragePct}%
          <span className="text-[10px] text-text-muted font-normal ml-1">scored</span>
        </div>
      </div>

      {/* Uncertainty Bounds Whisker Bar */}
      <div className="space-y-1">
        <div className="relative w-full h-3 bg-surface-2 rounded-full overflow-hidden border border-border/60">
          {/* Lower to Upper Bound Whisker Track */}
          {lowerScore !== null && upperScore !== null && (
            <div
              style={{ left: `${whiskerLeft}%`, width: `${whiskerWidth}%` }}
              className="absolute top-0 bottom-0 bg-accent/25 rounded-sm"
              title={`Uncertainty Range: ${lowerScore}–${upperScore}`}
            />
          )}

          {/* Point Estimate Marker */}
          {pointScore !== null && (
            <div
              style={{ left: `calc(${pointScore}% - 2px)` }}
              className="absolute top-0 bottom-0 w-1 bg-accent rounded-full shadow-sm"
              title={`Point Score: ${pointScore}`}
            />
          )}
        </div>

        <div className="flex justify-between items-center text-[10px] text-text-muted font-mono">
          <span>Min: {lowerScore ?? '—'}</span>
          <span className="font-semibold text-accent">Score: {pointScore ?? '—'}</span>
          <span>Max: {upperScore ?? '—'}</span>
        </div>
      </div>

      <p className="text-[11px] text-text-muted leading-tight">
        Range shows score sensitivity if unavailable criteria resolve to 0 or 100%.
      </p>
    </div>
  );
}
