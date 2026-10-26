// apps/api/test/integration/error-envelope.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/http/app.js';
import { loadConfig } from '../../src/config/env.js';
import { AppError } from '../../src/http/error-handler.js';

describe('Error Envelope and Security Sanitization (P1-03 / SEC-06)', () => {
  const config = loadConfig({
    DATABASE_URL: 'postgres://test:test@localhost:5432/patchpilot',
    SESSION_SECRET: 'test-session-secret-must-be-32-chars-long!',
    QLOO_API_BASE_URL: 'https://api.example.com',
  });

  it('returns 404 with structured error envelope for unknown routes', async () => {
    const app = createApp({ config });
    const res = await request(app).get('/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error).toHaveProperty('requestId');
  });

  it('formats custom AppError correctly without leaking internal internals', async () => {
    const app = createApp({
      config,
      configureRoutes(router) {
        router.get('/test-error', (_req, _res, next) => {
          next(
            new AppError({
              code: 'VALIDATION_ERROR',
              httpStatus: 400,
              safeMessage: 'Invalid input parameters supplied',
              details: { field: 'name', issue: 'too short' },
            }),
          );
        });
      },
    });

    const res = await request(app).get('/test-error');
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input parameters supplied',
      details: { field: 'name', issue: 'too short' },
      requestId: expect.any(String),
    });
  });

  it('SEC-06: Sanitizes unexpected errors and never leaks sensitive messages, SQL, or stack traces', async () => {
    const SECRET_KEY = 'secret-sentinel-key-should-never-leak-12345';
    const app = createApp({
      config,
      configureRoutes(router) {
        router.get('/test-crash', () => {
          throw new Error(`CRITICAL DB ERROR WITH SECRET: ${SECRET_KEY}`);
        });
      },
    });

    const res = await request(app).get('/test-crash');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe(
      'An unexpected internal error occurred. Please try again later.',
    );

    // Crucial security assertion: sentinel secret MUST NOT appear anywhere in the response body
    const responseText = JSON.stringify(res.body);
    expect(responseText).not.toContain(SECRET_KEY);
    expect(responseText).not.toContain('stack');
  });

  it('SEC-16: Enforces 100 KB payload limit on request bodies', async () => {
    const app = createApp({
      config,
      configureRoutes(router) {
        router.post('/test-body', (req, res) => {
          res.json({ receivedBytes: JSON.stringify(req.body).length });
        });
      },
    });

    // Create payload larger than 100 KB
    const largeString = 'a'.repeat(120 * 1024);
    const res = await request(app)
      .post('/test-body')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ data: largeString }));

    // Expect entity too large (413)
    expect(res.status).toBe(413);
  });
});
