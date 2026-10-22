// apps/api/src/observability/logger.ts
import pino from 'pino';

export interface LoggerOptions {
  level?: string;
  destination?: pino.DestinationStream;
}

/**
 * Creates a configured pino logger with strict redaction per SEC-05.
 * Redacts auth headers, API keys, cookies, passwords, and sensitive fields.
 */
export function createLogger(options: LoggerOptions = {}) {
  return pino(
    {
      level: options.level || process.env.LOG_LEVEL || 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          'req.headers["X-Api-Key"]',
          'req.headers["X-API-KEY"]',
          '*.apiKey',
          '*.api_key',
          '*.password',
          '*.secret',
          '*.token',
          'headers["x-api-key"]',
          'headers["X-Api-Key"]',
          'headers.authorization',
          'headers.cookie',
        ],
        censor: '[REDACTED]',
      },
      serializers: {
        req(req) {
          // Custom serializer that strips query parameters from request URLs if needed
          const sanitizedUrl = typeof req.url === 'string' ? req.url.split('?')[0] : req.url;
          return {
            id: req.id,
            method: req.method,
            url: sanitizedUrl,
          };
        },
      },
    },
    options.destination,
  );
}

export const logger = createLogger();
