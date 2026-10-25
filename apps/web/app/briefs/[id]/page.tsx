// apps/web/app/briefs/[id]/page.tsx
'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../../../components/ui/origin-badge';
import { DisclaimerStrip } from '../../../components/ui/disclaimer-strip';
import { api, type BriefData } from '../../../lib/api';

export default function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const briefId = resolvedParams.id;

  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getBrief(briefId);
        setBrief(res.brief);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load brief');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [briefId]);

  const handleCopyMarkdown = () => {
    if (!brief) return;
    navigator.clipboard.writeText(brief.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex items-center justify-center space-x-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading executive brief...</span>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-lg font-semibold text-text">Brief Not Found</h2>
        <Link href="/briefs">
          <Button size="sm" variant="outline">
            Return to Briefs
          </Button>
        </Link>
      </div>
    );
  }

  const exportUrl = api.getBriefExportUrl(brief.id);

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <Link
          href="/decision"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Decision Workspace</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyMarkdown}
            className="text-xs gap-1.5 font-medium"
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
          </Button>

          <a href={exportUrl} download={`patchpilot-brief-${brief.id.slice(0, 8)}.md`}>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white text-xs gap-1.5 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Markdown (.md)</span>
            </Button>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Document View */}
      <div className="bg-surface p-8 rounded-xl border border-border shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase font-semibold text-text-muted tracking-wider">
              Executive Decision Brief
            </span>
            <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
              <span>Run ID: {brief.runId}</span>
              <span>·</span>
              <span>Generated: {new Date(brief.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <OriginBadge origin="system_derived" />
        </div>

        {/* Preformatted Markdown Document Display */}
        <div className="prose prose-sm max-w-none text-text">
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed p-4 bg-surface-2/40 rounded-lg border border-border/60 overflow-x-auto text-text">
            {brief.markdown}
          </pre>
        </div>
      </div>

      <DisclaimerStrip />
    </div>
  );
}
