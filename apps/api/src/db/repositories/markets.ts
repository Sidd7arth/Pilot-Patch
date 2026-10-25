// apps/api/src/db/repositories/markets.ts
import { eq, and } from 'drizzle-orm';
import type { Database } from '../index.js';
import { markets } from '../schema.js';

export interface CreateMarketParams {
  id?: string;
  gameId: string;
  name: string;
  countryCode?: string | null;
  regionLabel?: string | null;
  weight: string;
  qlooLocationHint?: string | null;
  audienceNotes?: string | null;
  dataOrigin: string;
}

export class MarketRepository {
  constructor(private readonly db: Database) {}

  async listByWorkspace(workspaceId: string) {
    return this.db.select().from(markets).where(eq(markets.workspaceId, workspaceId));
  }

  async getById(workspaceId: string, marketId: string) {
    const [row] = await this.db
      .select()
      .from(markets)
      .where(and(eq(markets.workspaceId, workspaceId), eq(markets.id, marketId)))
      .limit(1);
    return row ?? null;
  }

  async create(workspaceId: string, params: CreateMarketParams) {
    const [created] = await this.db
      .insert(markets)
      .values({
        id: params.id,
        workspaceId,
        gameId: params.gameId,
        name: params.name,
        countryCode: params.countryCode ?? null,
        regionLabel: params.regionLabel ?? null,
        weight: params.weight,
        qlooLocationHint: params.qlooLocationHint ?? null,
        audienceNotes: params.audienceNotes ?? null,
        dataOrigin: params.dataOrigin,
      })
      .returning();
    return created;
  }

  async delete(workspaceId: string, marketId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(markets)
      .where(and(eq(markets.workspaceId, workspaceId), eq(markets.id, marketId)))
      .returning({ id: markets.id });
    return deleted.length > 0;
  }

  async update(
    workspaceId: string,
    marketId: string,
    params: Partial<Omit<CreateMarketParams, 'id' | 'gameId'>>,
  ) {
    const [updated] = await this.db
      .update(markets)
      .set(params)
      .where(and(eq(markets.workspaceId, workspaceId), eq(markets.id, marketId)))
      .returning();
    return updated ?? null;
  }
}
