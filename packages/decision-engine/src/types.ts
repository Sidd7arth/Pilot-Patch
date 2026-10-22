// packages/decision-engine/src/types.ts

export type VariantType = 'qloo_informed' | 'baseline' | 'both';

export type EnforcementType = 'hard' | 'advisory';

export type ProposalStatus = 'candidate' | 'under_review' | 'approved' | 'rejected' | 'shipped';

export type DependencyStatus = 'satisfied' | 'pending' | 'blocked';

export type RankingStatus =
  'selected' | 'not_funded' | 'deferred_unmet_dependency' | 'excluded' | 'unscored';

export type FlagCode = 'LOW_COVERAGE' | 'NEAR_TIE' | 'NO_EVIDENCE';

export type ReasonCode =
  | 'HC_STATUS_INELIGIBLE'
  | 'HC_COST_EXCEEDS_BUDGET'
  | 'HC_EFFORT_EXCEEDS_CAPACITY'
  | 'HC_OUTSIDE_HORIZON'
  | 'HC_BLOCKED_DEPENDENCY'
  | 'HC_DEPENDENCY_EXCLUDED'
  | 'REM_BUDGET_INSUFFICIENT'
  | 'REM_CAPACITY_INSUFFICIENT'
  | 'REM_MAX_SELECTIONS'
  | 'DEP_UNMET_IN_PASS';

export type WarningCode = 'WARN_EFFORT_EXCEEDS_CAPACITY' | 'WARN_OUTSIDE_HORIZON';

export interface DecisionMarket {
  id: string;
  name: string;
  countryCode?: string | null;
  weight: number; // 0..1, normalized sum = 1
}

export interface DecisionConstraints {
  currency: string;
  budgetTotalMinor: bigint;
  contingencyReserveMinor: bigint;
  capacityPersonDays?: number | null;
  capacityEnforcement: EnforcementType;
  horizonStart: string; // YYYY-MM-DD
  horizonEnd: string; // YYYY-MM-DD
  horizonEnforcement: EnforcementType;
  maxSelections?: number | null;
}

export interface DecisionProposal {
  id: string;
  name: string;
  category: string;
  status: ProposalStatus;
  estimatedCostMinor: bigint;
  effortPersonDays: number;
  releaseWindowStart: string; // YYYY-MM-DD
  releaseWindowEnd: string; // YYYY-MM-DD
  scheduleConfidence?: number | null; // 1..5
  stakeholderPriority?: number | null; // 1..5
  totalReferencesCount?: number;
  resolvedReferencesCount?: number;
}

export interface DecisionProposalMarket {
  proposalId: string;
  marketId: string;
}

export interface DecisionDependency {
  id: string;
  proposalId: string;
  kind: 'internal' | 'external';
  dependsOnProposalId?: string | null;
  description: string;
  status: DependencyStatus;
  isHardBlocking: boolean;
}

export interface DecisionCulturalSignal {
  id: string;
  proposalId: string;
  marketId: string;
  strategy: 'S1' | 'S2' | 'S3';
  direction: 'supports' | 'not_observed';
  strengthBand: 'strong' | 'moderate' | 'weak' | null;
  strengthValue: number | null;
  basis: string;
  freshness: 'live' | 'cached_fresh' | 'cached_stale';
}

export interface DecisionAnalogRecord {
  proposalId: string;
  historicalRecordId: string;
  metricName: string;
  metricUnit: string;
  metricValue: number;
  baselineValue: number;
  dataOrigin: string;
}

export interface EngineWeights {
  cultural_relevance: number;
  evidence_confidence: number;
  feasibility: number;
  commercial_evidence: number;
  stakeholder_priority: number;
}

export interface EngineOptions {
  variants?: VariantType | undefined;
  minCoverage?: number | undefined; // default 0.5
  tieEpsilon?: number | undefined; // default 0.02
  bandValues?:
    | {
        strong: number; // default 1.0
        moderate: number; // default 0.66
        weak: number; // default 0.33
      }
    | undefined;
  commercialRatioCap?: number | undefined; // default 2.0
  signalMode?: ('tiered' | 'score_normalized') | undefined;
}

export interface DecisionInput {
  engineVersion: string;
  signalConfigVersion: string;
  currency: string;
  constraints: DecisionConstraints;
  markets: DecisionMarket[];
  proposals: DecisionProposal[];
  proposalMarkets: DecisionProposalMarket[];
  dependencies: DecisionDependency[];
  signals: DecisionCulturalSignal[];
  analogs: DecisionAnalogRecord[];
  weights: EngineWeights;
  options?: EngineOptions | undefined;
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

export interface CriterionDetail {
  value: number | null;
  available: boolean;
  weight: number;
  contribution: number;
  origin: string;
  notes?: string | undefined;
}

export interface ExplanationNode {
  type: 'summary' | 'criterion' | 'tradeoff' | 'exclusion' | 'dependency';
  text: string;
  code?: string | undefined;
}

export interface ProposalRanking {
  proposalId: string;
  proposalName: string;
  rank: number | null; // null if excluded
  score: number | null; // null if excluded or unscored
  scoreLower: number | null;
  scoreUpper: number | null;
  coverage: number;
  status: RankingStatus;
  reasonCodes: ReasonCode[];
  warnings: WarningCode[];
  flags: FlagCode[];
  criteria: Record<keyof EngineWeights, CriterionDetail>;
  shortfallMinor?: bigint | undefined;
  tradeoffWinners?: string[] | undefined; // IDs of higher-ranked proposals that consumed the budget
  explanation: ExplanationNode[];
}

export interface PortfolioSummary {
  selectedIds: string[];
  budgetTotalMinor: bigint;
  contingencyReserveMinor: bigint;
  availableBudgetMinor: bigint;
  budgetUsedMinor: bigint;
  budgetRemainingMinor: bigint;
  budgetUtilizationPct: number;
  capacityTotalDays?: number | null | undefined;
  effortUsedDays: number;
  capacityRemainingDays?: number | null | undefined;
  capacityUtilizationPct?: number | null | undefined;
  selectedCount: number;
}

export interface VariantOutput {
  variant: 'qloo_informed' | 'baseline';
  rankings: ProposalRanking[];
  portfolio: PortfolioSummary;
  exclusions: Array<{ proposalId: string; reasons: ReasonCode[] }>;
  warnings: Array<{ proposalId: string; warnings: WarningCode[] }>;
}

export interface ComparisonAttribution {
  proposalId: string;
  proposalName: string;
  baselineRank: number | null;
  qlooRank: number | null;
  rankDelta: number | null; // positive = moved up in Qloo-informed
  baselineStatus: RankingStatus;
  qlooStatus: RankingStatus;
  statusChanged: boolean;
  baselineScore: number | null;
  qlooScore: number | null;
  scoreDelta: number | null;
  drivers: string[];
}

export interface DecisionOutput {
  engineVersion: string;
  signalConfigVersion: string;
  inputHash: string;
  variants: {
    qloo_informed?: VariantOutput;
    baseline?: VariantOutput;
  };
  comparison?: ComparisonAttribution[];
}

// ---------------------------------------------------------------------------
// Run Diff
// ---------------------------------------------------------------------------

export interface RankChange {
  proposalId: string;
  proposalName: string;
  fromRank: number | null;
  toRank: number | null;
  reason: string;
}

export interface RunDiff {
  parameterChanges: string[];
  enteredShortlist: string[];
  leftShortlist: string[];
  rankChanges: RankChange[];
  allocationChange: {
    budgetUsedFromMinor: bigint;
    budgetUsedToMinor: bigint;
    effortUsedFromDays: number;
    effortUsedToDays: number;
  };
  summarySentence: string;
}
