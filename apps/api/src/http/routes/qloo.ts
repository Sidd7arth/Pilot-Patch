// apps/api/src/http/routes/qloo.ts
import { Router, type Request } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema.js';
import { QlooService, QuotaExceededError } from '../../modules/qloo/index.js';
import { AppError } from '../error-handler.js';

export function createQlooRouter(
  qlooService: QlooService,
  _db?: NodePgDatabase<typeof schema>,
): Router {
  const router = Router();

  // Helper to get workspaceId from params, session, or query
  function getWorkspaceId(req: Request): string {
    const queryWs = typeof req.query?.workspaceId === 'string' ? req.query.workspaceId : undefined;
    const paramWs =
      typeof req.params?.workspaceId === 'string' ? req.params.workspaceId : undefined;
    const wsId = paramWs || req.workspaceId || queryWs;
    if (!wsId) {
      throw AppError.unauthorized('Workspace session required');
    }
    return wsId;
  }

  // GET /api/v1/qloo/status - Status & Probe (API-12, API-17)
  router.get('/qloo/status', async (req, res, next) => {
    try {
      const workspaceId = (req.query.workspaceId as string | undefined) ?? req.workspaceId;
      const status = await qlooService.getStatus(workspaceId);
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/qloo/resolve (API-03 batch / scoped)
  router.post('/qloo/resolve', async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const { referenceIds } = req.body ?? {};
      const results = await qlooService.resolveWorkspaceReferences(workspaceId, referenceIds);
      res.json({ resolutions: results });
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        next(
          new AppError({
            httpStatus: 429,
            code: 'QUOTA_EXCEEDED',
            safeMessage: err.message,
          }),
        );
        return;
      }
      next(err);
    }
  });

  // POST /api/v1/references/:refId/resolution/choose
  router.post('/references/:refId/resolution/choose', async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const { refId } = req.params;
      const { chosenQlooEntityId } = req.body ?? {};
      if (!chosenQlooEntityId) {
        throw AppError.badRequest('chosenQlooEntityId is required');
      }

      const resolution = await qlooService.chooseResolution(workspaceId, refId, chosenQlooEntityId);
      res.json(resolution);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/qloo/evidence/refresh (API-04 batch / scoped)
  router.post('/qloo/evidence/refresh', async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const { proposalIds } = req.body ?? {};
      const results = await qlooService.refreshWorkspaceEvidence(workspaceId, proposalIds);
      res.json({ results });
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        next(
          new AppError({
            httpStatus: 429,
            code: 'QUOTA_EXCEEDED',
            safeMessage: err.message,
          }),
        );
        return;
      }
      next(err);
    }
  });

  // GET /api/v1/proposals/:id/evidence (API-06 provenance)
  router.get('/proposals/:id/evidence', async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const evidence = await qlooService.getProposalEvidence(workspaceId, req.params.id);
      res.json(evidence);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/qloo/queries (query log)
  router.get('/qloo/queries', async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const queries = await qlooService.listWorkspaceQueries(workspaceId, limit);
      res.json({ queries });
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // Backwards-compatible routes for parameterized tests
  // -------------------------------------------------------------------------
  router.post(
    '/workspaces/:workspaceId/references/:referenceId/resolve',
    async (req, res, next) => {
      try {
        const { workspaceId, referenceId } = req.params;
        const resolution = await qlooService.resolveReference(workspaceId, referenceId);
        res.json(resolution);
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          next(
            new AppError({
              httpStatus: 429,
              code: 'QUOTA_EXCEEDED',
              safeMessage: err.message,
            }),
          );
          return;
        }
        next(err);
      }
    },
  );

  router.post('/workspaces/:workspaceId/references/:referenceId/choose', async (req, res, next) => {
    try {
      const { workspaceId, referenceId } = req.params;
      const { chosenQlooEntityId } = req.body;
      if (!chosenQlooEntityId) {
        next(
          new AppError({
            httpStatus: 400,
            code: 'VALIDATION_ERROR',
            safeMessage: 'chosenQlooEntityId is required',
          }),
        );
        return;
      }

      const resolution = await qlooService.chooseResolution(
        workspaceId,
        referenceId,
        chosenQlooEntityId,
      );
      res.json(resolution);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/workspaces/:workspaceId/proposals/:proposalId/refresh-evidence',
    async (req, res, next) => {
      try {
        const { workspaceId, proposalId } = req.params;
        const result = await qlooService.refreshProposalEvidence(workspaceId, proposalId);
        res.json(result);
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          next(
            new AppError({
              httpStatus: 429,
              code: 'QUOTA_EXCEEDED',
              safeMessage: err.message,
            }),
          );
          return;
        }
        next(err);
      }
    },
  );

  return router;
}
