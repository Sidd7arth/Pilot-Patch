// apps/web/app/setup/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Gamepad2, Globe, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { OriginBadge } from '../../components/ui/origin-badge';
import { DisclaimerStrip } from '../../components/ui/disclaimer-strip';
import { api, type MarketData } from '../../lib/api';

export default function SetupPage() {
  const [activeTab, setActiveTab] = useState<'game' | 'markets' | 'constraints'>('game');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [gameTitle, setGameTitle] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [genreTags, setGenreTags] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  // Markets state
  const [markets, setMarkets] = useState<MarketData[]>([]);

  // Constraints state
  const [budgetTotal, setBudgetTotal] = useState('400000');
  const [contingencyReserve, setContingencyReserve] = useState('40000');
  const [currency, setCurrency] = useState('USD');
  const [capacityDays, setCapacityDays] = useState('480');
  const [capacityEnforcement, setCapacityEnforcement] = useState<'hard' | 'soft' | 'none'>('hard');
  const [horizonStart, setHorizonStart] = useState('2027-01-01');
  const [horizonEnd, setHorizonEnd] = useState('2027-06-30');
  const [horizonEnforcement, setHorizonEnforcement] = useState<'hard' | 'soft' | 'none'>('hard');
  const [maxSelections, setMaxSelections] = useState('');

  // Weights state
  const [weights, setWeights] = useState({
    cultural_relevance: 0.35,
    evidence_confidence: 0.15,
    feasibility: 0.2,
    commercial_evidence: 0.2,
    stakeholder_priority: 0.1,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { workspace } = await api.getWorkspace();
        if (workspace.game) {
          setGameTitle(workspace.game.title);
          setGameDesc(workspace.game.description ?? '');
          setGenreTags(workspace.game.genreTags ?? []);
          setPlatforms(workspace.game.platforms ?? []);
        }

        if (workspace.constraints) {
          setCurrency(workspace.constraints.currency);
          setBudgetTotal((Number(workspace.constraints.budgetTotalMinor) / 100).toString());
          setContingencyReserve((Number(workspace.constraints.contingencyReserveMinor) / 100).toString());
          setCapacityDays(workspace.constraints.capacityPersonDays?.toString() ?? '480');
          setCapacityEnforcement(workspace.constraints.capacityEnforcement);
          setHorizonStart(workspace.constraints.horizonStart);
          setHorizonEnd(workspace.constraints.horizonEnd);
          setHorizonEnforcement(workspace.constraints.horizonEnforcement);
          if (workspace.constraints.maxSelections) {
            setMaxSelections(workspace.constraints.maxSelections.toString());
          }
          if (workspace.constraints.weights) {
            setWeights(workspace.constraints.weights);
          }
        }

        const { markets: mList } = await api.getMarkets();
        setMarkets(mList);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load workspace setup');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      // Save game
      await api.updateGame({
        name: gameTitle,
        description: gameDesc,
        genreTags,
        platforms,
      });

      // Save constraints
      const budgetMinor = (Math.round(Number(budgetTotal) * 100)).toString();
      const contingencyMinor = (Math.round(Number(contingencyReserve) * 100)).toString();

      await api.updateConstraints({
        currency,
        budgetTotalMinor: budgetMinor,
        contingencyReserveMinor: contingencyMinor,
        capacityPersonDays: capacityDays ? Number(capacityDays) : null,
        capacityEnforcement,
        horizonStart,
        horizonEnd,
        horizonEnforcement,
        maxSelections: maxSelections ? Number(maxSelections) : null,
        weights,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save setup');
    } finally {
      setSaving(false);
    }
  };

  const weightsSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightsValid = Math.abs(weightsSum - 1.0) < 0.01;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex items-center justify-center space-x-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading workspace settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">Workspace Setup</h1>
            <OriginBadge origin="user_supplied" />
          </div>
          <p className="text-xs text-text-muted mt-1">
            Configure game context, target markets, planning horizon, and decision weights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Saved!</span>
            </div>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !weightsValid}
            className="bg-accent hover:bg-accent/90 text-white gap-2 font-medium"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border space-x-1">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'game'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Game Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('markets')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'markets'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Target Markets ({markets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('constraints')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'constraints'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Planning Constraints & Weights</span>
        </button>
      </div>

      {/* Tab 1: Game Profile */}
      {activeTab === 'game' && (
        <div className="space-y-5 bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text">Game Title</label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none font-medium"
              placeholder="e.g. Ember Arena"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text">Description</label>
            <textarea
              rows={3}
              value={gameDesc}
              onChange={(e) => setGameDesc(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
              placeholder="Brief game concept and live-service model..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Genre Tags (comma-separated)</label>
              <input
                type="text"
                value={genreTags.join(', ')}
                onChange={(e) =>
                  setGenreTags(
                    e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
                placeholder="action, team-based, competitive"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Target Platforms</label>
              <input
                type="text"
                value={platforms.join(', ')}
                onChange={(e) =>
                  setPlatforms(
                    e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
                placeholder="PC, mobile"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Target Markets */}
      {activeTab === 'markets' && (
        <div className="space-y-4 bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text">Target Geography & Relative Weights</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Relative market importance used in market-weighted cultural resonance aggregation.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {markets.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between bg-surface">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-text">{m.name}</span>
                    <span className="font-mono text-xs text-text-muted uppercase bg-surface-2 px-1.5 py-0.5 rounded">
                      {m.countryCode}
                    </span>
                    <OriginBadge origin={m.dataOrigin} />
                  </div>
                  <p className="text-xs text-text-muted">Relative weighting in decision engine</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={Number(m.weight)}
                      onChange={(e) => {
                        const newWeight = e.target.value;
                        setMarkets((prev) =>
                          prev.map((item) => (item.id === m.id ? { ...item, weight: newWeight } : item))
                        );
                      }}
                      className="w-full accent-accent"
                    />
                  </div>
                  <span className="font-mono text-sm font-bold text-accent w-12 text-right">
                    {(Number(m.weight) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Planning Constraints */}
      {activeTab === 'constraints' && (
        <div className="space-y-6 bg-surface p-6 rounded-xl border border-border shadow-sm">
          {/* Budget & Reserves */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              1. Financial Budget Constraints
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Total Budget ($)</label>
                <input
                  type="number"
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Contingency Reserve ($)</label>
                <input
                  type="number"
                  value={contingencyReserve}
                  onChange={(e) => setContingencyReserve(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Net Available Budget</label>
                <div className="text-sm font-mono font-bold text-accent px-3 py-2 rounded-lg border border-border bg-accent/5">
                  ${(Number(budgetTotal) - Number(contingencyReserve)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Operational Capacity & Horizon */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              2. Operational Capacity & Planning Horizon
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Studio Capacity (Person-Days)</label>
                <input
                  type="number"
                  value={capacityDays}
                  onChange={(e) => setCapacityDays(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Capacity Enforcement</label>
                <select
                  value={capacityEnforcement}
                  onChange={(e) => setCapacityEnforcement(e.target.value as 'hard' | 'soft' | 'none')}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
                >
                  <option value="hard">Hard constraint (rejects if exceeded)</option>
                  <option value="soft">Soft warning (flags near capacity)</option>
                  <option value="none">Advisory only (none)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Planning Horizon Start</label>
                <input
                  type="date"
                  value={horizonStart}
                  onChange={(e) => setHorizonStart(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Planning Horizon End</label>
                <input
                  type="date"
                  value={horizonEnd}
                  onChange={(e) => setHorizonEnd(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-border bg-surface-2 focus:border-accent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Decision Engine Weights */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                3. Multi-Criteria Scoring Weights
              </h3>
              <span
                className={`text-xs font-mono font-bold ${
                  weightsValid ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                Sum: {(weightsSum * 100).toFixed(0)}% {weightsValid ? '(Balanced 100%)' : '(Must sum to 100%)'}
              </span>
            </div>

            <div className="space-y-3 bg-surface-2/60 p-4 rounded-lg border border-border">
              {Object.entries(weights).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text capitalize">
                    {k.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="0.6"
                      step="0.05"
                      value={v}
                      onChange={(e) => {
                        const newV = parseFloat(e.target.value);
                        setWeights((prev) => ({ ...prev, [k]: newV }));
                      }}
                      className="w-32 accent-accent"
                    />
                    <span className="w-12 font-mono text-right font-bold text-text">
                      {(v * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <DisclaimerStrip />
    </div>
  );
}
