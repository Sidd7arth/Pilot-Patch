// apps/api/src/serverless.ts
import type { Express, Request, Response } from 'express';
import { loadConfig } from './config/env.js';
import { createApp } from './http/app.js';
import { createLogger } from './observability/logger.js';
import { getDb } from './db/index.js';
import { createQlooClient } from '@patchpilot/qloo-client';
import { QlooService } from './modules/qloo/index.js';

let appInstance: Express | null = null;

export function getServerlessApp(): Express {
  if (appInstance) return appInstance;

  const config = loadConfig();
  const logger = createLogger({ level: config.LOG_LEVEL });
  const db = getDb(config.DATABASE_URL);

  let qlooService: QlooService | undefined;
  if (
    config.QLOO_API_KEY &&
    config.QLOO_API_KEY.trim().length > 0 &&
    !config.QLOO_API_KEY.includes('replace-with')
  ) {
    const qlooClient = createQlooClient({
      apiKey: config.QLOO_API_KEY,
      baseUrl: config.QLOO_API_BASE_URL,
      timeoutMs: config.QLOO_TIMEOUT_MS,
      maxRetries: config.QLOO_MAX_RETRIES,
      maxConcurrency: config.QLOO_MAX_CONCURRENCY,
    });
    qlooService = new QlooService(db, qlooClient, config);
  }

  appInstance = createApp({
    config,
    logger,
    db,
    qlooService,
    dbCheck: async () => {
      try {
        const pool = (await import('./db/index.js')).getDbPool();
        await pool.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },
  });

  return appInstance;
}

export default function handler(req: Request, res: Response) {
  const app = getServerlessApp();
  return app(req, res);
}
