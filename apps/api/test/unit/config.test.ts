// apps/api/test/unit/config.test.ts
import { describe, it, expect } from 'vitest';
import { loadConfig, ConfigValidationError } from '../../src/config/env.js';

describe('Configuration Loader & Security (P1-04 / DEP-01 / SEC-10)', () => {
  it('loads valid configuration with defaults', () => {
    const config = loadConfig({
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      SESSION_SECRET: 'a'.repeat(32),
      ALLOWED_ORIGINS: 'http://localhost:3000',
      QLOO_API_BASE_URL: 'https://api.example.com',
    });

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(4000);
    expect(config.SESSION_SECRET).toBe('a'.repeat(32));
    expect(config.QLOO_CACHE_TTL_HOURS).toBe(24);
  });

  it('SEC-10: Throws ConfigValidationError with field names on invalid config and NEVER prints sensitive values', () => {
    const SENSITIVE_SENTINEL_INPUT = 'dummy-sentinel-test-password-12345';

    try {
      loadConfig({
        SESSION_SECRET: 'short', // invalid: must be >= 32 chars
        LOG_LEVEL: 'invalid-log-level' as unknown as 'info',
        QLOO_API_BASE_URL: 'not-a-valid-url',
        // Include the sensitive secret in a field
        DATABASE_URL: SENSITIVE_SENTINEL_INPUT,
      });
      expect.fail('Should have thrown ConfigValidationError');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      const configError = err as ConfigValidationError;

      // Assert error contains field names
      expect(configError.invalidFields).toContain('SESSION_SECRET');
      expect(configError.invalidFields).toContain('LOG_LEVEL');
      expect(configError.invalidFields).toContain('QLOO_API_BASE_URL');

      // Assert sensitive value is NEVER in error message
      expect(configError.message).not.toContain(SENSITIVE_SENTINEL_INPUT);
    }
  });
});
