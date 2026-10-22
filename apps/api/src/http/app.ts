// apps/api/src/http/app.ts
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'crypto';
import type { AppConfig } from '../config/env.js';
import { createLogger } from '../observability/logger.js';
import { createErrorHandler } from './error-handler.js';
import type { QlooService } from '../modules/qloo/index.js';
import { createQlooRouter } from './routes/qloo.js';

export interface AppDependencies {
  config: AppConfig;
  logger?: ReturnType<typeof createLogger> | undefined;
  dbCheck?: (() => Promise<boolean>) | undefined;
  qlooService?: QlooService | undefined;
  configureRoutes?: ((app: Express) => void) | undefined;
}

export function createApp(deps: AppDependencies): Express {
  const app = express();
  const log = deps.logger || createLogger({ level: deps.config.LOG_LEVEL });

  // 1. Request ID middleware (SEC-15 / observability)
  app.use((req, res, next) => {
    const existingId = req.headers['x-request-id'];
    const requestId = typeof existingId === 'string' ? existingId : randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // 2. Pino HTTP logger with redaction (SEC-05)
  app.use(
    pinoHttp({
      logger: log,
      genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    }),
  );

  // 3. Helmet security headers (SEC-13)
  app.use(
    helmet({
      contentSecurityPolicy: false, // CSP handled by Next.js web tier
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 4. CORS allowlist (SEC-12)
  const allowedOrigins = deps.config.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin) || deps.config.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      },
      credentials: true,
      maxAge: 600, // 10 minutes cache per SEC-12
    }),
  );

  // 5. Body parser with 100 KB limit (SEC-16)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // 6. Base Health & Readiness Probes (P1-03)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/ready', async (_req: Request, res: Response) => {
    let dbReady = true;
    if (deps.dbCheck) {
      try {
        dbReady = await deps.dbCheck();
      } catch {
        dbReady = false;
      }
    }

    const isReady = dbReady;
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      checks: {
        database: dbReady ? 'ok' : 'unreachable',
        config: 'ok',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // 7. API routes mount point (/api/v1)
  const v1Router = express.Router();

  if (deps.qlooService) {
    v1Router.use('/', createQlooRouter(deps.qlooService));
  } else {
    v1Router.get('/qloo/status', (_req: Request, res: Response) => {
      // Stub for P1-05 StatusPill
      const isConfigured = Boolean(
        deps.config.QLOO_API_KEY &&
        deps.config.QLOO_API_KEY.trim().length > 0 &&
        !deps.config.QLOO_API_KEY.includes('replace-with'),
      );

      res.status(200).json({
        configured: isConfigured,
        baseUrl: deps.config.QLOO_API_BASE_URL,
        status: isConfigured ? 'connected' : 'not_configured',
        circuitBreaker: 'closed',
        timestamp: new Date().toISOString(),
      });
    });
  }

  app.use('/api/v1', v1Router);

  // Hook for testing or extension routes before 404 handler
  if (deps.configureRoutes) {
    deps.configureRoutes(app);
  }

  // 8. 404 handler
  app.use((req: Request, res: Response) => {
    const rawRequestId = req.headers['x-request-id'];
    const requestId = typeof rawRequestId === 'string' ? rawRequestId : undefined;
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        requestId,
      },
    });
  });

  // 9. Error handler
  app.use(createErrorHandler(log));

  return app;
}
