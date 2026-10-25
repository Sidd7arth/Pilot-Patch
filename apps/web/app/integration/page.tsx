// apps/web/app/integration/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Server,
  Zap,
  Globe,
  Sliders,
  ChevronDown,
  ChevronRight,
  Database,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge, type DataOrigin } from '../../components/ui/origin-badge';
import { DisclaimerStrip } from '../../components/ui/disclaimer-strip';
import { api, type QlooStatusData, type QlooQueryData } from '../../lib/api';

interface CapabilityRow {
  entityType: string;
  category: string;
  markets: {
    us: 'VERIFIED' | 'VERIFIED-WITH-LIMITS' | 'UNSUPPORTED' | 'UNKNOWN';
    jp: 'VERIFIED' | 'VERIFIED-WITH-LIMITS' | 'UNSUPPORTED' | 'UNKNOWN';
    br: 'VERIFIED' | 'VERIFIED-WITH-LIMITS' | 'UNSUPPORTED' | 'UNKNOWN';
    in: 'VERIFIED' | 'VERIFIED-WITH-LIMITS' | 'UNSUPPORTED' | 'UNKNOWN';
  };
  notes: string;
}

const CAPABILITY_MATRIX: CapabilityRow[] = [
  {
    entityType: 'urn:entity:videogame',
    category: 'Video Games',
    markets: { us: 'VERIFIED', jp: 'VERIFIED', br: 'VERIFIED', in: 'VERIFIED' },
    notes: 'Tested on Valorant, Cyberpunk 2077, Elden Ring, Genshin Impact, Apex Legends (Phase 0 V-5).',
  },
  {
    entityType: 'urn:entity:artist',
    category: 'Music & Creators',
    markets: { us: 'VERIFIED', jp: 'VERIFIED', br: 'VERIFIED', in: 'VERIFIED' },
    notes: 'Tested on Rosalía, Bad Bunny, Studio Ghibli, blackbear with location-conditioned queries.',
  },
  {
    entityType: 'urn:entity:movie',
    category: 'Film & Cinema',
    markets: { us: 'VERIFIED', jp: 'VERIFIED', br: 'VERIFIED', in: 'VERIFIED' },
    notes: 'Tested on Blade Runner, Akira with cross-domain affinity.',
  },
  {
    entityType: 'urn:entity:brand',
    category: 'Consumer Brands',
    markets: {
      us: 'VERIFIED-WITH-LIMITS',
      jp: 'VERIFIED-WITH-LIMITS',
      br: 'VERIFIED-WITH-LIMITS',
      in: 'VERIFIED-WITH-LIMITS',
    },
    notes: 'Supported for established global lifestyle/tech brands; localized esports gear varies by market.',
  },
  {
    entityType: 'urn:entity:book',
    category: 'Literature & Manga',
    markets: {
      us: 'VERIFIED',
      jp: 'VERIFIED-WITH-LIMITS',
      br: 'VERIFIED-WITH-LIMITS',
      in: 'UNKNOWN',
    },
    notes: 'Catalog coverage dense in US/UK; manga/light novels resolved primarily under Japanese romanized titles.',
  },
];

const KNOWN_LIMITATIONS = [
  {
    title: 'Scores Uncalibrated Across Separate Queries (Q-10)',
    description:
      'Qloo official engineering guidelines explicitly confirm that affinity scores from separate API calls are not globally calibrated. PatchPilot mitigates this by passing candidate sets within unified calls and mapping affinities to standardized tiered bands (Strong / Moderate / Weak).',
  },
  {
    title: 'Geographic Granularity via signal.location.query (Q-09)',
    description:
      'Market-conditioned queries return distinct cultural affinity rankings per country (US, JP, BR, IN). However, regional niche subculture entities may yield empty results in smaller regional catalogs.',
  },
  {
    title: 'Defensive Circuit Breaker & Rate Limiting (Q-11)',
    description:
      'Client adapter enforces a 5 req/sec token bucket and max 2 concurrent in-flight requests. After 3 consecutive upstream 5xx or 429 errors, the circuit breaker opens for 30 seconds before half-open probing.',
  },
  {
    title: 'Zero Credential Exposure Guarantee (SEC-01)',
    description:
      'Server-side isolation ensures upstream API credentials are never sent to the browser, stored in client bundles, or logged. Client requests pass through authenticated backend proxy routes.',
  },
];

export default function IntegrationPage() {
  const [status, setStatus] = useState<QlooStatusData | null>(null);
  const [queries, setQueries] = useState<QlooQueryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [statusRes, queriesRes] = await Promise.all([
          api.getQlooStatus(),
          api.getQlooQueries(),
        ]);
        if (!ignore) {
          setStatus(statusRes);
          setQueries(queriesRes.queries);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load integration status');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void loadData();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleProbeNow() {
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await api.getQlooStatus();
      setStatus(res);
      setProbeResult(
        `Probe successful: Upstream status '${res.status}', latency ${res.latencyMs ?? 0}ms, circuit breaker ${res.circuitBreaker}`
      );
      // Refresh query log
      const qRes = await api.getQlooQueries();
      setQueries(qRes.queries);
    } catch (err: unknown) {
      setProbeResult(
        `Probe failed: ${err instanceof Error ? err.message : 'Unknown network error'}`
      );
    } finally {
      setProbing(false);
    }
  }

  function renderStatusBadge(st: 'VERIFIED' | 'VERIFIED-WITH-LIMITS' | 'UNSUPPORTED' | 'UNKNOWN') {
    switch (st) {
      case 'VERIFIED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-ok/10 text-ok border border-ok/30">
            Verified
          </span>
        );
      case 'VERIFIED-WITH-LIMITS':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-warn/10 text-warn border border-warn/30">
            With Limits
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-50 text-rose-700 border border-rose-200">
            Unsupported
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-surface-2 text-text-muted border border-border">
            Unknown
          </span>
        );
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex items-center justify-center space-x-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Inspecting Qloo API integration...</span>
      </div>
    );
  }

  const isConnected = status?.configured && (status?.reachable || status?.status === 'success');
  const usedCalls = status?.quota?.usedToday ?? status?.quota?.callsUsedToday ?? 0;
  const dailyLimit = status?.quota?.dailyLimit ?? status?.quota?.dailyCallsLimit ?? 150;
  const quotaPct = Math.min(100, Math.round((usedCalls / dailyLimit) * 100));

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-text">Qloo Integration & Health</h1>
              <OriginBadge origin="live_qloo" />
            </div>
            <p className="text-xs text-text-muted mt-1">
              Live connection telemetry, provider quotas, Phase 0 capability matrix, and verified architectural limits.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => void handleProbeNow()}
            disabled={probing}
            className="bg-accent hover:bg-accent/90 text-white font-medium gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`} />
            <span>{probing ? 'Probing...' : 'Probe Live API'}</span>
          </Button>
        </div>

        {probeResult && (
          <div
            className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 border ${
              probeResult.startsWith('Probe successful')
                ? 'bg-ok/10 text-ok border-ok/30'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {probeResult.startsWith('Probe successful') ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{probeResult}</span>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Grid: Status Cards & Quota Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection Status Card */}
        <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Connection Status
            </span>
            <Server className="w-4 h-4 text-text-muted" />
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-ok animate-pulse' : 'bg-warn'
              }`}
            />
            <span className="text-base font-bold text-text">
              {isConnected ? 'Connected & Healthy' : 'Degraded / Unconfigured'}
            </span>
          </div>

          <div className="pt-2 border-t border-border space-y-1.5 text-xs text-text-muted">
            <div className="flex justify-between">
              <span>Host:</span>
              <span className="font-mono text-text">https://hackathon.api.qloo.com</span>
            </div>
            <div className="flex justify-between">
              <span>Latency:</span>
              <span className="font-mono text-text">{status?.latencyMs ?? 0} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Adapter Version:</span>
              <span className="font-mono text-text">{status?.adapterVersion ?? '1.0.0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Credentials:</span>
              <span className="text-ok font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Isolated Server-Side</span>
              </span>
            </div>
          </div>
        </div>

        {/* Circuit Breaker Card */}
        <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Resilience & Breaker
            </span>
            <Zap className="w-4 h-4 text-text-muted" />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${
                status?.circuitBreaker === 'closed'
                  ? 'bg-ok/10 text-ok border-ok/30'
                  : status?.circuitBreaker === 'half_open'
                  ? 'bg-warn/10 text-warn border-warn/30'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              Breaker: {status?.circuitBreaker ?? 'closed'}
            </span>
          </div>

          <div className="pt-2 border-t border-border space-y-1.5 text-xs text-text-muted">
            <div className="flex justify-between">
              <span>Failure Threshold:</span>
              <span className="font-mono text-text">3 consecutive errors</span>
            </div>
            <div className="flex justify-between">
              <span>Reset Timeout:</span>
              <span className="font-mono text-text">30,000 ms</span>
            </div>
            <div className="flex justify-between">
              <span>Rate Limit:</span>
              <span className="font-mono text-text">5 req/sec (token bucket)</span>
            </div>
            <div className="flex justify-between">
              <span>Concurrency Cap:</span>
              <span className="font-mono text-text">2 in-flight max</span>
            </div>
          </div>
        </div>

        {/* Quota Meter Card */}
        <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Workspace Daily Quota
            </span>
            <Sliders className="w-4 h-4 text-text-muted" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-text">Calls Used Today</span>
              <span className="font-mono font-bold text-text">
                {usedCalls} / {dailyLimit}
              </span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-border">
              <div
                className={`h-2 rounded-full transition-all ${
                  quotaPct > 80 ? 'bg-warn' : 'bg-cultural'
                }`}
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-1.5 text-xs text-text-muted">
            <div className="flex justify-between">
              <span>Global Limit:</span>
              <span className="font-mono text-text">2,000 calls / day</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Today:</span>
              <span className="font-mono text-text">{Math.max(0, dailyLimit - usedCalls)} calls</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Strategy:</span>
              <span className="text-text font-medium">24h Fresh / 1h Negative</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capability Matrix Section */}
      <div className="p-5 bg-surface border border-border rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cultural" />
              <h2 className="text-sm font-bold text-text">
                Phase 0 Verified Capability Matrix (Entity Types × Markets)
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Empirical verification results from live probes against the official hackathon API deployment.
            </p>
          </div>
          <span className="text-[11px] text-text-muted font-mono">docs/qloo-verification/PHASE0_REPORT.md</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-text-muted">
                <th className="py-2.5 px-3 font-semibold">Entity Type URN</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-2 text-center font-semibold">US (United States)</th>
                <th className="py-2.5 px-2 text-center font-semibold">JP (Japan)</th>
                <th className="py-2.5 px-2 text-center font-semibold">BR (Brazil)</th>
                <th className="py-2.5 px-2 text-center font-semibold">IN (India)</th>
                <th className="py-2.5 px-3 font-semibold">Empirical Evidence & Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CAPABILITY_MATRIX.map((row) => (
                <tr key={row.entityType} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-text">{row.entityType}</td>
                  <td className="py-2.5 px-3 font-medium text-text">{row.category}</td>
                  <td className="py-2.5 px-2 text-center">{renderStatusBadge(row.markets.us)}</td>
                  <td className="py-2.5 px-2 text-center">{renderStatusBadge(row.markets.jp)}</td>
                  <td className="py-2.5 px-2 text-center">{renderStatusBadge(row.markets.br)}</td>
                  <td className="py-2.5 px-2 text-center">{renderStatusBadge(row.markets.in)}</td>
                  <td className="py-2.5 px-3 text-text-muted leading-relaxed">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Query Log Section */}
      <div className="p-5 bg-surface border border-border rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-text">Recent Query Log & Provenance Audit</h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Live captured API calls with redacted sanitized payloads and request fingerprints.
            </p>
          </div>
          <span className="text-xs text-text-muted">
            Showing {queries.length} recorded {queries.length === 1 ? 'query' : 'queries'}
          </span>
        </div>

        {queries.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted bg-surface-2/40 rounded-lg border border-dashed border-border">
            No API queries recorded yet in this workspace session. Click &quot;Probe Live API&quot; or run entity resolution in Proposals.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-text-muted">
                  <th className="py-2.5 px-3 font-semibold">Endpoint</th>
                  <th className="py-2.5 px-3 font-semibold">Purpose</th>
                  <th className="py-2.5 px-2 font-semibold">HTTP Status</th>
                  <th className="py-2.5 px-2 font-semibold">Outcome</th>
                  <th className="py-2.5 px-3 font-semibold">Latency</th>
                  <th className="py-2.5 px-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {queries.slice(0, 15).map((q) => {
                  const isExpanded = expandedQueryId === q.id;
                  return (
                    <React.Fragment key={q.id}>
                      <tr
                        onClick={() => setExpandedQueryId(isExpanded ? null : q.id)}
                        className="hover:bg-surface-2/50 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-medium text-text flex items-center gap-1.5">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                          )}
                          <span>{q.endpoint}</span>
                        </td>
                        <td className="py-2.5 px-3 text-text-muted capitalize">{q.purpose}</td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                              q.statusCode >= 200 && q.statusCode < 300
                                ? 'bg-ok/10 text-ok'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {q.statusCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              q.outcome === 'success'
                                ? 'bg-ok/10 text-ok'
                                : q.outcome === 'empty'
                                ? 'bg-surface-2 text-text-muted'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {q.outcome}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-text-muted">
                          {q.durationMs ? `${q.durationMs}ms` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted">
                          <OriginBadge
                            origin={
                              (q.dataOrigin as DataOrigin) ||
                              (q.cacheHit ? 'cached_qloo' : 'live_qloo')
                            }
                          />
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-surface-2/30">
                          <td colSpan={6} className="py-3 px-4">
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-3 font-mono text-[11px] text-text-muted">
                                <span>ID: {q.id}</span>
                                {q.requestFingerprint && (
                                  <span>Fingerprint: {q.requestFingerprint.slice(0, 16)}...</span>
                                )}
                                <span>Retrieved: {new Date(q.retrievedAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="bg-surface-2 p-2.5 rounded border border-border">
                                <span className="font-semibold text-text-muted block mb-1">
                                  Sanitized Request Parameters:
                                </span>
                                <pre className="font-mono text-[11px] text-text overflow-x-auto whitespace-pre-wrap">
                                  {JSON.stringify(q.paramsSummary, null, 2)}
                                </pre>
                              </div>
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
        )}
      </div>

      {/* Known Limitations & Provider Constraints */}
      <div className="p-5 bg-surface border border-border rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-warn" />
          <h2 className="text-sm font-bold text-text">
            Provider Boundaries & Architectural Invariants
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {KNOWN_LIMITATIONS.map((lim) => (
            <div key={lim.title} className="p-3.5 bg-surface-2/50 rounded-lg border border-border space-y-1.5">
              <h3 className="text-xs font-bold text-text">{lim.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{lim.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer Strip */}
      <DisclaimerStrip />
    </div>
  );
}
