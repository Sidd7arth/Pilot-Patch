// apps/api/src/db/repositories/proposals.ts
import { eq, and, isNull } from 'drizzle-orm';
import type { Database } from '../index.js';
import { proposals, proposalMarkets, proposalDependencies, proposalAnalogs } from '../schema.js';

export interface CreateProposalParams {
  id?: string;
  gameId: string;
  name: string;
  description?: string | null;
  category: string;
  status?: string;
  estimatedCostMinor: bigint;
  currency: string;
  effortPersonDays: number;
  releaseWindowStart: string;
  releaseWindowEnd: string;
  scheduleConfidence?: number | null;
  stakeholderPriority?: number | null;
  openQuestions?: string[];
  assumptions?: string[];
  dataOrigin: string;
}

export interface UpdateProposalParams {
  name?: string;
  description?: string | null;
  category?: string;
  status?: string;
  estimatedCostMinor?: bigint;
  currency?: string;
  effortPersonDays?: number;
  releaseWindowStart?: string;
  releaseWindowEnd?: string;
  scheduleConfidence?: number | null;
  stakeholderPriority?: number | null;
  openQuestions?: string[];
  assumptions?: string[];
}

export interface CreateDependencyParams {
  id?: string;
  proposalId: string;
  kind: 'internal' | 'external';
  dependsOnProposalId?: string | null;
  description: string;
  status: 'satisfied' | 'pending' | 'blocked';
  isHardBlocking?: boolean;
}

export class ProposalRepository {
  constructor(private readonly db: Database) {}

  async listByWorkspace(workspaceId: string, includeDeleted = false) {
    if (includeDeleted) {
      return this.db.select().from(proposals).where(eq(proposals.workspaceId, workspaceId));
    }
    return this.db
      .select()
      .from(proposals)
      .where(and(eq(proposals.workspaceId, workspaceId), isNull(proposals.deletedAt)));
  }

  async getById(workspaceId: string, proposalId: string) {
    const [row] = await this.db
      .select()
      .from(proposals)
      .where(and(eq(proposals.workspaceId, workspaceId), eq(proposals.id, proposalId)))
      .limit(1);
    return row ?? null;
  }

  async countByWorkspace(workspaceId: string): Promise<number> {
    const list = await this.listByWorkspace(workspaceId, false);
    return list.length;
  }

  async create(workspaceId: string, params: CreateProposalParams) {
    const [created] = await this.db
      .insert(proposals)
      .values({
        id: params.id,
        workspaceId,
        gameId: params.gameId,
        name: params.name,
        description: params.description ?? null,
        category: params.category,
        status: params.status ?? 'candidate',
        estimatedCostMinor: params.estimatedCostMinor,
        currency: params.currency,
        effortPersonDays: params.effortPersonDays,
        releaseWindowStart: params.releaseWindowStart,
        releaseWindowEnd: params.releaseWindowEnd,
        scheduleConfidence: params.scheduleConfidence ?? null,
        stakeholderPriority: params.stakeholderPriority ?? null,
        openQuestions: params.openQuestions ?? [],
        assumptions: params.assumptions ?? [],
        dataOrigin: params.dataOrigin,
      })
      .returning();
    return created;
  }

  async update(workspaceId: string, proposalId: string, params: UpdateProposalParams) {
    const [updated] = await this.db
      .update(proposals)
      .set({
        ...params,
        updatedAt: new Date(),
      })
      .where(and(eq(proposals.workspaceId, workspaceId), eq(proposals.id, proposalId)))
      .returning();
    return updated ?? null;
  }

  async softDelete(workspaceId: string, proposalId: string): Promise<boolean> {
    const [updated] = await this.db
      .update(proposals)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(proposals.workspaceId, workspaceId), eq(proposals.id, proposalId)))
      .returning({ id: proposals.id });
    return !!updated;
  }

  // Proposal Markets (many-to-many)
  async getProposalMarketIds(workspaceId: string, proposalId: string): Promise<string[]> {
    const rows = await this.db
      .select({ marketId: proposalMarkets.marketId })
      .from(proposalMarkets)
      .where(
        and(
          eq(proposalMarkets.workspaceId, workspaceId),
          eq(proposalMarkets.proposalId, proposalId),
        ),
      );
    return rows.map((r) => r.marketId);
  }

  async setProposalMarkets(workspaceId: string, proposalId: string, marketIds: string[]) {
    // Delete existing
    await this.db
      .delete(proposalMarkets)
      .where(
        and(
          eq(proposalMarkets.workspaceId, workspaceId),
          eq(proposalMarkets.proposalId, proposalId),
        ),
      );

    if (marketIds.length === 0) return;

    await this.db.insert(proposalMarkets).values(
      marketIds.map((mId) => ({
        proposalId,
        marketId: mId,
        workspaceId,
      })),
    );
  }

  // Proposal Dependencies
  async listDependencies(workspaceId: string, proposalId: string) {
    return this.db
      .select()
      .from(proposalDependencies)
      .where(
        and(
          eq(proposalDependencies.workspaceId, workspaceId),
          eq(proposalDependencies.proposalId, proposalId),
        ),
      );
  }

  async listAllWorkspaceDependencies(workspaceId: string) {
    return this.db
      .select()
      .from(proposalDependencies)
      .where(eq(proposalDependencies.workspaceId, workspaceId));
  }

  async createDependency(workspaceId: string, params: CreateDependencyParams) {
    const [created] = await this.db
      .insert(proposalDependencies)
      .values({
        id: params.id,
        workspaceId,
        proposalId: params.proposalId,
        kind: params.kind,
        dependsOnProposalId: params.dependsOnProposalId ?? null,
        description: params.description,
        status: params.status,
        isHardBlocking: params.isHardBlocking ?? true,
      })
      .returning();
    return created;
  }

  async deleteDependency(workspaceId: string, dependencyId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(proposalDependencies)
      .where(
        and(
          eq(proposalDependencies.workspaceId, workspaceId),
          eq(proposalDependencies.id, dependencyId),
        ),
      );
    return (deleted.rowCount ?? 0) > 0;
  }

  // Proposal Analogs
  async getProposalAnalogIds(workspaceId: string, proposalId: string): Promise<string[]> {
    const rows = await this.db
      .select({ analogId: proposalAnalogs.historicalRecordId })
      .from(proposalAnalogs)
      .where(
        and(
          eq(proposalAnalogs.workspaceId, workspaceId),
          eq(proposalAnalogs.proposalId, proposalId),
        ),
      );
    return rows.map((r) => r.analogId);
  }

  async setProposalAnalogs(workspaceId: string, proposalId: string, historicalRecordIds: string[]) {
    await this.db
      .delete(proposalAnalogs)
      .where(
        and(
          eq(proposalAnalogs.workspaceId, workspaceId),
          eq(proposalAnalogs.proposalId, proposalId),
        ),
      );

    if (historicalRecordIds.length === 0) return;

    await this.db.insert(proposalAnalogs).values(
      historicalRecordIds.map((recId) => ({
        proposalId,
        historicalRecordId: recId,
        workspaceId,
      })),
    );
  }
}
