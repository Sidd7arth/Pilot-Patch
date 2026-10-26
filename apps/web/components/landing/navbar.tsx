'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Product', href: '/#product' },
    { label: 'How it works', href: '/#workflow' },
    { label: 'Cultural intelligence', href: '/#intelligence' },
    { label: 'For studios', href: '/#studios' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#080D1B]/90 backdrop-blur-md border-b border-[#27314A]/80 shadow-lg shadow-black/20'
          : 'bg-[#080D1B]/60 backdrop-blur-sm border-b border-[#27314A]/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7865F5] to-[#6754E8] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-[#7865F5]/20 group-hover:scale-105 transition-transform">
            P
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white group-hover:text-slate-200 transition-colors">
              PatchPilot
            </span>
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#7865F5]/15 text-[#8B9BFF] border border-[#7865F5]/30 rounded">
              Qloo AI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/app">
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#7865F5] to-[#6754E8] hover:from-[#6754E8] hover:to-[#5642D8] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-[#7865F5]/25 hover:shadow-[#7865F5]/40 transition-all gap-1.5 cursor-pointer"
            >
              <span>Open workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#151F38] border border-[#27314A]/60 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D1428] border-b border-[#27314A] px-4 pt-3 pb-6 space-y-4 shadow-2xl">
          <nav className="flex flex-col space-y-2.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-[#151F38] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-[#27314A]/60">
            <Link href="/app" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button className="w-full bg-gradient-to-r from-[#7865F5] to-[#6754E8] text-white text-sm font-semibold py-2.5 rounded-lg gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4" />
                <span>Open workspace</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
