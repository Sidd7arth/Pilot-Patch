// apps/api/src/db/repositories/events.ts
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../index.js';
import { integrationEvents } from '../schema.js';

export interface InsertEventParams {
  id?: string;
  workspaceId?: string | null;
  kind:
    | 'probe_success'
    | 'probe_failure'
    | 'breaker_open'
    | 'breaker_close'
    | 'quota_exceeded'
    | 'schema_mismatch';
  detail?: Record<string, unknown>;
}

export class IntegrationEventRepository {
  constructor(private readonly db: Database) {}

  async insert(params: InsertEventParams) {
    const [created] = await this.db
      .insert(integrationEvents)
      .values({
        id: params.id,
        workspaceId: params.workspaceId ?? null,
        kind: params.kind,
        detail: params.detail ?? {},
      })
      .returning();
    return created;
  }

  async listByWorkspace(workspaceId: string, limit = 50) {
    return this.db
      .select()
      .from(integrationEvents)
      .where(eq(integrationEvents.workspaceId, workspaceId))
      .orderBy(desc(integrationEvents.createdAt))
      .limit(limit);
  }

  async listRecentGlobal(limit = 50) {
    return this.db
      .select()
      .from(integrationEvents)
      .orderBy(desc(integrationEvents.createdAt))
      .limit(limit);
  }
}
