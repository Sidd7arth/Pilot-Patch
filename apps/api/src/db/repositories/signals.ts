// apps/api/src/db/repositories/signals.ts
import { eq, and, isNull } from 'drizzle-orm';
import type { Database } from '../index.js';
import { culturalSignals, culturalSignalEvidence } from '../schema.js';

export interface CreateSignalParams {
  id?: string;
  proposalId: string;
  marketId: string;
  strategy: 'S1' | 'S2' | 'S3';
  direction: 'supports' | 'not_observed';
  strengthBand?: 'strong' | 'moderate' | 'weak' | null;
  strengthValue?: string | null;
  basis: string;
  freshness: 'live' | 'cached_fresh' | 'cached_stale';
  signalConfigVersion: string;
}

export class CulturalSignalRepository {
  constructor(private readonly db: Database) {}

  async listActiveByWorkspace(workspaceId: string) {
    return this.db
      .select()
      .from(culturalSignals)
      .where(
        and(eq(culturalSignals.workspaceId, workspaceId), isNull(culturalSignals.supersededBy)),
      );
  }

  async listByWorkspace(workspaceId: string) {
    return this.listActiveByWorkspace(workspaceId);
  }

  async listActiveForProposal(workspaceId: string, proposalId: string) {
    return this.db
      .select()
      .from(culturalSignals)
      .where(
        and(
          eq(culturalSignals.workspaceId, workspaceId),
          eq(culturalSignals.proposalId, proposalId),
          isNull(culturalSignals.supersededBy),
        ),
      );
  }

  async listByProposal(workspaceId: string, proposalId: string) {
    return this.listActiveForProposal(workspaceId, proposalId);
  }

  async getSignalById(workspaceId: string, signalId: string) {
    const [row] = await this.db
      .select()
      .from(culturalSignals)
      .where(and(eq(culturalSignals.workspaceId, workspaceId), eq(culturalSignals.id, signalId)))
      .limit(1);
    return row ?? null;
  }

  async createSignalWithEvidence(
    workspaceId: string,
    params: CreateSignalParams,
    evidenceItemIds: string[],
  ) {
    if (evidenceItemIds.length === 0) {
      throw new Error(
        'REFERENTIAL-INVARIANT: Every cultural_signal must link to >= 1 evidence item',
      );
    }

    // Mark previous active signal for (proposal, market, strategy) as superseded
    const [existingActive] = await this.db
      .select()
      .from(culturalSignals)
      .where(
        and(
          eq(culturalSignals.workspaceId, workspaceId),
          eq(culturalSignals.proposalId, params.proposalId),
          eq(culturalSignals.marketId, params.marketId),
          eq(culturalSignals.strategy, params.strategy),
          isNull(culturalSignals.supersededBy),
        ),
      )
      .limit(1);

    const [created] = await this.db
      .insert(culturalSignals)
      .values({
        id: params.id,
        workspaceId,
        proposalId: params.proposalId,
        marketId: params.marketId,
        strategy: params.strategy,
        direction: params.direction,
        strengthBand: params.strengthBand ?? null,
        strengthValue: params.strengthValue ?? null,
        basis: params.basis,
        freshness: params.freshness,
        signalConfigVersion: params.signalConfigVersion,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create cultural signal');
    }

    // Link evidence items
    await this.db.insert(culturalSignalEvidence).values(
      evidenceItemIds.map((evidenceItemId) => ({
        signalId: created.id,
        evidenceItemId,
      })),
    );

    // If an existing signal was superseded, link it
    if (existingActive) {
      await this.db
        .update(culturalSignals)
        .set({ supersededBy: created.id })
        .where(eq(culturalSignals.id, existingActive.id));
    }

    return created;
  }

  async listEvidenceItemIdsForSignal(signalId: string): Promise<string[]> {
    const rows = await this.db
      .select({ evidenceItemId: culturalSignalEvidence.evidenceItemId })
      .from(culturalSignalEvidence)
      .where(eq(culturalSignalEvidence.signalId, signalId));
    return rows.map((r) => r.evidenceItemId);
  }
}
