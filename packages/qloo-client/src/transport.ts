// packages/qloo-client/src/transport.ts
import { QLOO_AUTH_HEADER } from './endpoints.js';

export interface TransportRequest {
  url: string;
  method?: 'GET';
  apiKey: string;
  timeoutMs: number;
}

export interface TransportResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
  durationMs: number;
  attempts: number;
}

export class TransportError extends Error {
  constructor(
    public readonly status: number | null,
    public readonly code: string,
    message: string,
    public readonly attempts: number,
    public readonly durationMs: number,
    public readonly rawError?: unknown,
  ) {
    super(message);
    this.name = 'TransportError';
  }
}

/**
 * Calculates exponential backoff delay with random jitter.
 */
function calculateBackoffDelay(
  attempt: number,
  baseMs: number = 300,
  maxMs: number = 5000,
): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  // Add 10-25% random jitter
  const jitter = exp * (0.1 + Math.random() * 0.15);
  return Math.floor(exp + jitter);
}

/**
 * Parses the Retry-After header value in seconds or HTTP Date.
 */
function parseRetryAfter(headerValue: string | null | undefined): number | null {
  if (!headerValue) return null;
  const seconds = parseInt(headerValue, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const dateMs = Date.parse(headerValue);
  if (!isNaN(dateMs)) {
    const delay = dateMs - Date.now();
    return delay > 0 ? delay : 0;
  }
  return null;
}

/**
 * Executes an HTTP GET request to Qloo with timeouts, bounded retries, and backoff.
 */
export async function executeFetch(
  req: TransportRequest,
  options: {
    maxRetries?: number | undefined;
    fetchFn?: typeof fetch | undefined;
  } = {},
): Promise<TransportResponse> {
  const maxRetries = options.maxRetries ?? 2;
  const customFetch = options.fetchFn ?? fetch;
  const startTime = Date.now();

  let lastError: unknown = null;
  let lastStatus: number | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), req.timeoutMs);

    try {
      const response = await customFetch(req.url, {
        method: req.method || 'GET',
        headers: {
          [QLOO_AUTH_HEADER]: req.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      lastStatus = response.status;

      // Extract response headers safely (redacting set-cookie)
      const resHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        if (key.toLowerCase() !== 'set-cookie') {
          resHeaders[key.toLowerCase()] = val;
        }
      });

      // Parse JSON body safely
      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      // Check HTTP Status
      if (response.ok) {
        return {
          status: response.status,
          data: responseData,
          headers: resHeaders,
          durationMs,
          attempts,
        };
      }

      // 4xx errors: Client errors must NEVER be retried (except 429)
      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 403 ||
        response.status === 404
      ) {
        throw new TransportError(
          response.status,
          response.status === 401 || response.status === 403 ? 'FAILED_AUTH' : 'INVALID_REQUEST',
          `Qloo HTTP ${response.status}: Client request not accepted`,
          attempts,
          durationMs,
          responseData,
        );
      }

      // 429 Rate limited or 5xx server errors: check retries
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const retryAfterDelay = parseRetryAfter(resHeaders['retry-after']);
          const delay = retryAfterDelay ?? calculateBackoffDelay(attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new TransportError(
          response.status,
          response.status === 429 ? 'FAILED_RATE_LIMITED' : 'FAILED_UPSTREAM',
          `Qloo HTTP ${response.status}: ${response.status === 429 ? 'Rate limit exceeded' : 'Upstream service error'}`,
          attempts,
          durationMs,
          responseData,
        );
      }

      // Unhandled non-2xx status
      throw new TransportError(
        response.status,
        'FAILED_UPSTREAM',
        `Qloo HTTP ${response.status}`,
        attempts,
        durationMs,
        responseData,
      );
    } catch (err: unknown) {
      clearTimeout(timer);
      lastError = err;

      if (err instanceof TransportError) {
        throw err;
      }

      // Network error or timeout (AbortError)
      const isTimeout =
        err instanceof Error &&
        (err.name === 'AbortError' || err.message.toLowerCase().includes('aborted'));
      const durationMs = Date.now() - startTime;

      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw new TransportError(
        lastStatus,
        isTimeout ? 'FAILED_TIMEOUT' : 'FAILED_NETWORK',
        isTimeout
          ? `Request timed out after ${req.timeoutMs}ms`
          : 'Network connection to Qloo failed',
        attempts,
        durationMs,
        err,
      );
    }
  }

  throw new TransportError(
    lastStatus,
    'FAILED_NETWORK',
    'Exhausted retries',
    attempts,
    Date.now() - startTime,
    lastError,
  );
}
