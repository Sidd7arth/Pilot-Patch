// apps/api/src/http/routes/qloo.ts
import { Router } from 'express';
import { QlooService, QuotaExceededError } from '../../modules/qloo/index.js';
import { AppError } from '../error-handler.js';

export function createQlooRouter(qlooService: QlooService): Router {
  const router = Router();

  // GET /api/v1/qloo/status - Status & Probe (API-12, API-17)
  router.get('/qloo/status', async (req, res, next) => {
    try {
      const workspaceId = req.query.workspaceId as string | undefined;
      const status = await qlooService.getStatus(workspaceId);
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/workspaces/:workspaceId/references/:referenceId/resolve (API-03)
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

  // POST /api/v1/workspaces/:workspaceId/references/:referenceId/choose (API-03)
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

  // POST /api/v1/workspaces/:workspaceId/proposals/:proposalId/refresh-evidence (API-04)
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
