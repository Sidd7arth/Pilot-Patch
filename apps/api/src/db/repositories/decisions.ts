// apps/api/src/db/repositories/decisions.ts
import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '../index.js';
import { decisionRuns, decisionRankings, briefs } from '../schema.js';

export interface CreateDecisionRunParams {
  id?: string;
  label?: string | null;
  parentRunId?: string | null;
  variants: 'qloo_informed' | 'baseline' | 'both';
  engineVersion: string;
  signalConfigVersion: string;
  inputSnapshot: Record<string, unknown>;
  inputHash: string;
  output: Record<string, unknown>;
  diffFromParent?: Record<string, unknown> | null;
}

export interface CreateDecisionRankingParams {
  id?: string;
  runId: string;
  variant: 'qloo_informed' | 'baseline';
  proposalId: string;
  rank?: number | null;
  score?: string | null;
  scoreLower?: string | null;
  scoreUpper?: string | null;
  coverage: string;
  status: 'selected' | 'not_funded' | 'deferred_unmet_dependency' | 'excluded' | 'unscored';
  reasonCodes?: string[];
  flags?: string[];
  criteria: Record<string, unknown>;
  explanation: Record<string, unknown>;
}

export interface CreateBriefParams {
  id?: string;
  runId: string;
  version: number;
  content: Record<string, unknown>;
  markdown: string;
  narrative?: Record<string, unknown> | null;
  narrativeStatus?: 'none' | 'accepted' | 'rejected';
  narrativeMeta?: Record<string, unknown> | null;
}

/**
 * Immutable repository for Decision Runs, Rankings, and Briefs.
 * Per DATABASE.md §4.14: Decision runs are immutable snapshots.
 * No UPDATE or DELETE methods exist.
 */
export class DecisionRepository {
  constructor(private readonly db: Database) {}

  // -------------------------------------------------------------------------
  // Decision Runs (insert-only)
  // -------------------------------------------------------------------------

  async createRun(
    workspaceId: string,
    runParams: CreateDecisionRunParams,
    rankings: CreateDecisionRankingParams[] = [],
  ) {
    const [createdRun] = await this.db
      .insert(decisionRuns)
      .values({
        id: runParams.id,
        workspaceId,
        label: runParams.label ?? null,
        parentRunId: runParams.parentRunId ?? null,
        variants: runParams.variants,
        engineVersion: runParams.engineVersion,
        signalConfigVersion: runParams.signalConfigVersion,
        inputSnapshot: runParams.inputSnapshot,
        inputHash: runParams.inputHash,
        output: runParams.output,
        diffFromParent: runParams.diffFromParent ?? null,
      })
      .returning();

    if (!createdRun) {
      throw new Error('Failed to create decision run');
    }

    if (rankings.length > 0) {
      await this.db.insert(decisionRankings).values(
        rankings.map((rk) => ({
          id: rk.id,
          runId: createdRun.id,
          workspaceId,
          variant: rk.variant,
          proposalId: rk.proposalId,
          rank: rk.rank ?? null,
          score: rk.score ?? null,
          scoreLower: rk.scoreLower ?? null,
          scoreUpper: rk.scoreUpper ?? null,
          coverage: rk.coverage,
          status: rk.status,
          reasonCodes: rk.reasonCodes ?? [],
          flags: rk.flags ?? [],
          criteria: rk.criteria,
          explanation: rk.explanation,
        })),
      );
    }

    return createdRun;
  }

  async getRunById(workspaceId: string, runId: string) {
    const [row] = await this.db
      .select()
      .from(decisionRuns)
      .where(and(eq(decisionRuns.workspaceId, workspaceId), eq(decisionRuns.id, runId)))
      .limit(1);
    return row ?? null;
  }

  async listRunsByWorkspace(workspaceId: string, limit = 20) {
    return this.db
      .select()
      .from(decisionRuns)
      .where(eq(decisionRuns.workspaceId, workspaceId))
      .orderBy(desc(decisionRuns.createdAt))
      .limit(limit);
  }

  async getRankingsForRun(workspaceId: string, runId: string) {
    return this.db
      .select()
      .from(decisionRankings)
      .where(and(eq(decisionRankings.workspaceId, workspaceId), eq(decisionRankings.runId, runId)));
  }

  // -------------------------------------------------------------------------
  // Briefs (insert-only)
  // -------------------------------------------------------------------------

  async createBrief(workspaceId: string, params: CreateBriefParams) {
    const [created] = await this.db
      .insert(briefs)
      .values({
        id: params.id,
        workspaceId,
        runId: params.runId,
        version: params.version,
        content: params.content,
        markdown: params.markdown,
        narrative: params.narrative ?? null,
        narrativeStatus: params.narrativeStatus ?? 'none',
        narrativeMeta: params.narrativeMeta ?? null,
      })
      .returning();
    return created;
  }

  async getBrief(workspaceId: string, runId: string, version?: number) {
    const conditions = [eq(briefs.workspaceId, workspaceId), eq(briefs.runId, runId)];
    if (version !== undefined) {
      conditions.push(eq(briefs.version, version));
    }

    const [row] = await this.db
      .select()
      .from(briefs)
      .where(and(...conditions))
      .orderBy(desc(briefs.version))
      .limit(1);

    return row ?? null;
  }
}
