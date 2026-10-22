// apps/api/src/index.ts
import { loadConfig } from './config/env.js';
import { createApp } from './http/app.js';
import { createLogger } from './observability/logger.js';

const config = loadConfig();
const logger = createLogger({ level: config.LOG_LEVEL });
const app = createApp({ config, logger });

const server = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    `PatchPilot API listening on port ${config.PORT}`,
  );
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
