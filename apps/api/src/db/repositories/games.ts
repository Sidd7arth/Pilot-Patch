// apps/api/src/db/repositories/games.ts
import { eq, and } from 'drizzle-orm';
import type { Database } from '../index.js';
import { games } from '../schema.js';

export interface UpsertGameParams {
  name: string;
  description?: string | null;
  genreTags?: string[];
  platforms?: string[];
  dataOrigin: string;
}

export class GameRepository {
  constructor(private readonly db: Database) {}

  async getByWorkspace(workspaceId: string) {
    const [row] = await this.db
      .select()
      .from(games)
      .where(eq(games.workspaceId, workspaceId))
      .limit(1);
    return row ?? null;
  }

  async upsert(workspaceId: string, params: UpsertGameParams) {
    const existing = await this.getByWorkspace(workspaceId);
    if (existing) {
      const [updated] = await this.db
        .update(games)
        .set({
          name: params.name,
          description: params.description ?? null,
          genreTags: params.genreTags ?? existing.genreTags,
          platforms: params.platforms ?? existing.platforms,
          dataOrigin: params.dataOrigin,
          updatedAt: new Date(),
        })
        .where(and(eq(games.id, existing.id), eq(games.workspaceId, workspaceId)))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(games)
      .values({
        workspaceId,
        name: params.name,
        description: params.description ?? null,
        genreTags: params.genreTags ?? [],
        platforms: params.platforms ?? [],
        dataOrigin: params.dataOrigin,
      })
      .returning();
    return created;
  }
}
