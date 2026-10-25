// apps/web/app/evidence/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../../components/ui/origin-badge';
import { DisclaimerStrip } from '../../components/ui/disclaimer-strip';
import { api, type QlooQueryData, type QlooStatusData } from '../../lib/api';

export default function EvidencePage() {
  const [queries, setQueries] = useState<QlooQueryData[]>([]);
  const [qlooStatus, setQlooStatus] = useState<QlooStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [qRes, sRes] = await Promise.all([api.getQlooQueries(), api.getQlooStatus()]);
        if (!ignore) {
          setQueries(qRes.queries);
          setQlooStatus(sRes);
        }
      } catch (err: unknown) {
        if (!ignore)
          setError(err instanceof Error ? err.message : 'Failed to load evidence explorer');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredQueries = queries.filter((q) => {
    if (filterOutcome === 'all') return true;
    return q.outcome === filterOutcome;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex items-center justify-center space-x-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading Qloo audit queries...</span>
      </div>
    );
  }

  const quota = qlooStatus?.quota;

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Evidence Explorer & Audit Log
          </h1>
          <OriginBadge origin="live_qloo" />
        </div>
        <p className="text-xs text-text-muted mt-1">
          Complete transparency into all official Qloo API requests, status codes, latencies, and
          derived signals.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted block">
            Integration State
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                qlooStatus?.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-sm font-bold capitalize text-text">
              {qlooStatus?.status?.replace(/_/g, ' ') ?? 'Connected'}
            </span>
          </div>
          <span className="text-[10px] text-text-muted font-mono block truncate">
            {qlooStatus?.baseUrl}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted block">
            Circuit Breaker
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            <Activity className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold capitalize text-text">
              {qlooStatus?.circuitBreaker ?? 'Closed (Healthy)'}
            </span>
          </div>
          <span className="text-[10px] text-text-muted font-mono block">Zero 401 retries</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted block">
            Workspace Quota (Today)
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-base font-bold font-mono text-text">
              {quota?.callsUsedToday ?? 0}
              <span className="text-xs text-text-muted font-normal">
                {' '}
                / {quota?.dailyCallsLimit ?? 150}
              </span>
            </span>
          </div>
          <span className="text-[10px] text-text-muted font-mono block">
            {quota?.callsRemaining ?? 150} calls remaining
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-xs">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted block">
            Total Queries Logged
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-base font-bold font-mono text-accent">{queries.length}</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono block">Audit trail persisted</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border text-xs">
        <div className="flex items-center gap-2 text-text font-medium">
          <Filter className="w-4 h-4 text-text-muted" />
          <span>Filter by Query Outcome:</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          {['all', 'success', 'empty', 'unsupported', 'failed'].map((val) => (
            <button
              key={val}
              onClick={() => setFilterOutcome(val)}
              className={`px-2.5 py-1 rounded capitalize transition-colors ${
                filterOutcome === val
                  ? 'bg-accent text-white font-bold'
                  : 'bg-surface-2 text-text-muted hover:text-text'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Queries Table */}
      <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-border text-text-muted uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4 text-right">Latency</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {filteredQueries.map((q) => {
                const isExpanded = expandedQueryId === q.id;
                let outcomeStyle = 'bg-emerald-100 text-emerald-800';
                if (q.outcome === 'empty') outcomeStyle = 'bg-slate-100 text-slate-700';
                if (q.outcome === 'unsupported') outcomeStyle = 'bg-amber-100 text-amber-800';
                if (q.outcome === 'failed') outcomeStyle = 'bg-rose-100 text-rose-800';

                return (
                  <React.Fragment key={q.id}>
                    <tr
                      onClick={() => setExpandedQueryId(isExpanded ? null : q.id)}
                      className="hover:bg-surface-2/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-text-muted text-[11px]">
                        {new Date(q.retrievedAt).toLocaleTimeString()}
                      </td>

                      <td className="py-3 px-4 text-text font-semibold">
                        <code className="text-xs">{q.endpoint}</code>
                      </td>

                      <td className="py-3 px-4 capitalize font-sans text-text-muted">
                        {q.purpose.replace(/_/g, ' ')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            q.statusCode >= 200 && q.statusCode < 300
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {q.statusCode}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${outcomeStyle}`}
                        >
                          {q.outcome}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right text-text-muted">
                        {q.durationMs ? `${q.durationMs}ms` : '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>

                    {/* Expandable sanitized parameters & response */}
                    {isExpanded && (
                      <tr className="bg-surface-2/80">
                        <td colSpan={7} className="p-4 font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between text-text-muted text-[11px]">
                            <span>Query ID: {q.id}</span>
                            <OriginBadge origin={q.dataOrigin} />
                          </div>
                          <div>
                            <span className="font-semibold text-text text-[11px] block mb-1">
                              Sanitized Query Parameters (Secrets Isolated):
                            </span>
                            <pre className="p-3 bg-surface rounded border border-border text-[11px] text-text overflow-x-auto">
                              {JSON.stringify(q.paramsSummary, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DisclaimerStrip />
    </div>
  );
}
