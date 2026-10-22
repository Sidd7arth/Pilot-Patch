// apps/api/src/modules/qloo/qloo-service.ts
import type {
  QlooClient,
  EntitySearchRequest,
  InsightsRequest,
  QlooEntityType,
} from '@patchpilot/qloo-client';
import { computeRequestFingerprint } from '@patchpilot/qloo-client';
import type { Database } from '../../db/index.js';
import {
  QlooRepository,
  WorkspaceRepository,
  CulturalReferenceRepository,
  CulturalSignalRepository,
  MarketRepository,
  ProposalRepository,
  IntegrationEventRepository,
} from '../../db/repositories/index.js';
import type { AppConfig } from '../../config/env.js';
import { mapInsightsToSignal, SIGNAL_CONFIG_VERSION } from '@patchpilot/shared';

export class QuotaExceededError extends Error {
  constructor(workspaceId: string, limit: number) {
    super(`Workspace ${workspaceId} has exceeded its daily Qloo quota limit of ${limit} calls`);
    this.name = 'QuotaExceededError';
  }
}

export class QlooService {
  private qlooRepo: QlooRepository;
  private workspaceRepo: WorkspaceRepository;
  private referenceRepo: CulturalReferenceRepository;
  private signalRepo: CulturalSignalRepository;
  private marketRepo: MarketRepository;
  private proposalRepo: ProposalRepository;
  private eventRepo: IntegrationEventRepository;

  constructor(
    _db: Database,
    private readonly qlooClient: QlooClient,
    private readonly config: AppConfig,
  ) {
    this.qlooRepo = new QlooRepository(_db);
    this.workspaceRepo = new WorkspaceRepository(_db);
    this.referenceRepo = new CulturalReferenceRepository(_db);
    this.signalRepo = new CulturalSignalRepository(_db);
    this.marketRepo = new MarketRepository(_db);
    this.proposalRepo = new ProposalRepository(_db);
    this.eventRepo = new IntegrationEventRepository(_db);
  }

  // -------------------------------------------------------------------------
  // Quota & Cache Gate
  // -------------------------------------------------------------------------

  private async checkQuota(workspaceId: string): Promise<void> {
    const ws = await this.workspaceRepo.getById(workspaceId);
    if (!ws) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const dailyLimit = this.config.QLOO_WORKSPACE_DAILY_CALLS;
    if (ws.qlooCallsUsedToday >= dailyLimit) {
      await this.eventRepo.insert({
        workspaceId,
        kind: 'quota_exceeded',
        detail: { used: ws.qlooCallsUsedToday, limit: dailyLimit },
      });
      throw new QuotaExceededError(workspaceId, dailyLimit);
    }
  }

  // -------------------------------------------------------------------------
  // Entity Resolution (P2-05 / API-03)
  // -------------------------------------------------------------------------

  async resolveReference(workspaceId: string, referenceId: string) {
    const ref = await this.referenceRepo.getById(workspaceId, referenceId);
    if (!ref) {
      throw new Error(`Cultural reference ${referenceId} not found`);
    }

    const typeHint: QlooEntityType = (ref.entityTypeHint as QlooEntityType) || 'urn:entity:artist';

    const endpoint = '/search';
    const params: Record<string, string | string[] | undefined> = {
      query: ref.label,
      types: typeHint,
    };

    const fingerprint = computeRequestFingerprint(endpoint, params);
    const ttlMs = this.config.QLOO_CACHE_TTL_HOURS * 60 * 60 * 1000;

    // 1. Check cache
    const cached = await this.qlooRepo.findFreshByFingerprint(fingerprint, ttlMs);
    let queryRow = cached;
    let evidenceItems = cached ? await this.qlooRepo.listEvidenceForQuery(cached.id) : [];

    if (!queryRow) {
      // 2. Outbound call under quota
      await this.checkQuota(workspaceId);

      const startTime = Date.now();
      const searchReq: EntitySearchRequest = {
        query: ref.label,
        types: typeHint,
      };

      const result = await this.qlooClient.searchEntities(searchReq);
      const durationMs = Date.now() - startTime;

      const createdQuery = await this.qlooRepo.insertQuery({
        workspaceId,
        purpose: 'resolve_entity',
        endpoint,
        sanitizedParams: params,
        requestFingerprint: fingerprint,
        status: result.status,
        retrievedAt: new Date(),
        durationMs,
        attempts: result.provenance.attempts,
        adapterVersion: '1.0.0',
        cacheState: 'live',
        dataOrigin: 'live_qloo',
        rawResponse: result.provenance.rawResponse as Record<string, unknown> | null,
        signalConfigVersion: SIGNAL_CONFIG_VERSION,
      });

      if (!createdQuery) {
        throw new Error('Failed to create Qloo query record in database');
      }

      queryRow = createdQuery;
      await this.workspaceRepo.incrementQlooCalls(workspaceId);

      if (result.ok && result.data && result.data.length > 0) {
        evidenceItems = await this.qlooRepo.insertEvidenceItems(
          result.data.map((item, idx) => ({
            workspaceId,
            queryId: createdQuery.id,
            position: idx,
            qlooEntityId: item.entityId,
            entityName: item.name,
            entityType: item.types,
            dataOrigin: 'live_qloo',
          })),
        );
      }
    }

    if (!queryRow) {
      throw new Error('Failed to resolve reference: query record could not be established');
    }

    // 3. Determine resolution status from evidence
    if (!evidenceItems || evidenceItems.length === 0) {
      return this.referenceRepo.upsertResolution(workspaceId, referenceId, {
        status: 'unresolved',
        queryId: queryRow.id,
        dataOrigin: queryRow.dataOrigin,
        resolvedAt: new Date(),
      });
    }

    // Auto-resolve if exactly 1 match OR exact normalized name match
    const normalizedInput = ref.label.trim().toLowerCase();
    const exactMatch = evidenceItems.find(
      (e) => e.entityName.trim().toLowerCase() === normalizedInput,
    );

    if (evidenceItems.length === 1 || exactMatch) {
      const chosen = exactMatch ?? evidenceItems[0];
      if (!chosen) {
        throw new Error('Candidate item unexpectedly missing');
      }
      return this.referenceRepo.upsertResolution(workspaceId, referenceId, {
        status: 'resolved',
        chosenQlooEntityId: chosen.qlooEntityId,
        chosenEntityName: chosen.entityName,
        chosenEntityType: chosen.entityType,
        chosenBy: 'auto',
        candidates: evidenceItems.map((e) => ({
          qlooEntityId: e.qlooEntityId,
          name: e.entityName,
          type: e.entityType,
          position: e.position,
        })),
        queryId: queryRow.id,
        dataOrigin: queryRow.dataOrigin,
        resolvedAt: new Date(),
      });
    }

    // Multiple candidates without single exact match -> ambiguous
    return this.referenceRepo.upsertResolution(workspaceId, referenceId, {
      status: 'ambiguous',
      candidates: evidenceItems.map((e) => ({
        qlooEntityId: e.qlooEntityId,
        name: e.entityName,
        type: e.entityType,
        position: e.position,
      })),
      queryId: queryRow.id,
      dataOrigin: queryRow.dataOrigin,
      resolvedAt: new Date(),
    });
  }

  // -------------------------------------------------------------------------
  // Manual Chooser (API-03)
  // -------------------------------------------------------------------------

  async chooseResolution(workspaceId: string, referenceId: string, chosenQlooEntityId: string) {
    const resolution = await this.referenceRepo.getResolution(workspaceId, referenceId);
    if (!resolution) {
      throw new Error(`Resolution for reference ${referenceId} not found`);
    }

    const candidate = resolution.candidates.find((c) => c.qlooEntityId === chosenQlooEntityId);
    if (!candidate) {
      throw new Error(
        `Candidate ${chosenQlooEntityId} is not among the resolved candidates for reference ${referenceId}`,
      );
    }

    return this.referenceRepo.upsertResolution(workspaceId, referenceId, {
      status: 'resolved',
      chosenQlooEntityId: candidate.qlooEntityId,
      chosenEntityName: candidate.name,
      chosenEntityType: candidate.type,
      chosenBy: 'user',
      candidates: resolution.candidates,
      queryId: resolution.queryId,
      dataOrigin: resolution.dataOrigin,
      resolvedAt: new Date(),
    });
  }

  // -------------------------------------------------------------------------
  // Evidence Refresh (P2-05 / API-04)
  // -------------------------------------------------------------------------

  async refreshProposalEvidence(workspaceId: string, proposalId: string) {
    const proposal = await this.proposalRepo.getById(workspaceId, proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // 1. Get proposal markets
    const marketIds = await this.proposalRepo.getProposalMarketIds(workspaceId, proposalId);
    const allMarkets = await this.marketRepo.listByWorkspace(workspaceId);
    const targetMarkets = allMarkets.filter((m) => marketIds.includes(m.id));

    // 2. Get proposal resolved cultural theme references
    const themeRefs = await this.referenceRepo.listByWorkspace(workspaceId, {
      ownerType: 'proposal',
      ownerId: proposalId,
      role: 'cultural_theme',
    });

    const resolvedThemes: Array<{ label: string; qlooEntityId: string }> = [];
    for (const ref of themeRefs) {
      const res = await this.referenceRepo.getResolution(workspaceId, ref.id);
      if (res && res.status === 'resolved' && res.chosenQlooEntityId) {
        resolvedThemes.push({
          label: ref.label,
          qlooEntityId: res.chosenQlooEntityId,
        });
      }
    }

    if (resolvedThemes.length === 0 || targetMarkets.length === 0) {
      return {
        proposalId,
        signalsGenerated: 0,
        reason: resolvedThemes.length === 0 ? 'no_resolved_references' : 'no_target_markets',
      };
    }

    const derivedSignals = [];

    // 3. For each target market × resolved theme reference: execute Strategy S1
    for (const market of targetMarkets) {
      for (const theme of resolvedThemes) {
        const endpoint = '/v2/insights';
        const params: Record<string, string | string[] | undefined> = {
          anchorEntities: theme.qlooEntityId,
          targetType: 'urn:entity:artist',
          locationQuery: market.countryCode || undefined,
        };

        const fingerprint = computeRequestFingerprint(endpoint, params);
        const ttlMs = this.config.QLOO_CACHE_TTL_HOURS * 60 * 60 * 1000;

        const queryRow = await this.qlooRepo.findFreshByFingerprint(fingerprint, ttlMs);
        let evidenceItems = queryRow ? await this.qlooRepo.listEvidenceForQuery(queryRow.id) : [];

        let freshness: 'live' | 'cached_fresh' = 'cached_fresh';

        if (!queryRow) {
          await this.checkQuota(workspaceId);

          const startTime = Date.now();
          const insightsReq: InsightsRequest = {
            anchorEntities: [theme.qlooEntityId],
            targetType: 'urn:entity:artist',
            locationQuery: market.countryCode || undefined,
          };

          const result = await this.qlooClient.getInsights(insightsReq);
          const durationMs = Date.now() - startTime;

          const createdQuery = await this.qlooRepo.insertQuery({
            workspaceId,
            purpose: 'insights_s1',
            endpoint,
            sanitizedParams: params,
            requestFingerprint: fingerprint,
            status: result.status,
            retrievedAt: new Date(),
            durationMs,
            attempts: result.provenance.attempts,
            adapterVersion: '1.0.0',
            cacheState: 'live',
            dataOrigin: 'live_qloo',
            rawResponse: result.provenance.rawResponse as Record<string, unknown> | null,
            signalConfigVersion: SIGNAL_CONFIG_VERSION,
          });

          if (!createdQuery) {
            throw new Error('Failed to create insights query record in database');
          }

          await this.workspaceRepo.incrementQlooCalls(workspaceId);
          freshness = 'live';

          if (result.ok && result.data && result.data.length > 0) {
            evidenceItems = await this.qlooRepo.insertEvidenceItems(
              result.data.map((item, idx) => ({
                workspaceId,
                queryId: createdQuery.id,
                position: idx,
                qlooEntityId: item.entityId,
                entityName: item.name,
                entityType: 'urn:entity:artist',
                rawScoreFields: { score: item.affinity },
                dataOrigin: 'live_qloo',
              })),
            );
          }
        }

        if (evidenceItems.length > 0) {
          const affinities = evidenceItems
            .map((e) => (e.rawScoreFields as Record<string, unknown>).score)
            .filter((s): s is number => typeof s === 'number');

          const avgAffinity =
            affinities.length > 0
              ? affinities.reduce((acc, v) => acc + v, 0) / affinities.length
              : undefined;

          const mapped = mapInsightsToSignal(evidenceItems, avgAffinity);

          const signal = await this.signalRepo.createSignalWithEvidence(
            workspaceId,
            {
              proposalId,
              marketId: market.id,
              strategy: 'S1',
              direction: mapped.direction,
              strengthBand: mapped.strengthBand,
              strengthValue: mapped.strengthValue !== null ? String(mapped.strengthValue) : null,
              basis: `Evidence from ${evidenceItems.length} cultural entities referencing ${theme.label}`,
              freshness,
              signalConfigVersion: SIGNAL_CONFIG_VERSION,
            },
            evidenceItems.map((e) => e.id),
          );

          derivedSignals.push(signal);
        }
      }
    }

    return {
      proposalId,
      signalsGenerated: derivedSignals.length,
      signals: derivedSignals,
    };
  }

  // -------------------------------------------------------------------------
  // /qloo/status Probe (P2-07 / API-12, API-17)
  // -------------------------------------------------------------------------

  async getStatus(workspaceId?: string) {
    const probeRes = await this.qlooClient.probe();
    const isReachable = probeRes.ok && probeRes.status === 'success';

    await this.eventRepo.insert({
      workspaceId: workspaceId ?? null,
      kind: isReachable ? 'probe_success' : 'probe_failure',
      detail: {
        latencyMs: probeRes.provenance.durationMs,
        status: probeRes.status,
      },
    });

    let quotaInfo: { usedToday: number; dailyLimit: number } | null = null;
    if (workspaceId) {
      const ws = await this.workspaceRepo.getById(workspaceId);
      if (ws) {
        quotaInfo = {
          usedToday: ws.qlooCallsUsedToday,
          dailyLimit: this.config.QLOO_WORKSPACE_DAILY_CALLS,
        };
      }
    }

    return {
      configured: Boolean(
        this.config.QLOO_API_KEY &&
        this.config.QLOO_API_KEY.trim().length > 0 &&
        !this.config.QLOO_API_KEY.includes('replace-with'),
      ),
      reachable: isReachable,
      latencyMs: probeRes.provenance.durationMs,
      status: probeRes.status,
      circuitBreaker: this.qlooClient.getCircuitBreakerState(),
      quota: quotaInfo,
      adapterVersion: '1.0.0',
    };
  }
}
