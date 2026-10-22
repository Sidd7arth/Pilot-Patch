// apps/api/src/db/repositories/historical.ts
import { eq, and } from 'drizzle-orm';
import type { Database } from '../index.js';
import { historicalRecords } from '../schema.js';

export interface CreateHistoricalRecordParams {
  id?: string;
  title: string;
  contentCategory: string;
  releaseDate?: string | null;
  metricName: string;
  metricUnit: string;
  metricValue: string;
  baselineValue: string;
  periodNote?: string | null;
  notes?: string | null;
  dataOrigin: string; // 'user_supplied' | 'synthetic_demo'
}

export class HistoricalRecordRepository {
  constructor(private readonly db: Database) {}

  async listByWorkspace(workspaceId: string) {
    return this.db
      .select()
      .from(historicalRecords)
      .where(eq(historicalRecords.workspaceId, workspaceId));
  }

  async getById(workspaceId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(historicalRecords)
      .where(and(eq(historicalRecords.workspaceId, workspaceId), eq(historicalRecords.id, id)))
      .limit(1);
    return row ?? null;
  }

  async create(workspaceId: string, params: CreateHistoricalRecordParams) {
    const [created] = await this.db
      .insert(historicalRecords)
      .values({
        id: params.id,
        workspaceId,
        title: params.title,
        contentCategory: params.contentCategory,
        releaseDate: params.releaseDate ?? null,
        metricName: params.metricName,
        metricUnit: params.metricUnit,
        metricValue: params.metricValue,
        baselineValue: params.baselineValue,
        periodNote: params.periodNote ?? null,
        notes: params.notes ?? null,
        dataOrigin: params.dataOrigin,
      })
      .returning();
    return created;
  }
}
