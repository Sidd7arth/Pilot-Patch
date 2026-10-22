// packages/shared/src/qloo-signal-config.ts
// Configuration for mapping real Qloo API responses to PatchPilot's internal CulturalSignal model.

export const SIGNAL_CONFIG_VERSION = '1.0.0';

export type SignalMode = 'tiered' | 'score_normalized';

export type EvidenceStrategy = 'S1' | 'S2' | 'S3';

export type SignalDirection = 'supports' | 'not_observed';

export type StrengthBand = 'strong' | 'moderate' | 'weak';

export type FreshnessState = 'live' | 'cached_fresh' | 'cached_stale';

export interface SignalConfig {
  version: string;
  signalMode: SignalMode;
  defaultTopN: number;
  maxCandidatesPerQuery: number;
  bandThresholds: {
    strongMinAffinity: number; // e.g. >= 0.90
    moderateMinAffinity: number; // e.g. >= 0.80
    // below moderate is classified as 'weak'
  };
  bandValues: {
    strong: number; // default 1.0
    moderate: number; // default 0.66
    weak: number; // default 0.33
  };
  enabledStrategies: EvidenceStrategy[];
}

export const DEFAULT_SIGNAL_CONFIG: SignalConfig = {
  version: SIGNAL_CONFIG_VERSION,
  signalMode: 'tiered', // Q-10 decision: scores across separate queries are not directly comparable; use bands
  defaultTopN: 5,
  maxCandidatesPerQuery: 10,
  bandThresholds: {
    strongMinAffinity: 0.90,
    moderateMinAffinity: 0.80,
  },
  bandValues: {
    strong: 1.0,
    moderate: 0.66,
    weak: 0.33,
  },
  enabledStrategies: ['S1', 'S2'], // S1 (Anchor co-affinity) and S2 (Market-conditioned) verified live
};

export interface QlooEvidenceProvenance {
  endpoint: string;
  sanitizedParams: Record<string, string | string[]>;
  requestFingerprint: string;
  httpStatus: number | null;
  retrievedAt: string;
  durationMs: number;
  attempts: number;
  adapterVersion: string;
}

export interface CulturalSignal {
  id: string;
  proposalId: string;
  marketId: string;
  strategy: EvidenceStrategy;
  direction: SignalDirection;
  strengthBand: StrengthBand | null; // null iff direction === 'not_observed'
  strengthValue: number | null; // null in 'tiered' mode
  basis: string;
  evidenceItemIds: string[];
  queryIds: string[];
  freshness: FreshnessState;
  dataOrigin: 'system_derived';
  signalConfigVersion: string;
}

/**
 * Deterministically maps an observed affinity score and rank to a StrengthBand
 */
export function calculateStrengthBand(
  affinity: number | null,
  rank: number,
  config: SignalConfig = DEFAULT_SIGNAL_CONFIG
): StrengthBand {
  if (affinity !== null && !isNaN(affinity)) {
    if (affinity >= config.bandThresholds.strongMinAffinity) return 'strong';
    if (affinity >= config.bandThresholds.moderateMinAffinity) return 'moderate';
    return 'weak';
  }
  // Fallback to rank percentile if numeric affinity is not available
  if (rank === 1) return 'strong';
  if (rank <= 3) return 'moderate';
  return 'weak';
}
