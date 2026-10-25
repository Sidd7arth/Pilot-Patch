// apps/web/app/briefs/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../../components/ui/origin-badge';
import { DisclaimerStrip } from '../../components/ui/disclaimer-strip';
import { api, type DecisionRunSummary } from '../../lib/api';

export default function BriefsListPage() {
  const [runs, setRuns] = useState<DecisionRunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.listDecisionRuns();
        setRuns(res.decisionRuns);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-text">Decision Briefs</h1>
          <OriginBadge origin="system_derived" />
        </div>
        <p className="text-xs text-text-muted mt-1">
          Executive decision-support briefs generated deterministically from prioritized portfolios.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-text-muted">Loading briefs...</div>
      ) : runs.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface border border-border text-center space-y-3">
          <FileText className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-sm font-semibold text-text">No decision runs available</p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Execute a run in the Decision Workspace to generate executive briefs and exportable
            reports.
          </p>
          <Link href="/decision">
            <Button size="sm" className="bg-accent text-white">
              Go to Decision Workspace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-xl bg-surface overflow-hidden shadow-xs">
          {runs.map((r) => (
            <div
              key={r.id}
              className="p-4 flex items-center justify-between hover:bg-surface-2/40 transition-colors"
            >
              <div className="space-y-1">
                <span className="font-semibold text-sm text-text block">
                  {r.label ?? `Decision Run ${r.id.slice(0, 8)}`}
                </span>
                <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
                  <span>Date: {new Date(r.createdAt).toLocaleDateString()}</span>
                  <span>Engine: v{r.engineVersion}</span>
                  <span>Hash: {r.inputHash.slice(0, 8)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/decision?runId=${r.id}`}>
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <span>Inspect Run</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <DisclaimerStrip />
    </div>
  );
}
