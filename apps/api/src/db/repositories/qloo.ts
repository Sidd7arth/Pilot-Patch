// apps/api/src/db/repositories/qloo.ts
import { eq, and, desc, gt } from 'drizzle-orm';
import type { Database } from '../index.js';
import { qlooQueries, qlooEvidenceItems } from '../schema.js';

export interface InsertQlooQueryParams {
  id?: string;
  workspaceId?: string | null;
  purpose: string;
  endpoint: string;
  sanitizedParams: Record<string, unknown>;
  requestFingerprint: string;
  status: string;
  httpStatus?: number | null;
  errorClass?: string | null;
  errorMessage?: string | null;
  retrievedAt: Date;
  durationMs: number;
  attempts?: number;
  adapterVersion: string;
  qlooRequestId?: string | null;
  qlooApiVersion?: string | null;
  schemaMismatch?: boolean;
  cacheState: string;
  dataOrigin: 'live_qloo' | 'cached_qloo';
  rawResponse?: Record<string, unknown> | null;
  rawTruncated?: boolean;
  signalConfigVersion?: string | null;
}

export interface InsertEvidenceItemParams {
  id?: string;
  workspaceId?: string | null;
  queryId: string;
  position: number;
  qlooEntityId: string;
  entityName: string;
  entityType: string;
  entityAttributes?: Record<string, unknown>;
  rawScoreFields?: Record<string, unknown>;
  scoreSemantics?: string;
  dataOrigin: string;
}

/**
 * Immutable, insert-only repository for Qloo queries and evidence items.
 * Per DATABASE.md §4.10, §4.11: Records are immutable after insert.
 * No update or delete operations are exposed.
 */
export class QlooRepository {
  constructor(private readonly db: Database) {}

  // -------------------------------------------------------------------------
  // qloo_queries (insert-only)
  // -------------------------------------------------------------------------

  async insertQuery(params: InsertQlooQueryParams) {
    if ((params.dataOrigin as string) === 'test_fixture') {
      throw new Error('SEC-INVARIANT: test_fixture data_origin is forbidden in database');
    }

    const [created] = await this.db
      .insert(qlooQueries)
      .values({
        id: params.id,
        workspaceId: params.workspaceId ?? null,
        purpose: params.purpose,
        endpoint: params.endpoint,
        sanitizedParams: params.sanitizedParams,
        requestFingerprint: params.requestFingerprint,
        status: params.status,
        httpStatus: params.httpStatus ?? null,
        errorClass: params.errorClass ?? null,
        errorMessage: params.errorMessage ?? null,
        retrievedAt: params.retrievedAt,
        durationMs: params.durationMs,
        attempts: params.attempts ?? 1,
        adapterVersion: params.adapterVersion,
        qlooRequestId: params.qlooRequestId ?? null,
        qlooApiVersion: params.qlooApiVersion ?? null,
        schemaMismatch: params.schemaMismatch ?? false,
        cacheState: params.cacheState,
        dataOrigin: params.dataOrigin,
        rawResponse: params.rawResponse ?? null,
        rawTruncated: params.rawTruncated ?? false,
        signalConfigVersion: params.signalConfigVersion ?? null,
      })
      .returning();
    return created;
  }

  async getQueryById(id: string) {
    const [row] = await this.db.select().from(qlooQueries).where(eq(qlooQueries.id, id)).limit(1);
    return row ?? null;
  }

  async findLatestByFingerprint(fingerprint: string) {
    const [row] = await this.db
      .select()
      .from(qlooQueries)
      .where(eq(qlooQueries.requestFingerprint, fingerprint))
      .orderBy(desc(qlooQueries.retrievedAt))
      .limit(1);
    return row ?? null;
  }

  async findFreshByFingerprint(fingerprint: string, maxAgeMs: number) {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const [row] = await this.db
      .select()
      .from(qlooQueries)
      .where(
        and(eq(qlooQueries.requestFingerprint, fingerprint), gt(qlooQueries.retrievedAt, cutoff)),
      )
      .orderBy(desc(qlooQueries.retrievedAt))
      .limit(1);
    return row ?? null;
  }

  async listQueriesByWorkspace(workspaceId: string, limit = 50) {
    return this.db
      .select()
      .from(qlooQueries)
      .where(eq(qlooQueries.workspaceId, workspaceId))
      .orderBy(desc(qlooQueries.retrievedAt))
      .limit(limit);
  }

  // -------------------------------------------------------------------------
  // qloo_evidence_items (insert-only)
  // -------------------------------------------------------------------------

  async insertEvidenceItems(items: InsertEvidenceItemParams[]) {
    if (items.length === 0) return [];

    for (const item of items) {
      if ((item.dataOrigin as string) === 'test_fixture') {
        throw new Error('SEC-INVARIANT: test_fixture data_origin is forbidden in database');
      }
    }

    return this.db
      .insert(qlooEvidenceItems)
      .values(
        items.map((item) => ({
          id: item.id,
          workspaceId: item.workspaceId ?? null,
          queryId: item.queryId,
          position: item.position,
          qlooEntityId: item.qlooEntityId,
          entityName: item.entityName,
          entityType: item.entityType,
          entityAttributes: item.entityAttributes ?? {},
          rawScoreFields: item.rawScoreFields ?? {},
          scoreSemantics: item.scoreSemantics ?? 'unverified',
          dataOrigin: item.dataOrigin,
        })),
      )
      .returning();
  }

  async listEvidenceForQuery(queryId: string) {
    return this.db
      .select()
      .from(qlooEvidenceItems)
      .where(eq(qlooEvidenceItems.queryId, queryId))
      .orderBy(qlooEvidenceItems.position);
  }

  async listEvidenceForWorkspace(workspaceId: string, limit = 100) {
    return this.db
      .select()
      .from(qlooEvidenceItems)
      .where(eq(qlooEvidenceItems.workspaceId, workspaceId))
      .limit(limit);
  }
}
