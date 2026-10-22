// apps/api/src/db/repositories/constraints.ts
import { eq } from 'drizzle-orm';
import type { Database } from '../index.js';
import { planningConstraints } from '../schema.js';

export interface UpsertConstraintsParams {
  currency: string;
  budgetTotalMinor: bigint;
  contingencyReserveMinor?: bigint;
  capacityPersonDays?: number | null;
  capacityEnforcement?: string;
  horizonStart: string;
  horizonEnd: string;
  horizonEnforcement?: string;
  maxSelections?: number | null;
  weights: Record<string, number>;
  minCoverage?: string;
}

export class PlanningConstraintsRepository {
  constructor(private readonly db: Database) {}

  async getByWorkspace(workspaceId: string) {
    const [row] = await this.db
      .select()
      .from(planningConstraints)
      .where(eq(planningConstraints.workspaceId, workspaceId))
      .limit(1);
    return row ?? null;
  }

  async upsert(workspaceId: string, params: UpsertConstraintsParams) {
    const existing = await this.getByWorkspace(workspaceId);
    if (existing) {
      const [updated] = await this.db
        .update(planningConstraints)
        .set({
          currency: params.currency,
          budgetTotalMinor: params.budgetTotalMinor,
          contingencyReserveMinor: params.contingencyReserveMinor ?? 0n,
          capacityPersonDays: params.capacityPersonDays ?? null,
          capacityEnforcement: params.capacityEnforcement ?? 'hard',
          horizonStart: params.horizonStart,
          horizonEnd: params.horizonEnd,
          horizonEnforcement: params.horizonEnforcement ?? 'hard',
          maxSelections: params.maxSelections ?? null,
          weights: params.weights,
          minCoverage: params.minCoverage ?? '0.500',
          updatedAt: new Date(),
        })
        .where(eq(planningConstraints.workspaceId, workspaceId))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(planningConstraints)
      .values({
        workspaceId,
        currency: params.currency,
        budgetTotalMinor: params.budgetTotalMinor,
        contingencyReserveMinor: params.contingencyReserveMinor ?? 0n,
        capacityPersonDays: params.capacityPersonDays ?? null,
        capacityEnforcement: params.capacityEnforcement ?? 'hard',
        horizonStart: params.horizonStart,
        horizonEnd: params.horizonEnd,
        horizonEnforcement: params.horizonEnforcement ?? 'hard',
        maxSelections: params.maxSelections ?? null,
        weights: params.weights,
        minCoverage: params.minCoverage ?? '0.500',
      })
      .returning();
    return created;
  }
}
