// packages/qloo-client/test/live.test.ts
import { describe, it, expect } from 'vitest';
import { createQlooClient, QLOO_ENTITY_TYPES, QLOO_HOSTS } from '../src/index.js';

describe('Live Qloo Adapter Integration (P2-08 / live)', () => {
  const apiKey = process.env.QLOO_API_KEY;
  const isKeyConfigured = Boolean(
    apiKey && !apiKey.includes('replace-with') && apiKey.trim().length > 10,
  );

  it.runIf(isKeyConfigured)('Live probe against official hackathon endpoint', async () => {
    const client = createQlooClient({
      apiKey: apiKey as string,
      baseUrl: QLOO_HOSTS.HACKATHON,
    });

    const result = await client.probe();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe('connected');
      expect(result.data.version).toMatch(/2\./);
    }
  });

  it.runIf(isKeyConfigured)('Live searchEntities resolves real videogame', async () => {
    const client = createQlooClient({
      apiKey: apiKey as string,
      baseUrl: QLOO_HOSTS.HACKATHON,
    });

    const result = await client.searchEntities({
      query: 'Valorant',
      types: QLOO_ENTITY_TYPES.VIDEOGAME,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('success');
      expect(result.data.length).toBeGreaterThan(0);
      const first = result.data[0];
      expect(first?.name.toLowerCase()).toContain('valorant');
      expect(first?.entityId).toMatch(/^[0-9a-fA-F-]{36}$/);
    }
  });

  it.runIf(isKeyConfigured)(
    'Live negative test classifies invalid API key as failed_auth',
    async () => {
      const client = createQlooClient({
        apiKey: 'deliberately-invalid-qloo-api-key',
        baseUrl: QLOO_HOSTS.HACKATHON,
        maxRetries: 0,
      });

      const result = await client.probe();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe('failed_auth');
      }
    },
  );
});
