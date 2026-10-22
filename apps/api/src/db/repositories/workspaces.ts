// apps/api/src/db/repositories/workspaces.ts
import { eq, lt } from 'drizzle-orm';
import type { Database } from '../index.js';
import { workspaces } from '../schema.js';

export interface CreateWorkspaceParams {
  id?: string;
  expiresAt: Date;
  demoSeeded?: boolean;
}

export class WorkspaceRepository {
  constructor(private readonly db: Database) {}

  async create(params: CreateWorkspaceParams) {
    const [created] = await this.db
      .insert(workspaces)
      .values({
        id: params.id,
        expiresAt: params.expiresAt,
        demoSeeded: params.demoSeeded ?? false,
      })
      .returning();
    return created;
  }

  async getById(id: string) {
    const [row] = await this.db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return row ?? null;
  }

  async incrementQlooCalls(id: string): Promise<number> {
    const ws = await this.getById(id);
    if (!ws) {
      throw new Error(`Workspace ${id} not found`);
    }

    // Reset window if > 24 hours
    const now = new Date();
    const windowStart = new Date(ws.qlooQuotaWindowStart);
    const windowElapsedMs = now.getTime() - windowStart.getTime();

    let newCount = ws.qlooCallsUsedToday + 1;
    let newStart = ws.qlooQuotaWindowStart;

    if (windowElapsedMs >= 24 * 60 * 60 * 1000) {
      newCount = 1;
      newStart = now;
    }

    const [updated] = await this.db
      .update(workspaces)
      .set({
        qlooCallsUsedToday: newCount,
        qlooQuotaWindowStart: newStart,
      })
      .where(eq(workspaces.id, id))
      .returning();

    return updated ? updated.qlooCallsUsedToday : newCount;
  }

  async purgeExpired(): Promise<number> {
    const now = new Date();
    const deleted = await this.db
      .delete(workspaces)
      .where(lt(workspaces.expiresAt, now))
      .returning({ id: workspaces.id });
    return deleted.length;
  }
}
