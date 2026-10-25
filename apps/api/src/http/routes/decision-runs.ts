// apps/api/src/http/routes/decision-runs.ts
import { Router } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema.js';
import { DecisionService } from '../../modules/decision/decision-service.js';
import type { DecisionOutput } from '@patchpilot/decision-engine';
import { AppError } from '../error-handler.js';
import { createSessionMiddleware } from '../middleware/session.js';

export function createDecisionRunRoutes(
  db: NodePgDatabase<typeof schema>,
  decisionService?: DecisionService
): Router {
  const router = Router();
  const requireSession = createSessionMiddleware(db);
  const service = decisionService ?? new DecisionService(db);

  router.use(requireSession);

  /**
   * POST /decision-runs (API-07)
   * Snapshots domain inputs, executes deterministic decision engine, persists run & rankings.
   */
  router.post('/decision-runs', async (req, res, next) => {
    try {
      const { label, variants = 'both', weights, constraintsOverride, parentRunId } = req.body ?? {};

      const result = await service.createRun(req.workspaceId!, {
        label,
        variants,
        weights,
        constraintsOverride,
        parentRunId,
      });

      res.status(201).json({
        run: result.run,
        output: result.output,
        diffFromParent: result.diffFromParent,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /decision-runs
   * Lists decision runs for current workspace.
   */
  router.get('/decision-runs', async (req, res, next) => {
    try {
      const runs = await service.listRuns(req.workspaceId!);
      res.json({ decisionRuns: runs });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /decision-runs/:id
   * Returns details for a specific run and its rankings.
   */
  router.get('/decision-runs/:id', async (req, res, next) => {
    try {
      const result = await service.getRun(req.workspaceId!, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /decision-runs/:id/replan (API-08)
   * Re-plans with overrides, links parentRunId, and returns new run with diff.
   */
  router.post('/decision-runs/:id/replan', async (req, res, next) => {
    try {
      const parentRunId = req.params.id;
      const { label, variants = 'both', weights, constraintsOverride } = req.body ?? {};

      const result = await service.createRun(req.workspaceId!, {
        label: label ?? `Re-plan of ${parentRunId.slice(0, 8)}`,
        variants,
        weights,
        constraintsOverride,
        parentRunId,
      });

      res.status(201).json({
        run: result.run,
        output: result.output,
        diffFromParent: result.diffFromParent,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /decision-runs/:id/diff/:otherId (API-08, API-09)
   * Computes run diff between two decision runs.
   */
  router.get('/decision-runs/:id/diff/:otherId', async (req, res, next) => {
    try {
      const diff = await service.diffTwoRuns(req.workspaceId!, req.params.id, req.params.otherId);
      res.json({ diff });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /decision-runs/:id/comparison
   * Returns baseline vs Qloo-informed comparison attribution.
   */
  router.get('/decision-runs/:id/comparison', async (req, res, next) => {
    try {
      const { run } = await service.getRun(req.workspaceId!, req.params.id);
      const output = run.output as unknown as DecisionOutput;

      if (!output?.comparison) {
        throw AppError.badRequest('Comparison requires run to be executed with variants: both');
      }

      res.json({
        comparison: output.comparison,
        baselinePortfolio: output.variants?.baseline?.portfolio ?? null,
        qlooPortfolio: output.variants?.qloo_informed?.portfolio ?? null,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
