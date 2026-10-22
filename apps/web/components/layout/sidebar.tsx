'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Layers, Search, Sparkles, GitCompare, FileText, Sliders } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: Compass },
  { label: 'Setup', href: '/setup', icon: Sliders },
  { label: 'Proposals', href: '/proposals', icon: Layers },
  { label: 'Evidence Explorer', href: '/evidence', icon: Search },
  { label: 'Decision Workspace', href: '/decision', icon: Sparkles },
  { label: 'Compare & Replan', href: '/decision/compare', icon: GitCompare },
  { label: 'Briefs', href: '/briefs', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col shrink-0 min-h-screen">
      <div className="h-14 border-b border-border flex items-center px-4 gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-cultural text-white flex items-center justify-center font-bold text-sm shadow-sm">
          P
        </div>
        <div>
          <span className="font-semibold text-sm tracking-tight text-text">PatchPilot</span>
          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-cultural/15 text-cultural rounded">
            Qloo
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cultural/10 text-cultural font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border text-[11px] text-text-muted leading-relaxed">
        <p className="font-medium text-text mb-1">Evidence-first engine</p>
        <p>Cultural signals powered by Qloo API. Pure deterministic prioritization.</p>
      </div>
    </aside>
  );
}
