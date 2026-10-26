// apps/api/src/config/env.ts
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .default('postgres://user:password@localhost:5432/patchpilot'),
    SESSION_SECRET: z
      .string()
      .min(32, 'SESSION_SECRET must be at least 32 characters')
      .default('development-secret-must-be-32-chars-long!'),
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
    QLOO_API_KEY: z.string().optional().default(''),
    QLOO_API_BASE_URL: z
      .string()
      .url('QLOO_API_BASE_URL must be a valid URL')
      .default('https://hackathon.api.qloo.com'),
    QLOO_TIMEOUT_MS: z.coerce.number().default(10000),
    QLOO_MAX_RETRIES: z.coerce.number().default(2),
    QLOO_MAX_CONCURRENCY: z.coerce.number().default(3),
    QLOO_CACHE_TTL_HOURS: z.coerce.number().default(24),
    QLOO_NEGATIVE_CACHE_TTL_HOURS: z.coerce.number().default(1),
    QLOO_WORKSPACE_DAILY_CALLS: z.coerce.number().default(150),
    QLOO_GLOBAL_DAILY_CALLS: z.coerce.number().default(2000),
    DEMO_ACCESS_CODE: z.string().optional().default(''),
    WORKSPACE_TTL_DAYS: z.coerce.number().default(7),
    BRIEF_NARRATIVE_MODE: z.enum(['none', 'llm']).default('none'),
    LLM_PROVIDER: z.string().optional().default(''),
    LLM_API_KEY: z.string().optional().default(''),
    LLM_MODEL: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      if (
        data.NODE_ENV === 'production' &&
        data.SESSION_SECRET === 'development-secret-must-be-32-chars-long!'
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Production environments must configure a custom SESSION_SECRET',
      path: ['SESSION_SECRET'],
    },
  );

export type AppConfig = z.infer<typeof envSchema>;

export class ConfigValidationError extends Error {
  public readonly invalidFields: string[];

  constructor(invalidFields: string[], message: string) {
    super(message);
    this.name = 'ConfigValidationError';
    this.invalidFields = invalidFields;
  }
}

/**
 * Loads and validates environment variables.
 * SEC-10: On failure, prints and reports variable NAMES and rules ONLY, NEVER values.
 */
export function loadConfig(rawEnv: Record<string, string | undefined> = process.env): AppConfig {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues.map((issue) => {
      const fieldPath = issue.path.join('.');
      return `${fieldPath}: ${issue.message}`;
    });

    const fieldNames = result.error.issues.map((issue) => issue.path.join('.'));

    // Secure error: never leak sensitive raw input values
    const safeErrorMessage = `Environment configuration validation failed for: [${fieldNames.join(', ')}]. Issues: ${errorDetails.join('; ')}`;
    throw new ConfigValidationError(fieldNames, safeErrorMessage);
  }

  return result.data;
}
