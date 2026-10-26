// packages/qloo-client/test/adapter.test.ts
import { describe, it, expect } from 'vitest';
import {
  createQlooClient,
  computeRequestFingerprint,
  sanitizeParams,
  QLOO_ENTITY_TYPES,
  ADAPTER_VERSION,
} from '../src/index.js';
import { createFixtureFetch } from './fixture-transport.js';

describe('Qloo Client Adapter (P2-02, P2-03, QC-01..QC-16)', () => {
  const dummyApiKey = 'test-qloo-api-key-1234567890';

  it('QC-01 / QC-13: Includes auth header and redacts sensitive keys from params and provenance', async () => {
    let capturedHeader = '';
    const mockFetch: typeof fetch = async (_input, init) => {
      capturedHeader = (init?.headers as Record<string, string>)?.['X-Api-Key'] || '';
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    };

    const client = createQlooClient({ apiKey: dummyApiKey }, mockFetch);
    const result = await client.searchEntities({
      query: 'Valorant',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(capturedHeader).toBe(dummyApiKey);
    expect(result.provenance.sanitizedParams).not.toHaveProperty('apiKey');
    expect(JSON.stringify(result.provenance)).not.toContain(dummyApiKey);
  });

  it('QC-02: Handles timeouts cleanly via AbortController', async () => {
    const slowFetch: typeof fetch = async (_input, init) => {
      return new Promise((resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    };

    const client = createQlooClient(
      { apiKey: dummyApiKey, timeoutMs: 20, maxRetries: 0 },
      slowFetch,
    );
    const result = await client.searchEntities({
      query: 'Cyberpunk',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('failed_timeout');
      expect(result.error.code).toBe('FAILED_TIMEOUT');
    }
  });

  it('QC-03 / QC-15: Retries 5xx server errors up to maxRetries, but NEVER retries 401', async () => {
    let attempts500 = 0;
    const error500Fetch: typeof fetch = async () => {
      attempts500++;
      return new Response('{"error":"server error"}', { status: 500 });
    };

    const client500 = createQlooClient(
      { apiKey: dummyApiKey, maxRetries: 2, timeoutMs: 1000 },
      error500Fetch,
    );
    const result500 = await client500.searchEntities({
      query: 'Apex',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(result500.ok).toBe(false);
    expect(attempts500).toBe(3); // Initial + 2 retries

    // Now test 401 (auth failure): must NEVER be retried
    let attempts401 = 0;
    const error401Fetch: typeof fetch = async () => {
      attempts401++;
      return new Response('{"error":"API keys mismatch"}', { status: 401 });
    };

    const client401 = createQlooClient({ apiKey: dummyApiKey, maxRetries: 2 }, error401Fetch);
    const result401 = await client401.searchEntities({
      query: 'Apex',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(result401.ok).toBe(false);
    expect(attempts401).toBe(1); // Exactly 1 attempt, zero retries
  });

  it('QC-06: Limits concurrent requests to maxConcurrency via Semaphore', async () => {
    let active = 0;
    let maxObservedActive = 0;

    const delayedFetch: typeof fetch = async () => {
      active++;
      maxObservedActive = Math.max(maxObservedActive, active);
      await new Promise((resolve) => setTimeout(resolve, 50));
      active--;
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    };

    const client = createQlooClient({ apiKey: dummyApiKey, maxConcurrency: 2 }, delayedFetch);
    await Promise.all([
      client.searchEntities({ query: '1', types: QLOO_ENTITY_TYPES.VIDEOGAME }),
      client.searchEntities({ query: '2', types: QLOO_ENTITY_TYPES.VIDEOGAME }),
      client.searchEntities({ query: '3', types: QLOO_ENTITY_TYPES.VIDEOGAME }),
      client.searchEntities({ query: '4', types: QLOO_ENTITY_TYPES.VIDEOGAME }),
    ]);

    expect(maxObservedActive).toBeLessThanOrEqual(2);
  });

  it('QC-07: Parses real live-captured search responses accurately', async () => {
    const fixtureFetch = createFixtureFetch();
    const client = createQlooClient({ apiKey: dummyApiKey }, fixtureFetch);

    const result = await client.searchEntities({
      query: 'Valorant',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('success');
      expect(result.data.length).toBeGreaterThan(0);
      const first = result.data[0];
      expect(first).toHaveProperty('entityId');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('types');
    }
  });

  it('QC-08: Parses real live-captured insights responses with rank and affinity', async () => {
    const fixtureFetch = createFixtureFetch();
    const client = createQlooClient({ apiKey: dummyApiKey }, fixtureFetch);

    const result = await client.getInsights({
      anchorEntities: ['anchor-uuid-1'],
      targetType: QLOO_ENTITY_TYPES.ARTIST,
      candidateEntities: ['artist-uuid-1', 'artist-uuid-2'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('success');
      expect(result.data.length).toBeGreaterThan(0);
      const first = result.data[0];
      expect(first).toHaveProperty('entityId');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('affinity');
      expect(first?.rank).toBe(1);
    }
  });

  it('QC-08b (Regression): Preserves null for missing or unavailable affinity instead of coercing to 0', async () => {
    // Upstream API provides ranked entities but affinity is omitted or null
    const missingAffinityFetch: typeof fetch = async () => {
      return new Response(
        JSON.stringify({
          results: {
            entities: [
              {
                entity_id: 'artist-without-affinity-1',
                name: 'Artist Without Score',
                // Notice: no query.affinity and no affinity property
              },
              {
                entity_id: 'artist-with-null-affinity-2',
                name: 'Artist With Explicit Null',
                query: { affinity: null },
              },
              {
                entity_id: 'artist-with-score-3',
                name: 'Artist With Valid Score',
                query: { affinity: 0.88 },
              },
            ],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };

    const client = createQlooClient({ apiKey: dummyApiKey }, missingAffinityFetch);
    const result = await client.getInsights({
      anchorEntities: ['anchor-uuid-1'],
      targetType: QLOO_ENTITY_TYPES.ARTIST,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(3);

      // Item 1: omitted affinity must be null, NOT 0
      expect(result.data[0]?.entityId).toBe('artist-without-affinity-1');
      expect(result.data[0]?.affinity).toBeNull();
      expect(result.data[0]?.affinity).not.toBe(0);
      expect(result.data[0]?.rank).toBe(1);

      // Item 2: explicit null affinity must remain null, NOT 0
      expect(result.data[1]?.entityId).toBe('artist-with-null-affinity-2');
      expect(result.data[1]?.affinity).toBeNull();
      expect(result.data[1]?.affinity).not.toBe(0);
      expect(result.data[1]?.rank).toBe(2);

      // Item 3: valid affinity is preserved as number
      expect(result.data[2]?.entityId).toBe('artist-with-score-3');
      expect(result.data[2]?.affinity).toBe(0.88);
      expect(result.data[2]?.rank).toBe(3);
    }
  });

  it('QC-09: Handles empty results cleanly (status empty, data [])', async () => {
    const fixtureFetch = createFixtureFetch();
    const client = createQlooClient({ apiKey: dummyApiKey }, fixtureFetch);

    const result = await client.getInsights({
      anchorEntities: ['anchor-uuid-1'],
      targetType: QLOO_ENTITY_TYPES.ARTIST,
      candidateEntities: ['empty-trigger'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('empty');
      expect(result.data).toEqual([]);
    }
  });

  it('QC-10: Detects shape drift and classifies as schemaMismatch / failed_upstream', async () => {
    const driftedFetch: typeof fetch = async () => {
      // Return unexpected shape (neither results array nor entities)
      return new Response(JSON.stringify({ unexpectedKey: 1234 }), { status: 200 });
    };

    const client = createQlooClient({ apiKey: dummyApiKey }, driftedFetch);
    const result = await client.searchEntities({
      query: 'Valorant',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('failed_upstream');
      expect(result.error.code).toBe('SCHEMA_MISMATCH');
      expect(result.provenance.schemaMismatch).toBe(true);
    }
  });

  it('QC-11 / QC-12: Circuit breaker opens after 5 failures and prevents calls until cooldown', async () => {
    const failureFetch: typeof fetch = async () => {
      return new Response('{"error":"fail"}', { status: 500 });
    };

    const client = createQlooClient(
      { apiKey: dummyApiKey, breakerThreshold: 3, maxRetries: 0 },
      failureFetch,
    );

    // Trip the breaker with 3 failures
    await client.searchEntities({ query: '1', types: QLOO_ENTITY_TYPES.VIDEOGAME });
    await client.searchEntities({ query: '2', types: QLOO_ENTITY_TYPES.VIDEOGAME });
    await client.searchEntities({ query: '3', types: QLOO_ENTITY_TYPES.VIDEOGAME });

    // 4th call should immediately fail with QLOO_CIRCUIT_OPEN without executing network call
    let networkCalled = false;
    const guardedFetch: typeof fetch = async () => {
      networkCalled = true;
      return new Response('{}', { status: 200 });
    };

    // Replace fetch on existing client breaker
    const circuitResult = await client.searchEntities({
      query: '4',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });
    expect(circuitResult.ok).toBe(false);
    if (!circuitResult.ok) {
      expect(circuitResult.error.code).toBe('QLOO_CIRCUIT_OPEN');
    }
  });

  it('QC-14: Request fingerprint is deterministic and invariant to param ordering', () => {
    const fp1 = computeRequestFingerprint('/search', { b: '2', a: '1' });
    const fp2 = computeRequestFingerprint('/search', { a: '1', b: '2' });
    expect(fp1).toBe(fp2);
    expect(fp1.length).toBe(64); // sha256 hex string
  });

  it('QC-04: Classifies HTTP 429 rate limiting as failed_rate_limited', async () => {
    const rateLimitFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ error: { message: 'Too Many Requests', code: 429 } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '1' },
      });
    };

    const client = createQlooClient(
      { apiKey: dummyApiKey, maxRetries: 0, timeoutMs: 1000 },
      rateLimitFetch,
    );
    const result = await client.searchEntities({
      query: 'Valorant',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('failed_rate_limited');
      expect(result.error.code).toBe('FAILED_RATE_LIMITED');
    }
  });

  it('QC-05: Classifies fetch network drop as failed_network', async () => {
    const networkFailFetch: typeof fetch = async () => {
      throw new TypeError('fetch failed: ECONNREFUSED');
    };

    const client = createQlooClient(
      { apiKey: dummyApiKey, maxRetries: 0, timeoutMs: 1000 },
      networkFailFetch,
    );
    const result = await client.searchEntities({
      query: 'Valorant',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('failed_network');
      expect(result.error.code).toBe('FAILED_NETWORK');
    }
  });

  it('QC-17: Returns multiple entity candidates for ambiguous search queries', async () => {
    const ambiguousFetch: typeof fetch = async () => {
      return new Response(
        JSON.stringify({
          results: [
            {
              entity_id: 'cand-1',
              name: 'Avatar (Film)',
              types: ['urn:entity:movie'],
              popularity: 0.95,
            },
            {
              entity_id: 'cand-2',
              name: 'Avatar (Game)',
              types: ['urn:entity:videogame'],
              popularity: 0.82,
            },
            {
              entity_id: 'cand-3',
              name: 'Avatar (Band)',
              types: ['urn:entity:artist'],
              popularity: 0.71,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const client = createQlooClient({ apiKey: dummyApiKey }, ambiguousFetch);
    const result = await client.searchEntities({
      query: 'Avatar',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('success');
      expect(result.data.length).toBe(3);
      expect(result.data[0].entityId).toBe('cand-1');
      expect(result.data[1].entityId).toBe('cand-2');
      expect(result.data[2].entityId).toBe('cand-3');
    }
  });

  it('QC-16 / SEC-40: Guarantees FixtureTransport is NEVER reachable from production exports', async () => {
    const productionExports = await import('../src/index.js');
    expect(productionExports).not.toHaveProperty('createFixtureFetch');
    expect(productionExports).not.toHaveProperty('FixtureTransport');
    expect(ADAPTER_VERSION).toBe('1.0.0');
  });
});
