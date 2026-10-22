// packages/qloo-client/src/types.ts
import type { QlooEntityType } from './endpoints.js';

export type QlooFailureStatus =
  | 'unsupported'
  | 'invalid_request'
  | 'failed_auth'
  | 'failed_rate_limited'
  | 'failed_timeout'
  | 'failed_network'
  | 'failed_upstream'
  | 'not_configured';

export interface QlooErrorInfo {
  code: string;
  message: string;
  safeDetails?: unknown;
}

export interface QlooProvenance {
  endpoint: string;
  sanitizedParams: Record<string, string | string[]>;
  requestFingerprint: string;
  httpStatus: number | null;
  retrievedAt: string;
  durationMs: number;
  attempts: number;
  adapterVersion: string;
  qloo?: {
    requestId?: string | undefined;
    apiVersion?: string | undefined;
  } | undefined;
  rawResponse?: unknown;
  schemaMismatch?: boolean | undefined;
}

export type QlooResult<T> =
  | { ok: true; status: 'success' | 'empty'; data: T; provenance: QlooProvenance }
  | { ok: false; status: QlooFailureStatus; error: QlooErrorInfo; provenance: QlooProvenance };

export interface CallContext {
  workspaceId?: string | undefined;
  requestId?: string | undefined;
  bypassCache?: boolean | undefined;
}

export interface EntitySearchRequest {
  query: string;
  types: QlooEntityType;
  page?: number | undefined;
}

export interface EntityCandidate {
  entityId: string;
  name: string;
  types: string;
  popularity?: number | undefined;
  properties?: Record<string, unknown> | undefined;
}

export interface InsightsRequest {
  anchorEntities: string[]; // UUIDs
  targetType: QlooEntityType;
  candidateEntities?: string[] | undefined; // UUIDs for option ranking
  locationQuery?: string | undefined; // Country / Market hint (e.g. US, Japan, Brazil, India)
}

export interface InsightItem {
  entityId: string;
  name: string;
  affinity: number; // 0..1
  rank: number; // 1-based position in query
}

export interface ProbeInfo {
  version: string;
  status: string;
}

export interface QlooClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  maxConcurrency?: number;
  breakerThreshold?: number;
  breakerCooldownMs?: number;
}

export interface QlooClient {
  searchEntities(
    req: EntitySearchRequest,
    ctx?: CallContext,
  ): Promise<QlooResult<EntityCandidate[]>>;
  getInsights(req: InsightsRequest, ctx?: CallContext): Promise<QlooResult<InsightItem[]>>;
  probe(ctx?: CallContext): Promise<QlooResult<ProbeInfo>>;
}
