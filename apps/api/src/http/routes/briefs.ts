// apps/api/src/http/routes/briefs.ts
import { Router } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema.js';
import {
  DecisionRepository,
  ProposalRepository,
  CulturalReferenceRepository,
  CulturalSignalRepository,
  MarketRepository,
  QlooRepository,
} from '../../db/repositories/index.js';
import { buildDeterministicBrief } from '../../modules/briefs/brief-builder.js';
import type { DecisionOutput } from '@patchpilot/decision-engine';
import { AppError } from '../error-handler.js';
import { createSessionMiddleware } from '../middleware/session.js';

export function createBriefRoutes(db: NodePgDatabase<typeof schema>): Router {
  const router = Router();
  const requireSession = createSessionMiddleware(db);

  const decisionRepo = new DecisionRepository(db);
  const proposalRepo = new ProposalRepository(db);
  const refRepo = new CulturalReferenceRepository(db);
  const signalRepo = new CulturalSignalRepository(db);
  const marketRepo = new MarketRepository(db);
  const qlooRepo = new QlooRepository(db);

  router.use(requireSession);

  /**
   * POST /decision-runs/:id/briefs (API-10)
   * Builds deterministic brief from decision run data and saves it.
   */
  router.post('/decision-runs/:id/briefs', async (req, res, next) => {
    try {
      const workspaceId = req.workspaceId!;
      const runId = req.params.id;

      const run = await decisionRepo.getRunById(workspaceId, runId);
      if (!run) {
        throw AppError.notFound('Decision run not found');
      }

      const proposals = await proposalRepo.listByWorkspace(workspaceId, false);
      const references = await refRepo.listByWorkspace(workspaceId);
      const signals = await signalRepo.listByWorkspace(workspaceId);
      const markets = await marketRepo.listByWorkspace(workspaceId);
      const queries = await qlooRepo.listQueriesByWorkspace(workspaceId, 20);

      const briefResult = buildDeterministicBrief({
        run: {
          id: run.id,
          label: run.label,
          createdAt: run.createdAt,
          engineVersion: run.engineVersion,
          signalConfigVersion: run.signalConfigVersion,
          inputHash: run.inputHash,
        },
        output: run.output as unknown as DecisionOutput,
        proposals: proposals.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          assumptions: p.assumptions ?? [],
          openQuestions: p.openQuestions ?? [],
        })),
        references: references.map((r) => ({
          proposalId: r.proposalId,
          name: r.label,
          referenceType: r.entityTypeHint ?? r.role,
        })),
        signals: signals.map((s) => ({
          proposalId: s.proposalId,
          marketId: s.marketId,
          category: s.strategy,
          strengthBand: s.strengthBand ?? 'moderate',
          basis: s.basis,
          freshness: s.freshness,
        })),
        markets: markets.map((m) => ({
          id: m.id,
          name: m.name,
          countryCode: m.countryCode,
          weight: Number(m.weight),
        })),
        queries: queries.map((q) => ({
          id: q.id,
          endpoint: q.endpoint,
          retrievedAt: q.retrievedAt,
          dataOrigin: q.dataOrigin,
        })),
      });

      // Persist brief
      const createdBrief = await decisionRepo.createBrief(workspaceId, {
        runId: run.id,
        version: 1,
        content: briefResult.content,
        markdown: briefResult.markdown,
        narrativeStatus: 'none',
      });

      res.status(201).json({
        brief: createdBrief,
        bannedClaimViolations: briefResult.bannedClaimViolations,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /briefs/:id
   * Returns brief detail.
   */
  router.get('/briefs/:id', async (req, res, next) => {
    try {
      const brief = await decisionRepo.getBriefById(req.workspaceId!, req.params.id);
      if (!brief) {
        throw AppError.notFound('Brief not found');
      }
      res.json({ brief });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /briefs/:id/export?format=md
   * Exports brief as markdown or json.
   */
  router.get('/briefs/:id/export', async (req, res, next) => {
    try {
      const brief = await decisionRepo.getBriefById(req.workspaceId!, req.params.id);
      if (!brief) {
        throw AppError.notFound('Brief not found');
      }

      const format = req.query.format ?? 'md';
      if (format === 'md') {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="patchpilot-brief-${brief.id.slice(0, 8)}.md"`
        );
        res.send(brief.markdown);
        return;
      }

      res.json(brief.content);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
