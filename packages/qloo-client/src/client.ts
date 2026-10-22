// packages/qloo-client/src/client.ts
import {
  QLOO_HOSTS,
  QLOO_ENDPOINTS,
  QLOO_SEARCH_PARAMS,
  QLOO_INSIGHTS_PARAMS,
} from './endpoints.js';
import type {
  QlooClient,
  QlooClientConfig,
  EntitySearchRequest,
  EntityCandidate,
  InsightsRequest,
  InsightItem,
  ProbeInfo,
  QlooResult,
  CallContext,
  QlooProvenance,
} from './types.js';
import { executeFetch, TransportError } from './transport.js';
import { computeRequestFingerprint } from './fingerprint.js';
import { sanitizeParams } from './redact.js';
import { Semaphore } from './semaphore.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { parseSearchResponse } from './parse/search.js';
import { parseInsightsResponse } from './parse/insights.js';
import { parseProbeResponse } from './parse/probe.js';

export const ADAPTER_VERSION = '1.0.0';

export class DefaultQlooClient implements QlooClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly semaphore: Semaphore;
  private readonly breaker: CircuitBreaker;
  private readonly customFetch?: typeof fetch | undefined;

  constructor(config: QlooClientConfig, customFetch?: typeof fetch | undefined) {
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error('QlooClient requires a non-empty apiKey');
    }

    this.apiKey = config.apiKey.trim();
    this.baseUrl = (config.baseUrl || QLOO_HOSTS.HACKATHON).replace(/\/$/, '');
    this.timeoutMs = config.timeoutMs ?? 10000;
    this.maxRetries = config.maxRetries ?? 2;
    this.semaphore = new Semaphore(config.maxConcurrency ?? 3);
    this.breaker = new CircuitBreaker(
      config.breakerThreshold ?? 5,
      config.breakerCooldownMs ?? 30000,
    );
    this.customFetch = customFetch;
  }

  async searchEntities(
    req: EntitySearchRequest,
    _ctx?: CallContext,
  ): Promise<QlooResult<EntityCandidate[]>> {
    const endpoint = QLOO_ENDPOINTS.SEARCH;
    const rawParams: Record<string, string | undefined> = {
      [QLOO_SEARCH_PARAMS.QUERY]: req.query,
      [QLOO_SEARCH_PARAMS.TYPES]: req.types,
      [QLOO_SEARCH_PARAMS.PAGE]: req.page ? String(req.page) : undefined,
    };

    const sanitized = sanitizeParams(rawParams);
    const fingerprint = computeRequestFingerprint(endpoint, rawParams);

    // Check circuit breaker
    if (!this.breaker.canExecute()) {
      return {
        ok: false,
        status: 'failed_upstream',
        error: {
          code: 'QLOO_CIRCUIT_OPEN',
          message: 'Qloo circuit breaker open due to consecutive upstream failures',
        },
        provenance: this.createProvenance(endpoint, sanitized, fingerprint, null, 0, 0),
      };
    }

    const release = await this.semaphore.acquire();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    for (const [k, v] of Object.entries(rawParams)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }

    try {
      const response = await executeFetch(
        {
          url: url.toString(),
          apiKey: this.apiKey,
          timeoutMs: this.timeoutMs,
        },
        {
          maxRetries: this.maxRetries,
          fetchFn: this.customFetch,
        },
      );

      this.breaker.recordSuccess();

      const parsed = parseSearchResponse(response.data);
      const provenance = this.createProvenance(
        endpoint,
        sanitized,
        fingerprint,
        response.status,
        response.durationMs,
        response.attempts,
        response.data,
        parsed.schemaMismatch,
      );

      if (!parsed.success || parsed.schemaMismatch) {
        return {
          ok: false,
          status: 'failed_upstream',
          error: {
            code: 'SCHEMA_MISMATCH',
            message: 'Unexpected upstream response structure from Qloo search',
          },
          provenance,
        };
      }

      if (parsed.candidates.length === 0) {
        return {
          ok: true,
          status: 'empty',
          data: [],
          provenance,
        };
      }

      return {
        ok: true,
        status: 'success',
        data: parsed.candidates,
        provenance,
      };
    } catch (err: unknown) {
      this.breaker.recordFailure();
      return this.handleError(err, endpoint, sanitized, fingerprint);
    } finally {
      release();
    }
  }

  async getInsights(req: InsightsRequest, _ctx?: CallContext): Promise<QlooResult<InsightItem[]>> {
    const endpoint = QLOO_ENDPOINTS.INSIGHTS_V2;
    const rawParams: Record<string, string | undefined> = {
      [QLOO_INSIGHTS_PARAMS.INTEREST_ENTITIES]: req.anchorEntities.join(','),
      [QLOO_INSIGHTS_PARAMS.FILTER_TYPE]: req.targetType,
      [QLOO_INSIGHTS_PARAMS.FILTER_RESULTS_ENTITIES]: req.candidateEntities?.join(','),
      [QLOO_INSIGHTS_PARAMS.LOCATION_QUERY]: req.locationQuery,
    };

    const sanitized = sanitizeParams(rawParams);
    const fingerprint = computeRequestFingerprint(endpoint, rawParams);

    if (!this.breaker.canExecute()) {
      return {
        ok: false,
        status: 'failed_upstream',
        error: {
          code: 'QLOO_CIRCUIT_OPEN',
          message: 'Qloo circuit breaker open due to consecutive upstream failures',
        },
        provenance: this.createProvenance(endpoint, sanitized, fingerprint, null, 0, 0),
      };
    }

    const release = await this.semaphore.acquire();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    for (const [k, v] of Object.entries(rawParams)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }

    try {
      const response = await executeFetch(
        {
          url: url.toString(),
          apiKey: this.apiKey,
          timeoutMs: this.timeoutMs,
        },
        {
          maxRetries: this.maxRetries,
          fetchFn: this.customFetch,
        },
      );

      this.breaker.recordSuccess();

      const parsed = parseInsightsResponse(response.data);
      const provenance = this.createProvenance(
        endpoint,
        sanitized,
        fingerprint,
        response.status,
        response.durationMs,
        response.attempts,
        response.data,
        parsed.schemaMismatch,
      );

      if (!parsed.success || parsed.schemaMismatch) {
        return {
          ok: false,
          status: 'failed_upstream',
          error: {
            code: 'SCHEMA_MISMATCH',
            message: 'Unexpected upstream response structure from Qloo insights',
          },
          provenance,
        };
      }

      if (parsed.items.length === 0) {
        return {
          ok: true,
          status: 'empty',
          data: [],
          provenance,
        };
      }

      return {
        ok: true,
        status: 'success',
        data: parsed.items,
        provenance,
      };
    } catch (err: unknown) {
      this.breaker.recordFailure();
      return this.handleError(err, endpoint, sanitized, fingerprint);
    } finally {
      release();
    }
  }

  async probe(_ctx?: CallContext): Promise<QlooResult<ProbeInfo>> {
    const endpoint = QLOO_ENDPOINTS.ROOT_PROBE;
    const sanitized = {};
    const fingerprint = computeRequestFingerprint(endpoint, {});

    const release = await this.semaphore.acquire();
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await executeFetch(
        {
          url,
          apiKey: this.apiKey,
          timeoutMs: this.timeoutMs,
        },
        {
          maxRetries: 1,
          fetchFn: this.customFetch,
        },
      );

      const parsed = parseProbeResponse(response.data);
      const provenance = this.createProvenance(
        endpoint,
        sanitized,
        fingerprint,
        response.status,
        response.durationMs,
        response.attempts,
        response.data,
      );

      return {
        ok: true,
        status: 'success',
        data: parsed.data,
        provenance,
      };
    } catch (err: unknown) {
      return this.handleError(err, endpoint, sanitized, fingerprint);
    } finally {
      release();
    }
  }

  private createProvenance(
    endpoint: string,
    sanitizedParams: Record<string, string | string[]>,
    requestFingerprint: string,
    httpStatus: number | null,
    durationMs: number,
    attempts: number,
    rawResponse?: unknown,
    schemaMismatch?: boolean,
  ): QlooProvenance {
    return {
      endpoint,
      sanitizedParams,
      requestFingerprint,
      httpStatus,
      retrievedAt: new Date().toISOString(),
      durationMs,
      attempts,
      adapterVersion: ADAPTER_VERSION,
      rawResponse,
      schemaMismatch,
    };
  }

  private handleError<T>(
    err: unknown,
    endpoint: string,
    sanitizedParams: Record<string, string | string[]>,
    fingerprint: string,
  ): QlooResult<T> {
    if (err instanceof TransportError) {
      const provenance = this.createProvenance(
        endpoint,
        sanitizedParams,
        fingerprint,
        err.status,
        err.durationMs,
        err.attempts,
        err.rawError,
      );

      let status: QlooResult<T>['status'] = 'failed_network';
      if (err.code === 'FAILED_AUTH') status = 'failed_auth';
      else if (err.code === 'FAILED_RATE_LIMITED') status = 'failed_rate_limited';
      else if (err.code === 'FAILED_TIMEOUT') status = 'failed_timeout';
      else if (err.code === 'INVALID_REQUEST') status = 'invalid_request';
      else if (err.code === 'FAILED_UPSTREAM') status = 'failed_upstream';

      return {
        ok: false,
        status,
        error: {
          code: err.code,
          message: err.message,
        },
        provenance,
      };
    }

    const message = err instanceof Error ? err.message : 'Unknown transport error';
    return {
      ok: false,
      status: 'failed_network',
      error: {
        code: 'NETWORK_ERROR',
        message,
      },
      provenance: this.createProvenance(endpoint, sanitizedParams, fingerprint, null, 0, 1),
    };
  }
}

export function createQlooClient(config: QlooClientConfig, customFetch?: typeof fetch): QlooClient {
  return new DefaultQlooClient(config, customFetch);
}
