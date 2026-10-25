// apps/api/src/index.ts
import { loadConfig } from './config/env.js';
import { createApp } from './http/app.js';
import { createLogger } from './observability/logger.js';
import { getDb, closeDbPool } from './db/index.js';
import { createQlooClient } from '@patchpilot/qloo-client';
import { QlooService } from './modules/qloo/index.js';

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

const app = createApp({
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

const server = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    `PatchPilot API listening on port ${config.PORT}`,
  );
});

async function shutdown() {
  logger.info('Shutdown signal received, closing resources gracefully');
  server.close(async () => {
    await closeDbPool();
    logger.info('HTTP server and database pool closed cleanly');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
