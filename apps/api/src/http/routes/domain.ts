// apps/api/src/http/routes/domain.ts
import { Router } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema.js';
import {
  GameRepository,
  MarketRepository,
  PlanningConstraintsRepository,
  ProposalRepository,
  CulturalReferenceRepository,
  HistoricalRecordRepository,
  CulturalSignalRepository,
} from '../../db/repositories/index.js';
import {
  validateHorizonDates,
  validateBudget,
  validateProposalLimits,
  validateCurrencyMatch,
} from '../../domain/validators.js';
import { AppError } from '../error-handler.js';
import { createSessionMiddleware } from '../middleware/session.js';

export function createDomainRoutes(db: NodePgDatabase<typeof schema>): Router {
  const router = Router();
  const requireSession = createSessionMiddleware(db);

  const gameRepo = new GameRepository(db);
  const marketRepo = new MarketRepository(db);
  const constraintRepo = new PlanningConstraintsRepository(db);
  const proposalRepo = new ProposalRepository(db);
  const refRepo = new CulturalReferenceRepository(db);
  const histRepo = new HistoricalRecordRepository(db);
  const signalRepo = new CulturalSignalRepository(db);

  // Apply session requirement to all domain routes
  router.use(requireSession);

  // -------------------------------------------------------------------------
  // Games: GET /game, PUT /game
  // -------------------------------------------------------------------------
  router.get('/game', async (req, res, next) => {
    try {
      const game = await gameRepo.getByWorkspace(req.workspaceId!);
      if (!game) {
        throw AppError.notFound('Game not found for workspace');
      }
      res.json({ game });
    } catch (err) {
      next(err);
    }
  });

  router.put('/game', async (req, res, next) => {
    try {
      const { title, genre, targetAudience } = req.body ?? {};
      if (!title) {
        throw AppError.badRequest('Game title is required');
      }

      const game = await gameRepo.upsert(req.workspaceId!, {
        name: title,
        genreTags: Array.isArray(genre) ? genre : genre ? [genre] : [],
        description: targetAudience ?? null,
        dataOrigin: 'user_supplied',
      });
      res.json({ game });
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // Markets: GET/POST /markets, PUT/DELETE /markets/:id
  // -------------------------------------------------------------------------
  router.get('/markets', async (req, res, next) => {
    try {
      const markets = await marketRepo.listByWorkspace(req.workspaceId!);
      res.json({ markets });
    } catch (err) {
      next(err);
    }
  });

  router.post('/markets', async (req, res, next) => {
    try {
      const { name, countryCode, weight } = req.body ?? {};
      if (!name) {
        throw AppError.badRequest('Market name is required');
      }

      const game = await gameRepo.getByWorkspace(req.workspaceId!);
      if (!game) {
        throw AppError.badRequest('Game required before creating markets');
      }

      const market = await marketRepo.create(req.workspaceId!, {
        gameId: game.id,
        name,
        countryCode: countryCode ?? null,
        weight: String(weight ?? 1.0),
        dataOrigin: 'user_supplied',
      });
      res.status(201).json({ market });
    } catch (err) {
      next(err);
    }
  });

  router.put('/markets/:id', async (req, res, next) => {
    try {
      const { name, countryCode, weight } = req.body ?? {};
      const marketData: Parameters<typeof marketRepo.update>[2] = {};
      if (name !== undefined) marketData.name = name;
      if (countryCode !== undefined) marketData.countryCode = countryCode;
      if (weight !== undefined) marketData.weight = String(weight);

      const updated = await marketRepo.update(req.workspaceId!, req.params.id, marketData);
      if (!updated) {
        throw AppError.notFound('Market not found');
      }
      res.json({ market: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/markets/:id', async (req, res, next) => {
    try {
      const deleted = await marketRepo.delete(req.workspaceId!, req.params.id);
      if (!deleted) {
        throw AppError.notFound('Market not found');
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // Planning Constraints: GET/PUT /constraints
  // -------------------------------------------------------------------------
  router.get('/constraints', async (req, res, next) => {
    try {
      const constraints = await constraintRepo.getByWorkspace(req.workspaceId!);
      if (!constraints) {
        throw AppError.notFound('Planning constraints not found for workspace');
      }
      res.json({
        constraints: {
          ...constraints,
          budgetTotalMinor: constraints.budgetTotalMinor.toString(),
          contingencyReserveMinor: constraints.contingencyReserveMinor.toString(),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.put('/constraints', async (req, res, next) => {
    try {
      const {
        currency = 'USD',
        budgetTotalMinor,
        contingencyReserveMinor = 0,
        capacityPersonDays,
        capacityEnforcement = 'advisory',
        horizonStart,
        horizonEnd,
        horizonEnforcement = 'hard',
        maxSelections,
      } = req.body ?? {};

      if (budgetTotalMinor === undefined || !horizonStart || !horizonEnd) {
        throw AppError.badRequest('budgetTotalMinor, horizonStart, and horizonEnd are required');
      }

      const budgetTotal = BigInt(budgetTotalMinor);
      const contingency = BigInt(contingencyReserveMinor);

      validateHorizonDates(horizonStart, horizonEnd);
      validateBudget(budgetTotal, contingency);

      const constraints = await constraintRepo.upsert(req.workspaceId!, {
        currency,
        budgetTotalMinor: budgetTotal,
        contingencyReserveMinor: contingency,
        capacityPersonDays: capacityPersonDays !== undefined ? Number(capacityPersonDays) : null,
        capacityEnforcement,
        horizonStart,
        horizonEnd,
        horizonEnforcement,
        maxSelections: maxSelections !== undefined ? Number(maxSelections) : null,
        weights: req.body?.weights ?? {
          cultural_relevance: 0.35,
          evidence_confidence: 0.15,
          feasibility: 0.2,
          commercial_evidence: 0.2,
          stakeholder_priority: 0.1,
        },
      });

      if (!constraints) {
        throw AppError.internal('Failed to upsert constraints');
      }

      res.json({
        constraints: {
          ...constraints,
          budgetTotalMinor: constraints.budgetTotalMinor.toString(),
          contingencyReserveMinor: constraints.contingencyReserveMinor.toString(),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // Proposals: GET/POST /proposals, GET/PUT/DELETE /proposals/:id
  // -------------------------------------------------------------------------
  router.get('/proposals', async (req, res, next) => {
    try {
      const proposalList = await proposalRepo.listByWorkspace(req.workspaceId!, false);

      // Hydrate markets and dependencies for each proposal
      const detailed = await Promise.all(
        proposalList.map(async (p) => {
          const marketIds = await proposalRepo.getProposalMarketIds(req.workspaceId!, p.id);
          const dependencies = await proposalRepo.listDependencies(req.workspaceId!, p.id);
          const refs = await refRepo.listByProposal(req.workspaceId!, p.id);
          const analogs = await proposalRepo.listAnalogs(req.workspaceId!, p.id);
          const signals = await signalRepo.listByProposal(req.workspaceId!, p.id);

          return {
            ...p,
            estimatedCostMinor: p.estimatedCostMinor.toString(),
            marketIds,
            dependencies,
            references: refs,
            analogs,
            signals,
          };
        })
      );

      res.json({ proposals: detailed });
    } catch (err) {
      next(err);
    }
  });

  router.post('/proposals', async (req, res, next) => {
    try {
      const activeCount = await proposalRepo.countByWorkspace(req.workspaceId!);
      validateProposalLimits(activeCount + 1);

      const {
        name,
        description,
        category,
        status = 'candidate',
        estimatedCostMinor,
        currency = 'USD',
        effortPersonDays,
        releaseWindowStart,
        releaseWindowEnd,
        scheduleConfidence,
        stakeholderPriority,
        marketIds = [],
        dependencies = [],
        openQuestions = [],
        assumptions = [],
      } = req.body ?? {};

      if (!name || !category || estimatedCostMinor === undefined || effortPersonDays === undefined || !releaseWindowStart || !releaseWindowEnd) {
        throw AppError.badRequest('Missing required proposal fields');
      }

      validateHorizonDates(releaseWindowStart, releaseWindowEnd);

      const game = await gameRepo.getByWorkspace(req.workspaceId!);
      if (!game) {
        throw AppError.badRequest('Workspace must have a game before creating proposals');
      }

      const costMinor = BigInt(estimatedCostMinor);
      const constraints = await constraintRepo.getByWorkspace(req.workspaceId!);
      if (constraints) {
        validateCurrencyMatch(constraints.currency, currency);
      }

      const created = await proposalRepo.create(req.workspaceId!, {
        gameId: game.id,
        name,
        description,
        category,
        status,
        estimatedCostMinor: costMinor,
        currency,
        effortPersonDays: Number(effortPersonDays),
        releaseWindowStart,
        releaseWindowEnd,
        scheduleConfidence: scheduleConfidence !== undefined ? Number(scheduleConfidence) : null,
        stakeholderPriority: stakeholderPriority !== undefined ? Number(stakeholderPriority) : null,
        openQuestions,
        assumptions,
        dataOrigin: 'user_supplied',
      });

      if (!created) {
        throw AppError.internal('Failed to create proposal');
      }

      if (marketIds.length > 0) {
        await proposalRepo.setProposalMarkets(req.workspaceId!, created.id, marketIds);
      }

      if (dependencies.length > 0) {
        for (const dep of dependencies) {
          await proposalRepo.addDependency(req.workspaceId!, {
            proposalId: created.id,
            kind: dep.kind ?? 'internal',
            dependsOnProposalId: dep.dependsOnProposalId ?? null,
            description: dep.description ?? '',
            status: dep.status ?? 'pending',
            isHardBlocking: dep.isHardBlocking ?? true,
          });
        }
      }

      res.status(201).json({
        proposal: {
          ...created,
          estimatedCostMinor: created.estimatedCostMinor.toString(),
          marketIds,
          dependencies,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/proposals/:id', async (req, res, next) => {
    try {
      const p = await proposalRepo.getById(req.workspaceId!, req.params.id);
      if (!p || p.deletedAt !== null) {
        throw AppError.notFound('Proposal not found');
      }

      const marketIds = await proposalRepo.getProposalMarketIds(req.workspaceId!, p.id);
      const dependencies = await proposalRepo.listDependencies(req.workspaceId!, p.id);
      const refs = await refRepo.listByProposal(req.workspaceId!, p.id);
      const analogs = await proposalRepo.listAnalogs(req.workspaceId!, p.id);
      const signals = await signalRepo.listByProposal(req.workspaceId!, p.id);

      res.json({
        proposal: {
          ...p,
          estimatedCostMinor: p.estimatedCostMinor.toString(),
          marketIds,
          dependencies,
          references: refs,
          analogs,
          signals,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.put('/proposals/:id', async (req, res, next) => {
    try {
      const {
        name,
        description,
        category,
        status,
        estimatedCostMinor,
        currency,
        effortPersonDays,
        releaseWindowStart,
        releaseWindowEnd,
        scheduleConfidence,
        stakeholderPriority,
        marketIds,
        openQuestions,
        assumptions,
      } = req.body ?? {};

      if (releaseWindowStart && releaseWindowEnd) {
        validateHorizonDates(releaseWindowStart, releaseWindowEnd);
      }

      const updateData: Parameters<typeof proposalRepo.update>[2] = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (status !== undefined) updateData.status = status;
      if (estimatedCostMinor !== undefined) updateData.estimatedCostMinor = BigInt(estimatedCostMinor);
      if (currency !== undefined) updateData.currency = currency;
      if (effortPersonDays !== undefined) updateData.effortPersonDays = Number(effortPersonDays);
      if (releaseWindowStart !== undefined) updateData.releaseWindowStart = releaseWindowStart;
      if (releaseWindowEnd !== undefined) updateData.releaseWindowEnd = releaseWindowEnd;
      if (scheduleConfidence !== undefined) updateData.scheduleConfidence = Number(scheduleConfidence);
      if (stakeholderPriority !== undefined) updateData.stakeholderPriority = Number(stakeholderPriority);
      if (openQuestions !== undefined) updateData.openQuestions = openQuestions;
      if (assumptions !== undefined) updateData.assumptions = assumptions;

      const updated = await proposalRepo.update(req.workspaceId!, req.params.id, updateData);

      if (!updated) {
        throw AppError.notFound('Proposal not found');
      }

      if (marketIds && Array.isArray(marketIds)) {
        await proposalRepo.setProposalMarkets(req.workspaceId!, updated.id, marketIds);
      }

      res.json({
        proposal: {
          ...updated,
          estimatedCostMinor: updated.estimatedCostMinor.toString(),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/proposals/:id', async (req, res, next) => {
    try {
      const deleted = await proposalRepo.softDelete(req.workspaceId!, req.params.id);
      if (!deleted) {
        throw AppError.notFound('Proposal not found');
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // Cultural References: POST /proposals/:id/references, PUT/DELETE /references/:refId
  // -------------------------------------------------------------------------
  router.post('/proposals/:id/references', async (req, res, next) => {
    try {
      const { name, referenceType, searchHint } = req.body ?? {};
      if (!name || !referenceType) {
        throw AppError.badRequest('name and referenceType are required for cultural reference');
      }

      const p = await proposalRepo.getById(req.workspaceId!, req.params.id);
      if (!p || p.deletedAt !== null) {
        throw AppError.notFound('Proposal not found');
      }

      const ref = await refRepo.create(req.workspaceId!, {
        ownerType: 'proposal',
        proposalId: p.id,
        role: 'cultural_theme',
        label: name,
        entityTypeHint: searchHint ?? referenceType ?? null,
        dataOrigin: 'user_supplied',
      });

      res.status(201).json({ reference: ref });
    } catch (err) {
      next(err);
    }
  });

  router.put('/references/:refId', async (req, res, next) => {
    try {
      const { name, searchHint } = req.body ?? {};
      const updated = await refRepo.update(req.workspaceId!, req.params.refId, {
        label: name,
        entityTypeHint: searchHint,
      });
      if (!updated) {
        throw AppError.notFound('Cultural reference not found');
      }
      res.json({ reference: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/references/:refId', async (req, res, next) => {
    try {
      const deleted = await refRepo.delete(req.workspaceId!, req.params.refId);
      if (!deleted) {
        throw AppError.notFound('Cultural reference not found');
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // Historical Records & Analogs: GET/POST /historical-records, PUT/DELETE /historical-records/:id, PUT /proposals/:id/analogs
  // -------------------------------------------------------------------------
  router.get('/historical-records', async (req, res, next) => {
    try {
      const records = await histRepo.listByWorkspace(req.workspaceId!);
      res.json({ historicalRecords: records });
    } catch (err) {
      next(err);
    }
  });

  router.post('/historical-records', async (req, res, next) => {
    try {
      const {
        featureName,
        category,
        releaseQuarter,
        metricName,
        metricUnit,
        metricValue,
        baselineValue,
        description,
      } = req.body ?? {};

      if (!featureName || !category || !metricName || !metricUnit || metricValue === undefined || baselineValue === undefined) {
        throw AppError.badRequest('Missing required historical record fields');
      }

      const record = await histRepo.create(req.workspaceId!, {
        title: featureName,
        contentCategory: category,
        releaseDate: releaseQuarter ?? null,
        metricName,
        metricUnit,
        metricValue: String(metricValue),
        baselineValue: String(baselineValue),
        notes: description ?? null,
        dataOrigin: 'user_supplied',
      });

      res.status(201).json({ historicalRecord: record });
    } catch (err) {
      next(err);
    }
  });

  router.put('/historical-records/:id', async (req, res, next) => {
    try {
      const {
        featureName,
        category,
        releaseQuarter,
        metricName,
        metricUnit,
        metricValue,
        baselineValue,
        description,
      } = req.body ?? {};

      const histData: Parameters<typeof histRepo.update>[2] = {};
      if (featureName !== undefined) histData.title = featureName;
      if (category !== undefined) histData.contentCategory = category;
      if (releaseQuarter !== undefined) histData.releaseDate = releaseQuarter;
      if (metricName !== undefined) histData.metricName = metricName;
      if (metricUnit !== undefined) histData.metricUnit = metricUnit;
      if (metricValue !== undefined) histData.metricValue = String(metricValue);
      if (baselineValue !== undefined) histData.baselineValue = String(baselineValue);
      if (description !== undefined) histData.notes = description;

      const updated = await histRepo.update(req.workspaceId!, req.params.id, histData);

      if (!updated) {
        throw AppError.notFound('Historical record not found');
      }

      res.json({ historicalRecord: updated });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/historical-records/:id', async (req, res, next) => {
    try {
      const deleted = await histRepo.delete(req.workspaceId!, req.params.id);
      if (!deleted) {
        throw AppError.notFound('Historical record not found');
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.put('/proposals/:id/analogs', async (req, res, next) => {
    try {
      const { historicalRecordIds = [] } = req.body ?? {};
      const p = await proposalRepo.getById(req.workspaceId!, req.params.id);
      if (!p || p.deletedAt !== null) {
        throw AppError.notFound('Proposal not found');
      }

      await proposalRepo.setAnalogs(req.workspaceId!, p.id, historicalRecordIds);
      const analogs = await proposalRepo.listAnalogs(req.workspaceId!, p.id);
      res.json({ analogs });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
