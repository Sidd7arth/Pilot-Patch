// apps/api/src/modules/decision/decision-service.ts
import type { Database } from '../../db/index.js';
import {
  DecisionRepository,
  PlanningConstraintsRepository,
  MarketRepository,
  ProposalRepository,
  CulturalSignalRepository,
  type CreateDecisionRankingParams,
} from '../../db/repositories/index.js';
import {
  runDecision,
  diffRuns,
  ENGINE_VERSION,
  type DecisionInput,
  type DecisionOutput,
  type DecisionConstraints,
  type DecisionMarket,
  type DecisionProposal,
  type DecisionProposalMarket,
  type DecisionDependency,
  type DecisionCulturalSignal,
  type DecisionAnalogRecord,
  type EngineWeights,
  type VariantType,
  type RunDiff,
} from '@patchpilot/decision-engine';
import { SIGNAL_CONFIG_VERSION } from '@patchpilot/shared';
import {
  validateDependencyGraph,
  validateProposalLimits,
  validateBudget,
  validateHorizonDates,
} from '../../domain/validators.js';
import { AppError } from '../../http/error-handler.js';

export interface CreateRunRequest {
  label?: string | null | undefined;
  parentRunId?: string | null | undefined;
  variants?: VariantType | undefined;
  weights?: Partial<EngineWeights> | undefined;
  constraintsOverride?: Partial<DecisionConstraints> | undefined;
}

export class DecisionService {
  private decisionRepo: DecisionRepository;
  private constraintRepo: PlanningConstraintsRepository;
  private marketRepo: MarketRepository;
  private proposalRepo: ProposalRepository;
  private signalRepo: CulturalSignalRepository;

  constructor(db: Database) {
    this.decisionRepo = new DecisionRepository(db);
    this.constraintRepo = new PlanningConstraintsRepository(db);
    this.marketRepo = new MarketRepository(db);
    this.proposalRepo = new ProposalRepository(db);
    this.signalRepo = new CulturalSignalRepository(db);
  }

  async buildDecisionInput(
    workspaceId: string,
    weightsOverride?: Partial<EngineWeights>,
    constraintsOverride?: Partial<DecisionConstraints>,
    variants: VariantType = 'both',
  ): Promise<DecisionInput> {
    const rawConstraints = await this.constraintRepo.getByWorkspace(workspaceId);
    if (!rawConstraints) {
      throw AppError.badRequest('Planning constraints not configured for workspace');
    }

    const budgetTotal = constraintsOverride?.budgetTotalMinor ?? rawConstraints.budgetTotalMinor;
    const contingency =
      constraintsOverride?.contingencyReserveMinor ?? rawConstraints.contingencyReserveMinor;
    const horizonStart = constraintsOverride?.horizonStart ?? rawConstraints.horizonStart;
    const horizonEnd = constraintsOverride?.horizonEnd ?? rawConstraints.horizonEnd;

    validateHorizonDates(horizonStart, horizonEnd);
    validateBudget(BigInt(budgetTotal), BigInt(contingency));

    const constraints: DecisionConstraints = {
      currency: rawConstraints.currency,
      budgetTotalMinor: BigInt(budgetTotal),
      contingencyReserveMinor: BigInt(contingency),
      capacityPersonDays:
        constraintsOverride?.capacityPersonDays !== undefined
          ? constraintsOverride.capacityPersonDays
          : rawConstraints.capacityPersonDays,
      capacityEnforcement:
        constraintsOverride?.capacityEnforcement ??
        (rawConstraints.capacityEnforcement as 'hard' | 'advisory'),
      horizonStart,
      horizonEnd,
      horizonEnforcement:
        constraintsOverride?.horizonEnforcement ??
        (rawConstraints.horizonEnforcement as 'hard' | 'advisory'),
      maxSelections:
        constraintsOverride?.maxSelections !== undefined
          ? constraintsOverride.maxSelections
          : rawConstraints.maxSelections,
    };

    // Markets
    const rawMarkets = await this.marketRepo.listByWorkspace(workspaceId);
    const weightSum = rawMarkets.reduce((acc: number, m) => acc + Number(m.weight), 0);
    const markets: DecisionMarket[] = rawMarkets.map((m) => ({
      id: m.id,
      name: m.name,
      countryCode: m.countryCode,
      weight: weightSum > 0 ? Number(m.weight) / weightSum : 1 / Math.max(1, rawMarkets.length),
    }));

    // Active Proposals
    const rawProposals = await this.proposalRepo.listByWorkspace(workspaceId, false);
    validateProposalLimits(rawProposals.length);

    const proposals: DecisionProposal[] = rawProposals.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      status: p.status as DecisionProposal['status'],
      estimatedCostMinor: p.estimatedCostMinor,
      effortPersonDays: p.effortPersonDays,
      releaseWindowStart: p.releaseWindowStart,
      releaseWindowEnd: p.releaseWindowEnd,
      scheduleConfidence: p.scheduleConfidence,
      stakeholderPriority: p.stakeholderPriority,
    }));

    // Proposal Markets & Dependencies
    const proposalMarkets: DecisionProposalMarket[] = [];
    const dependencies: DecisionDependency[] = [];
    const allWorkspaceDeps = await this.proposalRepo.listAllWorkspaceDependencies(workspaceId);

    for (const d of allWorkspaceDeps) {
      dependencies.push({
        id: d.id,
        proposalId: d.proposalId,
        kind: d.kind as 'internal' | 'external',
        dependsOnProposalId: d.dependsOnProposalId,
        description: d.description,
        status: d.status as 'satisfied' | 'pending' | 'blocked',
        isHardBlocking: d.isHardBlocking,
      });
    }

    validateDependencyGraph(dependencies);

    for (const p of rawProposals) {
      const marketIds = await this.proposalRepo.getProposalMarketIds(workspaceId, p.id);
      for (const mId of marketIds) {
        proposalMarkets.push({ proposalId: p.id, marketId: mId });
      }
    }

    // Cultural Signals
    const rawSignals = await this.signalRepo.listByWorkspace(workspaceId);
    const signals: DecisionCulturalSignal[] = rawSignals.map((s) => ({
      id: s.id,
      proposalId: s.proposalId,
      marketId: s.marketId,
      strategy: s.strategy as 'S1' | 'S2' | 'S3',
      direction: s.direction as 'supports' | 'not_observed',
      strengthBand: s.strengthBand as 'strong' | 'moderate' | 'weak' | null,
      strengthValue: s.strengthValue !== null ? Number(s.strengthValue) : null,
      basis: s.basis,
      freshness: s.freshness as 'live' | 'cached_fresh' | 'cached_stale',
    }));

    // Analogs
    const rawAnalogs = await this.proposalRepo.listAllWorkspaceAnalogs(workspaceId);
    const analogs: DecisionAnalogRecord[] = rawAnalogs.map((a) => ({
      proposalId: a.proposalId,
      historicalRecordId: a.historicalRecordId,
      metricName: a.metricName,
      metricUnit: a.metricUnit,
      metricValue: Number(a.metricValue),
      baselineValue: Number(a.baselineValue),
      dataOrigin: a.dataOrigin,
    }));

    // Default weights
    const defaultWeights: EngineWeights = {
      cultural_relevance: 0.35,
      evidence_confidence: 0.15,
      feasibility: 0.2,
      commercial_evidence: 0.2,
      stakeholder_priority: 0.1,
    };

    const weights: EngineWeights = {
      cultural_relevance: weightsOverride?.cultural_relevance ?? defaultWeights.cultural_relevance,
      evidence_confidence:
        weightsOverride?.evidence_confidence ?? defaultWeights.evidence_confidence,
      feasibility: weightsOverride?.feasibility ?? defaultWeights.feasibility,
      commercial_evidence:
        weightsOverride?.commercial_evidence ?? defaultWeights.commercial_evidence,
      stakeholder_priority:
        weightsOverride?.stakeholder_priority ?? defaultWeights.stakeholder_priority,
    };

    return {
      engineVersion: ENGINE_VERSION,
      signalConfigVersion: SIGNAL_CONFIG_VERSION,
      currency: constraints.currency,
      constraints,
      markets,
      proposals,
      proposalMarkets,
      dependencies,
      signals,
      analogs,
      weights,
      options: {
        variants,
      },
    };
  }

  private serializeBigInt(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map((item) => this.serializeBigInt(item));
    if (typeof obj === 'object') {
      const res: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        res[k] = this.serializeBigInt(v);
      }
      return res;
    }
    return obj;
  }

  async createRun(workspaceId: string, req: CreateRunRequest) {
    const input = await this.buildDecisionInput(
      workspaceId,
      req.weights,
      req.constraintsOverride,
      req.variants ?? 'both',
    );

    const output = runDecision(input);

    let diffFromParent: RunDiff | null = null;
    if (req.parentRunId) {
      const parentRun = await this.decisionRepo.getRunById(workspaceId, req.parentRunId);
      if (parentRun && parentRun.output) {
        try {
          diffFromParent = diffRuns(parentRun.output as unknown as DecisionOutput, output);
        } catch {
          // If parent output cannot be diffed, proceed with null diff
        }
      }
    }

    // Build ranking records to persist
    const rankingRecords: CreateDecisionRankingParams[] = [];

    const primaryVariant = output.variants.qloo_informed ?? output.variants.baseline;
    if (primaryVariant) {
      for (const r of primaryVariant.rankings) {
        rankingRecords.push({
          runId: '', // populated in createRun
          variant: primaryVariant.variant,
          proposalId: r.proposalId,
          rank: r.rank,
          score: r.score !== null ? r.score.toString() : null,
          scoreLower: r.scoreLower !== null ? r.scoreLower.toString() : null,
          scoreUpper: r.scoreUpper !== null ? r.scoreUpper.toString() : null,
          coverage: r.coverage.toString(),
          status: r.status,
          reasonCodes: r.reasonCodes,
          flags: r.flags,
          criteria: this.serializeBigInt(r.criteria) as Record<string, unknown>,
          explanation: { nodes: r.explanation },
        });
      }
    }

    const serializedOutput = this.serializeBigInt(output) as DecisionOutput;
    const serializedDiff = diffFromParent
      ? (this.serializeBigInt(diffFromParent) as RunDiff)
      : null;

    const createdRun = await this.decisionRepo.createRun(
      workspaceId,
      {
        label: req.label ?? null,
        parentRunId: req.parentRunId ?? null,
        variants: req.variants ?? 'both',
        engineVersion: input.engineVersion,
        signalConfigVersion: input.signalConfigVersion,
        inputSnapshot: this.serializeBigInt(input) as Record<string, unknown>,
        inputHash: output.inputHash,
        output: serializedOutput as unknown as Record<string, unknown>,
        diffFromParent: serializedDiff as unknown as Record<string, unknown> | null,
      },
      rankingRecords,
    );

    return {
      run: createdRun,
      output: serializedOutput,
      diffFromParent: serializedDiff,
    };
  }

  async getRun(workspaceId: string, runId: string) {
    const run = await this.decisionRepo.getRunById(workspaceId, runId);
    if (!run) {
      throw AppError.notFound('Decision run not found');
    }
    const rankings = await this.decisionRepo.getRankingsForRun(workspaceId, runId);
    return { run, rankings };
  }

  async listRuns(workspaceId: string) {
    return this.decisionRepo.listRunsByWorkspace(workspaceId, 25);
  }

  async diffTwoRuns(workspaceId: string, runAId: string, runBId: string): Promise<RunDiff> {
    const runA = await this.decisionRepo.getRunById(workspaceId, runAId);
    const runB = await this.decisionRepo.getRunById(workspaceId, runBId);

    if (!runA || !runB) {
      throw AppError.notFound('One or both decision runs not found');
    }

    const rawDiff = diffRuns(
      runA.output as unknown as DecisionOutput,
      runB.output as unknown as DecisionOutput,
    );
    return this.serializeBigInt(rawDiff) as RunDiff;
  }
}
