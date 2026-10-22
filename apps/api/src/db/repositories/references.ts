// apps/api/src/db/repositories/references.ts
import { eq, and } from 'drizzle-orm';
import type { Database } from '../index.js';
import { culturalReferences, referenceResolutions } from '../schema.js';

export interface CreateReferenceParams {
  id?: string;
  ownerType: 'game' | 'proposal';
  gameId?: string | null;
  proposalId?: string | null;
  role: 'audience_anchor' | 'cultural_theme';
  label: string;
  entityTypeHint?: string | null;
  dataOrigin: string;
}

export interface UpsertResolutionParams {
  status: 'pending' | 'resolved' | 'ambiguous' | 'unresolved' | 'unsupported' | 'failed';
  chosenQlooEntityId?: string | null;
  chosenEntityName?: string | null;
  chosenEntityType?: string | null;
  chosenBy?: 'auto' | 'user' | null;
  candidates?: Array<{
    qlooEntityId: string;
    name: string;
    type: string;
    position: number;
  }>;
  queryId?: string | null;
  resolvedAt?: Date | null;
  dataOrigin: string;
}

export class CulturalReferenceRepository {
  constructor(private readonly db: Database) {}

  async listByWorkspace(
    workspaceId: string,
    filter?: {
      ownerType?: 'game' | 'proposal';
      ownerId?: string;
      role?: 'audience_anchor' | 'cultural_theme';
    },
  ) {
    const conditions = [eq(culturalReferences.workspaceId, workspaceId)];

    if (filter?.ownerType) {
      conditions.push(eq(culturalReferences.ownerType, filter.ownerType));
    }
    if (filter?.role) {
      conditions.push(eq(culturalReferences.role, filter.role));
    }
    if (filter?.ownerId) {
      if (filter.ownerType === 'game') {
        conditions.push(eq(culturalReferences.gameId, filter.ownerId));
      } else if (filter.ownerType === 'proposal') {
        conditions.push(eq(culturalReferences.proposalId, filter.ownerId));
      }
    }

    return this.db
      .select()
      .from(culturalReferences)
      .where(and(...conditions));
  }

  async getById(workspaceId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(culturalReferences)
      .where(and(eq(culturalReferences.workspaceId, workspaceId), eq(culturalReferences.id, id)))
      .limit(1);
    return row ?? null;
  }

  async create(workspaceId: string, params: CreateReferenceParams) {
    const [created] = await this.db
      .insert(culturalReferences)
      .values({
        id: params.id,
        workspaceId,
        ownerType: params.ownerType,
        gameId: params.gameId ?? null,
        proposalId: params.proposalId ?? null,
        role: params.role,
        label: params.label,
        entityTypeHint: params.entityTypeHint ?? null,
        dataOrigin: params.dataOrigin,
      })
      .returning();
    return created;
  }

  // Resolutions
  async getResolution(workspaceId: string, referenceId: string) {
    const [row] = await this.db
      .select()
      .from(referenceResolutions)
      .where(
        and(
          eq(referenceResolutions.workspaceId, workspaceId),
          eq(referenceResolutions.referenceId, referenceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async upsertResolution(workspaceId: string, referenceId: string, params: UpsertResolutionParams) {
    const existing = await this.getResolution(workspaceId, referenceId);
    if (existing) {
      const [updated] = await this.db
        .update(referenceResolutions)
        .set({
          status: params.status,
          chosenQlooEntityId: params.chosenQlooEntityId ?? null,
          chosenEntityName: params.chosenEntityName ?? null,
          chosenEntityType: params.chosenEntityType ?? null,
          chosenBy: params.chosenBy ?? null,
          candidates: params.candidates ?? existing.candidates,
          queryId: params.queryId ?? null,
          resolvedAt: params.resolvedAt ?? new Date(),
          dataOrigin: params.dataOrigin,
        })
        .where(
          and(
            eq(referenceResolutions.workspaceId, workspaceId),
            eq(referenceResolutions.referenceId, referenceId),
          ),
        )
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(referenceResolutions)
      .values({
        workspaceId,
        referenceId,
        status: params.status,
        chosenQlooEntityId: params.chosenQlooEntityId ?? null,
        chosenEntityName: params.chosenEntityName ?? null,
        chosenEntityType: params.chosenEntityType ?? null,
        chosenBy: params.chosenBy ?? null,
        candidates: params.candidates ?? [],
        queryId: params.queryId ?? null,
        resolvedAt: params.resolvedAt ?? new Date(),
        dataOrigin: params.dataOrigin,
      })
      .returning();
    return created;
  }

  async listReferencesWithResolutions(workspaceId: string) {
    const refs = await this.listByWorkspace(workspaceId);
    const result = [];
    for (const ref of refs) {
      const resolution = await this.getResolution(workspaceId, ref.id);
      result.push({
        reference: ref,
        resolution,
      });
    }
    return result;
  }
}
