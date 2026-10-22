// apps/api/src/services/lifecycle-service.ts
import { eq, and, lt } from 'drizzle-orm';
import type { Database } from '../db/index.js';
import { proposals, decisionRankings, qlooQueries } from '../db/schema.js';
import { ProposalRepository, WorkspaceRepository } from '../db/repositories/index.js';

export class LifecycleService {
  private proposalRepo: ProposalRepository;
  private workspaceRepo: WorkspaceRepository;

  constructor(private readonly db: Database) {
    this.proposalRepo = new ProposalRepository(db);
    this.workspaceRepo = new WorkspaceRepository(db);
  }

  /**
   * API-18: Safe Proposal Deletion.
   * If proposal is referenced by any decision run rankings, it is soft-deleted (deleted_at set).
   * Otherwise, it is hard-deleted with cascading references.
   */
  async deleteProposal(workspaceId: string, proposalId: string): Promise<{ softDeleted: boolean }> {
    // Check if referenced in decision_rankings
    const [referenced] = await this.db
      .select({ id: decisionRankings.id })
      .from(decisionRankings)
      .where(
        and(
          eq(decisionRankings.workspaceId, workspaceId),
          eq(decisionRankings.proposalId, proposalId),
        ),
      )
      .limit(1);

    if (referenced) {
      // Soft-delete to preserve immutable historical decision runs
      await this.proposalRepo.softDelete(workspaceId, proposalId);
      return { softDeleted: true };
    }

    // Hard-delete
    await this.db
      .delete(proposals)
      .where(and(eq(proposals.workspaceId, workspaceId), eq(proposals.id, proposalId)));
    return { softDeleted: false };
  }

  /**
   * TTL Purge: Deletes expired workspaces and all cascading tenant records.
   */
  async purgeExpiredWorkspaces(): Promise<number> {
    return this.workspaceRepo.purgeExpired();
  }

  /**
   * Raw Response Retention: Nulls out raw Qloo JSON payloads older than retentionDays
   * while preserving normalized items and query metadata.
   */
  async purgeExpiredRawResponses(retentionDays = 14): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const updated = await this.db
      .update(qlooQueries)
      .set({ rawResponse: null })
      .where(lt(qlooQueries.retrievedAt, cutoff))
      .returning({ id: qlooQueries.id });
    return updated.length;
  }
}
