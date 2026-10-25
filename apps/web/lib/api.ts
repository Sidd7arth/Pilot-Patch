// apps/web/lib/api.ts

export interface ComparisonAttribution {
  proposalId: string;
  proposalName: string;
  baselineRank: number | null;
  qlooRank: number | null;
  rankDelta: number | null;
  baselineStatus: string;
  qlooStatus: string;
  statusChanged: boolean;
  baselineScore: number | null;
  qlooScore: number | null;
  scoreDelta: number | null;
  drivers: string[];
}

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
    budgetUsedFromMinor: string | bigint | number;
    budgetUsedToMinor: string | bigint | number;
    effortUsedFromDays: number;
    effortUsedToDays: number;
  };
  summarySentence: string;
}

export interface PortfolioSummary {
  selectedIds: string[];
  budgetTotalMinor: string | bigint | number;
  contingencyReserveMinor: string | bigint | number;
  availableBudgetMinor: string | bigint | number;
  budgetUsedMinor: string | bigint | number;
  budgetRemainingMinor: string | bigint | number;
  budgetUtilizationPct: number;
  capacityTotalDays?: number | null | undefined;
  effortUsedDays: number;
  capacityRemainingDays?: number | null | undefined;
  capacityUtilizationPct?: number | null | undefined;
  selectedCount: number;
}

export interface DecisionOutput {
  engineVersion: string;
  signalConfigVersion: string;
  inputHash: string;
  variants: {
    qloo_informed?: {
      variant: 'qloo_informed' | 'baseline';
      portfolio: PortfolioSummary;
      rankings: Array<{
        proposalId: string;
        proposalName: string;
        rank: number | null;
        score: number | null;
        scoreLower: number | null;
        scoreUpper: number | null;
        coverage: number;
        status: string;
        reasonCodes: string[];
        flags: string[];
        explanation: Array<{ type: string; text: string; code?: string }>;
      }>;
    };
    baseline?: {
      variant: 'qloo_informed' | 'baseline';
      portfolio: PortfolioSummary;
      rankings: Array<{
        proposalId: string;
        proposalName: string;
        rank: number | null;
        score: number | null;
        scoreLower: number | null;
        scoreUpper: number | null;
        coverage: number;
        status: string;
        reasonCodes: string[];
        flags: string[];
        explanation: Array<{ type: string; text: string; code?: string }>;
      }>;
    };
  };
  comparison?: ComparisonAttribution[];
}

export interface WorkspaceData {
  id: string;
  expiresAt: string;
  quota: {
    dailyCallsLimit: number;
    callsUsedToday: number;
    callsRemaining: number;
  };
  game: {
    id: string;
    title: string;
    description: string | null;
    genreTags: string[];
    platforms: string[];
    dataOrigin: string;
  } | null;
  constraints: {
    currency: string;
    budgetTotalMinor: string;
    contingencyReserveMinor: string;
    capacityPersonDays: number | null;
    capacityEnforcement: 'hard' | 'soft' | 'none';
    horizonStart: string;
    horizonEnd: string;
    horizonEnforcement: 'hard' | 'soft' | 'none';
    maxSelections: number | null;
    dataOrigin: string;
    weights?: {
      cultural_relevance: number;
      evidence_confidence: number;
      feasibility: number;
      commercial_evidence: number;
      stakeholder_priority: number;
    };
  } | null;
  proposalCount: number;
}

export interface MarketData {
  id: string;
  name: string;
  countryCode: string;
  weight: string;
  dataOrigin: string;
}

export interface CulturalReferenceData {
  id: string;
  proposalId: string | null;
  role: string;
  label: string;
  entityTypeHint: string | null;
  resolvedEntityId: string | null;
  resolvedEntityName: string | null;
  resolvedEntityType: string | null;
  resolvedEntityConfidence: string | null;
  resolutionStatus: 'unresolved' | 'resolved' | 'ambiguous' | 'unsupported' | 'failed';
  ambiguityCandidates: Array<{
    id: string;
    name: string;
    type: string;
    score?: number;
    confidence?: number;
  }> | null;
  dataOrigin: string;
}

export interface ProposalData {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  category: string;
  estimatedCostMinor: string;
  currency: string;
  effortPersonDays: number | null;
  releaseWindowStart: string | null;
  releaseWindowEnd: string | null;
  scheduleConfidence: number;
  stakeholderPriority: number;
  openQuestions: string[];
  assumptions: string[];
  dataOrigin: string;
  marketIds?: string[];
  dependencies?: Array<{
    id: string;
    kind: string;
    dependsOnProposalId: string | null;
    description: string | null;
    status: string;
    isHardBlocking: boolean;
  }>;
  references?: CulturalReferenceData[];
  analogs?: Array<{
    id: string;
    historicalRecordId: string;
    relevanceWeight: string;
    notes: string | null;
  }>;
  signals?: Array<{
    id: string;
    marketId: string;
    strategy: string;
    direction: string;
    strengthBand: string | null;
    strengthValue: string | null;
    basis: string;
    freshness: string;
  }>;
}

export interface DecisionRunSummary {
  id: string;
  label: string | null;
  createdAt: string;
  engineVersion: string;
  signalConfigVersion: string;
  inputHash: string;
  parentRunId: string | null;
  variants: string;
}

export interface DecisionRunDetail {
  run: DecisionRunSummary & {
    output: DecisionOutput;
    inputSnapshot: Record<string, unknown>;
    diffFromParent: RunDiff | null;
  };
  rankings: Array<{
    id: string;
    variant: string;
    proposalId: string;
    rank: number | null;
    score: string | null;
    scoreLower: string | null;
    scoreUpper: string | null;
    coverage: string;
    status: string;
    reasonCodes: string[];
    flags: string[];
    criteria: Record<string, unknown>;
    explanation: { nodes: Array<{ type: string; text: string; code?: string }> };
  }>;
}

export interface QlooStatusData {
  configured: boolean;
  baseUrl: string;
  status: 'connected' | 'not_configured' | 'error';
  circuitBreaker: 'closed' | 'open' | 'half_open';
  timestamp: string;
  quota?: {
    dailyCallsLimit: number;
    callsUsedToday: number;
    callsRemaining: number;
  };
  lastSuccessAt?: string | null;
  lastError?: string | null;
}

export interface QlooQueryData {
  id: string;
  proposalId: string | null;
  purpose: string;
  endpoint: string;
  paramsSummary: Record<string, unknown>;
  statusCode: number;
  outcome: 'success' | 'empty' | 'unsupported' | 'failed';
  dataOrigin: string;
  retrievedAt: string;
  durationMs: number | null;
  attempts: number;
}

export interface BriefData {
  id: string;
  runId: string;
  version: number;
  createdAt: string;
  markdown: string;
  content: Record<string, unknown>;
  narrativeStatus: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errMessage = `HTTP ${response.status} ${response.statusText}`;
    let errCode = 'HTTP_ERROR';
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errMessage = errJson.error.message;
        errCode = errJson.error.code || errCode;
      }
    } catch {
      // not JSON
    }
    throw new ApiError(errMessage, response.status, errCode);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Workspaces
  async getWorkspace(): Promise<{ workspace: WorkspaceData }> {
    return fetchJson('/api/v1/workspace');
  },

  async createWorkspace(data: { isDemo?: boolean; label?: string; seedDemo?: boolean } = {}) {
    return fetchJson<{ workspace: { id: string; expiresAt: string; seeded: boolean } }>(
      '/api/v1/workspaces',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // Game & Setup
  async getGame() {
    return fetchJson<{ game: WorkspaceData['game'] }>('/api/v1/game');
  },

  async updateGame(data: { name: string; genreTags?: string[]; platforms?: string[]; description?: string }) {
    return fetchJson<{ game: WorkspaceData['game'] }>('/api/v1/game', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Markets
  async getMarkets() {
    return fetchJson<{ markets: MarketData[] }>('/api/v1/markets');
  },

  async updateMarket(id: string, data: { name?: string; countryCode?: string; weight?: number | string }) {
    return fetchJson<{ market: MarketData }>(`/api/v1/markets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Constraints
  async getConstraints() {
    return fetchJson<{ constraints: WorkspaceData['constraints'] }>('/api/v1/constraints');
  },

  async updateConstraints(data: {
    currency?: string;
    budgetTotalMinor: string;
    contingencyReserveMinor: string;
    capacityPersonDays?: number | null;
    capacityEnforcement?: 'hard' | 'soft' | 'none';
    horizonStart: string;
    horizonEnd: string;
    horizonEnforcement?: 'hard' | 'soft' | 'none';
    maxSelections?: number | null;
    weights?: {
      cultural_relevance: number;
      evidence_confidence: number;
      feasibility: number;
      commercial_evidence: number;
      stakeholder_priority: number;
    };
  }) {
    return fetchJson<{ constraints: WorkspaceData['constraints'] }>('/api/v1/constraints', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Proposals
  async getProposals() {
    return fetchJson<{ proposals: ProposalData[] }>('/api/v1/proposals');
  },

  async getProposal(id: string) {
    return fetchJson<{ proposal: ProposalData }>(`/api/v1/proposals/${id}`);
  },

  async createProposal(data: Partial<ProposalData>) {
    return fetchJson<{ proposal: ProposalData }>('/api/v1/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProposal(id: string, data: Partial<ProposalData>) {
    return fetchJson<{ proposal: ProposalData }>(`/api/v1/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProposal(id: string) {
    return fetchJson<{ success: boolean }>(`/api/v1/proposals/${id}`, {
      method: 'DELETE',
    });
  },

  // Qloo
  async getQlooStatus() {
    return fetchJson<QlooStatusData>('/api/v1/qloo/status');
  },

  async resolveReference(workspaceId: string, referenceId: string) {
    return fetchJson<{
      referenceId: string;
      status: string;
      resolvedEntityName: string | null;
      resolvedQlooId: string | null;
      candidates: Array<{ id: string; name: string; type: string }>;
    }>(`/api/v1/workspaces/${workspaceId}/references/${referenceId}/resolve`, {
      method: 'POST',
    });
  },

  async chooseResolution(
    referenceId: string,
    candidate: { id: string; name: string; type: string }
  ) {
    return fetchJson<{ success: boolean; reference: CulturalReferenceData }>(
      `/api/v1/references/${referenceId}/resolution/choose`,
      {
        method: 'POST',
        body: JSON.stringify({ candidate }),
      }
    );
  },

  async refreshProposalEvidence(workspaceId: string, proposalId: string) {
    return fetchJson<{
      proposalId: string;
      signalsCreated: number;
      signals: Array<{
        marketId: string;
        strategy: string;
        direction: string;
        strengthBand: string;
        basis: string;
      }>;
    }>(`/api/v1/workspaces/${workspaceId}/proposals/${proposalId}/refresh-evidence`, {
      method: 'POST',
    });
  },

  async getQlooQueries() {
    return fetchJson<{ queries: QlooQueryData[] }>('/api/v1/qloo/queries');
  },

  // Decisions
  async listDecisionRuns() {
    return fetchJson<{ decisionRuns: DecisionRunSummary[] }>('/api/v1/decision-runs');
  },

  async getDecisionRun(id: string) {
    return fetchJson<DecisionRunDetail>(`/api/v1/decision-runs/${id}`);
  },

  async createDecisionRun(data: {
    label?: string;
    variants?: 'qloo_informed' | 'baseline' | 'both';
    weights?: Record<string, number>;
    constraintsOverride?: Record<string, unknown>;
  }) {
    return fetchJson<{
      run: DecisionRunSummary;
      output: DecisionOutput;
      diffFromParent: RunDiff | null;
    }>('/api/v1/decision-runs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async replanDecisionRun(
    id: string,
    data: {
      label?: string;
      variants?: 'qloo_informed' | 'baseline' | 'both';
      weights?: Record<string, number>;
      constraintsOverride?: Record<string, unknown>;
    }
  ) {
    return fetchJson<{
      run: DecisionRunSummary;
      output: DecisionOutput;
      diffFromParent: RunDiff | null;
    }>(`/api/v1/decision-runs/${id}/replan`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async diffRuns(baseId: string, comparisonId: string) {
    return fetchJson<{ diff: RunDiff }>(`/api/v1/decision-runs/${baseId}/diff/${comparisonId}`);
  },

  async getComparison(id: string) {
    return fetchJson<{
      comparison: ComparisonAttribution[];
      baselinePortfolio: unknown;
      qlooPortfolio: unknown;
    }>(`/api/v1/decision-runs/${id}/comparison`);
  },

  // Briefs
  async generateBrief(runId: string) {
    return fetchJson<{
      brief: BriefData;
      bannedClaimViolations: Array<{ pattern: string; matchedText: string }>;
    }>(`/api/v1/decision-runs/${runId}/briefs`, {
      method: 'POST',
    });
  },

  async getBrief(id: string) {
    return fetchJson<{ brief: BriefData }>(`/api/v1/briefs/${id}`);
  },

  getBriefExportUrl(id: string): string {
    return `/api/v1/briefs/${id}/export?format=md`;
  },
};
