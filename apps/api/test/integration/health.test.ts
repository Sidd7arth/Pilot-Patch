// apps/api/test/integration/health.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/http/app.js';
import { loadConfig } from '../../src/config/env.js';

describe('Health and Readiness Probes (P1-03)', () => {
  const config = loadConfig({
    SESSION_SECRET: 'test-session-secret-must-be-32-chars-long!',
    QLOO_API_KEY: 'test-qloo-key',
  });

  it('GET /health returns 200 with status ok', async () => {
    const app = createApp({ config });
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET /ready returns 200 when dependencies are ready', async () => {
    const app = createApp({
      config,
      dbCheck: async () => true,
    });
    const res = await request(app).get('/ready');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ready');
    expect(res.body.checks).toEqual({
      database: 'ok',
      config: 'ok',
    });
  });

  it('GET /ready returns 503 when database is not ready', async () => {
    const app = createApp({
      config,
      dbCheck: async () => false,
    });
    const res = await request(app).get('/ready');

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('status', 'not_ready');
    expect(res.body.checks.database).toBe('unreachable');
  });
});
