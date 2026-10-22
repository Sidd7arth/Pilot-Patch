'use client';

import React from 'react';
import { StatusPill } from '../qloo/status-pill';
import { Play, Database } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

export function TopBar() {
  return (
    <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-text-muted" />
          <span className="text-xs font-medium text-text-muted">Workspace:</span>
          <span className="text-xs font-semibold text-text px-2 py-0.5 rounded bg-surface-2 border border-border">
            Ember Arena (Live Ops)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusPill />
        <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-2 font-medium">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Decision</span>
        </Button>
      </div>
    </header>
  );
}
