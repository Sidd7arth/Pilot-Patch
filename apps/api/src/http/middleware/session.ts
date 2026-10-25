// apps/api/src/http/middleware/session.ts
import type { Request, Response, NextFunction } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, gt, and } from 'drizzle-orm';
import * as schema from '../../db/schema.js';
import { AppError } from '../error-handler.js';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      workspaceId?: string | undefined;
      workspace?: typeof schema.workspaces.$inferSelect | undefined;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function createSessionMiddleware(db: NodePgDatabase<typeof schema>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieVal = req.signedCookies?.['pp_session'] ?? req.cookies?.['pp_session'];
      const headerVal = req.headers['x-workspace-id'] as string | undefined;
      const workspaceId = cookieVal || headerVal;

      if (!workspaceId) {
        throw AppError.unauthorized('Workspace session required');
      }

      const rows = await db
        .select()
        .from(schema.workspaces)
        .where(
          and(eq(schema.workspaces.id, workspaceId), gt(schema.workspaces.expiresAt, new Date())),
        )
        .limit(1);

      const workspace = rows[0];
      if (!workspace) {
        throw AppError.unauthorized('Invalid or expired workspace session');
      }

      req.workspaceId = workspace.id;
      req.workspace = workspace;
      next();
    } catch (err) {
      next(err);
    }
  };
}
