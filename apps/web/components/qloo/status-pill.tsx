'use client';

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

interface QlooStatusResponse {
  configured: boolean;
  baseUrl: string;
  status: 'connected' | 'not_configured' | 'degraded' | 'failed';
  circuitBreaker: 'closed' | 'open' | 'half_open';
  timestamp: string;
}

export function StatusPill() {
  const [statusData, setStatusData] = useState<QlooStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      try {
        const res = await fetch('/api/v1/qloo/status');
        if (res.ok) {
          const data: QlooStatusResponse = await res.json();
          if (mounted) setStatusData(data);
        } else {
          if (mounted) {
            setStatusData({
              configured: false,
              baseUrl: '',
              status: 'failed',
              circuitBreaker: 'open',
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch {
        if (mounted) {
          setStatusData({
            configured: false,
            baseUrl: '',
            status: 'failed',
            circuitBreaker: 'open',
            timestamp: new Date().toISOString(),
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStatus();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-surface-2 border border-border text-text-muted animate-pulse">
        <Activity className="w-3.5 h-3.5" />
        <span>Checking Qloo...</span>
      </div>
    );
  }

  const isConnected = statusData?.status === 'connected';

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
        isConnected
          ? 'bg-cultural/10 text-cultural border-cultural/30'
          : 'bg-warn/10 text-warn border-warn/30'
      }`}
      title={
        statusData
          ? `Qloo API: ${statusData.baseUrl || 'Unconfigured'} (${statusData.status})`
          : 'Qloo API Status'
      }
    >
      {isConnected ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-cultural" />
          <span>Qloo Connected</span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-warn" />
          <span>Qloo Not Configured</span>
        </>
      )}
    </div>
  );
}
