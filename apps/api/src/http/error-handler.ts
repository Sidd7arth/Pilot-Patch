// apps/api/src/http/error-handler.ts
import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';

export interface SafeErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string | undefined;
  };
}

export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly safeMessage: string;
  public readonly details?: unknown;
  public readonly retryable: boolean;

  constructor(options: {
    code: string;
    httpStatus: number;
    safeMessage: string;
    details?: unknown;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(options.safeMessage);
    this.name = 'AppError';
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.safeMessage = options.safeMessage;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError({
      code: 'VALIDATION_ERROR',
      httpStatus: 400,
      safeMessage: message,
      details,
    });
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
      safeMessage: message,
    });
  }

  static forbidden(message = 'Forbidden') {
    return new AppError({
      code: 'FORBIDDEN',
      httpStatus: 403,
      safeMessage: message,
    });
  }

  static notFound(message = 'Not Found') {
    return new AppError({
      code: 'NOT_FOUND',
      httpStatus: 404,
      safeMessage: message,
    });
  }

  static internal(message = 'Internal Server Error') {
    return new AppError({
      code: 'INTERNAL_ERROR',
      httpStatus: 500,
      safeMessage: message,
    });
  }
}

/**
 * Central Express error handler.
 * SEC-06: Strictly sanitizes all errors. Never exposes stack traces, SQL, upstream bodies, or secrets.
 */
export function createErrorHandler(log: Logger) {
  return function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    const rawRequestId = req.headers['x-request-id'];
    const requestId =
      typeof rawRequestId === 'string' ? rawRequestId : (req as unknown as { id?: string }).id;

    if (err instanceof AppError) {
      log.warn(
        {
          requestId,
          code: err.code,
          status: err.httpStatus,
          message: err.message,
        },
        'Handled application error',
      );

      const body: SafeErrorEnvelope = {
        error: {
          code: err.code,
          message: err.safeMessage,
          details: err.details,
          requestId,
        },
      };

      res.status(err.httpStatus).json(body);
      return;
    }

    // Handle Express built-in HTTP errors (e.g. 413 payload limit)
    if (typeof (err as { status?: number }).status === 'number') {
      const httpStatus = (err as { status: number }).status;
      if (httpStatus === 413) {
        res.status(413).json({
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Request payload exceeds maximum allowed limit (100 KB)',
            requestId,
          },
        });
        return;
      }
    }

    // Unhandled / unexpected errors
    log.error(
      {
        requestId,
        err: err instanceof Error ? { message: err.message, name: err.name } : 'Unknown error',
      },
      'Unhandled server error',
    );

    const body: SafeErrorEnvelope = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred. Please try again later.',
        requestId,
      },
    };

    res.status(500).json(body);
  };
}
