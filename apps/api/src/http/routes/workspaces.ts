// apps/api/src/http/routes/workspaces.ts
import { Router } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, and, gte, isNull } from 'drizzle-orm';
import * as schema from '../../db/schema.js';
import type { AppConfig } from '../../config/env.js';
import { seedDemoWorkspace } from '../../services/seed-service.js';
import { AppError } from '../error-handler.js';
import { createSessionMiddleware } from '../middleware/session.js';

export function createWorkspaceRoutes(
  db: NodePgDatabase<typeof schema>,
  config: AppConfig,
): Router {
  const router = Router();
  const requireSession = createSessionMiddleware(db);

  /**
   * POST /workspaces
   * Creates an anonymous workspace, optionally seeds demo data, and sets session cookie.
   */
  router.post('/workspaces', async (req, res, next) => {
    try {
      const { seedDemo, accessCode } = req.body ?? {};

      // Check access code if DEMO_ACCESS_CODE is configured in environment
      if (config.DEMO_ACCESS_CODE && config.DEMO_ACCESS_CODE.trim().length > 0) {
        if (accessCode !== config.DEMO_ACCESS_CODE) {
          throw AppError.forbidden('Invalid demo access code');
        }
      }

      const ttlDays = config.WORKSPACE_TTL_DAYS ?? 7;
      const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

      const [workspace] = await db
        .insert(schema.workspaces)
        .values({
          expiresAt,
        })
        .returning();

      if (!workspace) {
        throw AppError.internal('Failed to create workspace');
      }

      let didSeed = false;
      if (seedDemo !== false) {
        await seedDemoWorkspace(db, { workspaceId: workspace.id });
        didSeed = true;
      }

      // Set signed cookie
      res.cookie('pp_session', workspace.id, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        signed: true,
        maxAge: ttlDays * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        workspace: {
          id: workspace.id,
          expiresAt: workspace.expiresAt.toISOString(),
          seeded: didSeed,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /workspace
   * Returns current workspace details, game, constraints, and quota status.
   */
  router.get('/workspace', requireSession, async (req, res, next) => {
    try {
      const workspaceId = req.workspaceId!;
      const workspace = req.workspace!;

      // Fetch game
      const [game] = await db
        .select()
        .from(schema.games)
        .where(eq(schema.games.workspaceId, workspaceId))
        .limit(1);

      // Fetch constraints
      const [constraints] = await db
        .select()
        .from(schema.planningConstraints)
        .where(eq(schema.planningConstraints.workspaceId, workspaceId))
        .limit(1);

      // Count active proposals
      const [proposalCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.proposals)
        .where(
          and(eq(schema.proposals.workspaceId, workspaceId), isNull(schema.proposals.deletedAt)),
        );

      // Count calls today
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const [callsRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.qlooQueries)
        .where(
          and(
            eq(schema.qlooQueries.workspaceId, workspaceId),
            gte(schema.qlooQueries.retrievedAt, startOfDay),
            eq(schema.qlooQueries.dataOrigin, 'live_qloo'),
          ),
        );

      const callsUsedToday = callsRow?.count ?? 0;
      const dailyCallsLimit = config.QLOO_WORKSPACE_DAILY_CALLS;
      const callsRemaining = Math.max(0, dailyCallsLimit - callsUsedToday);

      res.json({
        workspace: {
          id: workspace.id,
          expiresAt: workspace.expiresAt.toISOString(),
          quota: {
            dailyCallsLimit,
            callsUsedToday,
            callsRemaining,
          },
          game: game
            ? {
                id: game.id,
                title: game.name,
                description: game.description,
                genreTags: game.genreTags,
                platforms: game.platforms,
                dataOrigin: game.dataOrigin,
              }
            : null,
          constraints: constraints
            ? {
                currency: constraints.currency,
                budgetTotalMinor: constraints.budgetTotalMinor.toString(),
                contingencyReserveMinor: constraints.contingencyReserveMinor.toString(),
                capacityPersonDays: constraints.capacityPersonDays,
                capacityEnforcement: constraints.capacityEnforcement,
                horizonStart: constraints.horizonStart,
                horizonEnd: constraints.horizonEnd,
                horizonEnforcement: constraints.horizonEnforcement,
                maxSelections: constraints.maxSelections,
                dataOrigin: 'user_supplied',
              }
            : null,
          proposalCount: proposalCountRow?.count ?? 0,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
