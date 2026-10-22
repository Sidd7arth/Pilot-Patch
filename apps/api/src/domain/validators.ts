// apps/api/src/domain/validators.ts
import { z } from 'zod';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export class DomainValidationError extends Error {
  public readonly errors: ValidationErrorItem[];

  constructor(errors: ValidationErrorItem[]) {
    super(`Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join('; ')}`);
    this.name = 'DomainValidationError';
    this.errors = errors;
  }
}

// ---------------------------------------------------------------------------
// Enums & Schema Validators
// ---------------------------------------------------------------------------

export const PROPOSAL_CATEGORIES = [
  'seasonal_event',
  'character_skin',
  'themed_bundle',
  'entertainment_collab',
  'regional_content',
  'other',
] as const;

export const PROPOSAL_STATUSES = [
  'candidate',
  'under_review',
  'approved',
  'rejected',
  'shipped',
] as const;

export const proposalInputSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(140, 'Name cannot exceed 140 characters'),
    description: z
      .string()
      .max(4000, 'Description cannot exceed 4000 characters')
      .optional()
      .nullable(),
    category: z.enum(PROPOSAL_CATEGORIES),
    status: z.enum(PROPOSAL_STATUSES).default('candidate'),
    estimatedCostMinor: z.coerce.bigint().refine((val) => val >= 0n, 'Cost must be non-negative'),
    currency: z.string().length(3, 'Currency must be a 3-letter ISO code'),
    effortPersonDays: z.coerce.number().int().min(0, 'Effort must be non-negative'),
    releaseWindowStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'releaseWindowStart must be in YYYY-MM-DD format'),
    releaseWindowEnd: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'releaseWindowEnd must be in YYYY-MM-DD format'),
    scheduleConfidence: z.coerce.number().int().min(1).max(5).optional().nullable(),
    stakeholderPriority: z.coerce.number().int().min(1).max(5).optional().nullable(),
    openQuestions: z.array(z.string().max(300)).max(20).optional().default([]),
    assumptions: z.array(z.string().max(300)).max(20).optional().default([]),
    marketIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => data.releaseWindowEnd >= data.releaseWindowStart, {
    message: 'releaseWindowEnd must be greater than or equal to releaseWindowStart',
    path: ['releaseWindowEnd'],
  });

export const constraintsInputSchema = z
  .object({
    currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('USD'),
    budgetTotalMinor: z.coerce.bigint().refine((val) => val >= 0n, 'Budget must be non-negative'),
    contingencyReserveMinor: z.coerce
      .bigint()
      .refine((val) => val >= 0n, 'Contingency reserve must be non-negative')
      .default(0n),
    capacityPersonDays: z.coerce.number().int().min(0).optional().nullable(),
    capacityEnforcement: z.enum(['hard', 'advisory']).default('hard'),
    horizonStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'horizonStart must be in YYYY-MM-DD format'),
    horizonEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'horizonEnd must be in YYYY-MM-DD format'),
    horizonEnforcement: z.enum(['hard', 'advisory']).default('hard'),
    maxSelections: z.coerce.number().int().min(1).optional().nullable(),
    weights: z.record(z.string(), z.number()),
    minCoverage: z.coerce.number().min(0).max(1).default(0.5),
  })
  .refine((data) => data.horizonEnd >= data.horizonStart, {
    message: 'horizonEnd must be greater than or equal to horizonStart',
    path: ['horizonEnd'],
  })
  .refine((data) => data.contingencyReserveMinor <= data.budgetTotalMinor, {
    message: 'contingencyReserveMinor cannot exceed budgetTotalMinor',
    path: ['contingencyReserveMinor'],
  });

// ---------------------------------------------------------------------------
// Business Rules Validators
// ---------------------------------------------------------------------------

/**
 * Validates weights sum to 1.0 (±1e-6 tolerance) and all weights in [0, 1].
 */
export function validateWeights(weights: Record<string, number>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];
  const keys = Object.keys(weights);
  if (keys.length === 0) {
    errors.push({ field: 'weights', message: 'Weights object cannot be empty' });
    return errors;
  }

  let sum = 0;
  for (const [key, val] of Object.entries(weights)) {
    if (typeof val !== 'number' || Number.isNaN(val)) {
      errors.push({ field: `weights.${key}`, message: 'Weight must be a valid number' });
      continue;
    }
    if (val < 0 || val > 1) {
      errors.push({ field: `weights.${key}`, message: 'Weight must be between 0 and 1' });
    }
    sum += val;
  }

  if (Math.abs(sum - 1.0) > 1e-6) {
    errors.push({
      field: 'weights',
      message: `Criterion weights must sum to 1.0 (received ${sum.toFixed(6)})`,
    });
  }

  return errors;
}

/**
 * Validates currency consistency between a proposal and planning constraints.
 */
export function validateCurrencyMatch(
  proposalCurrency: string,
  constraintsCurrency: string,
): ValidationErrorItem[] {
  if (proposalCurrency.toUpperCase() !== constraintsCurrency.toUpperCase()) {
    return [
      {
        field: 'currency',
        message: `Proposal currency '${proposalCurrency}' does not match planning constraints currency '${constraintsCurrency}'`,
      },
    ];
  }
  return [];
}

/**
 * Validates proposal count limit (max 12 active proposals per workspace).
 */
export function validateProposalCount(currentCount: number, limit = 12): ValidationErrorItem[] {
  if (currentCount >= limit) {
    return [
      {
        field: 'proposals',
        message: `Workspace proposal limit reached (maximum ${limit} active proposals allowed)`,
      },
    ];
  }
  return [];
}

export interface DependencyEdge {
  proposalId: string;
  dependsOnProposalId: string;
}

/**
 * Cycle detection for internal proposal dependencies using DFS.
 * Returns field-level error if adding newEdge would introduce a directed cycle.
 */
export function detectDependencyCycle(
  existingEdges: DependencyEdge[],
  newEdge: DependencyEdge,
): ValidationErrorItem[] {
  if (newEdge.proposalId === newEdge.dependsOnProposalId) {
    return [
      {
        field: 'dependsOnProposalId',
        message: 'A proposal cannot depend on itself',
      },
    ];
  }

  // Build adjacency list: from proposal -> array of proposals it depends on
  const adj = new Map<string, string[]>();
  for (const edge of existingEdges) {
    const list = adj.get(edge.proposalId) || [];
    list.push(edge.dependsOnProposalId);
    adj.set(edge.proposalId, list);
  }

  // Add candidate edge
  const candidateList = adj.get(newEdge.proposalId) || [];
  candidateList.push(newEdge.dependsOnProposalId);
  adj.set(newEdge.proposalId, candidateList);

  // DFS cycle detection
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) {
        return [
          {
            field: 'dependsOnProposalId',
            message: `Dependency creates a circular reference cycle involving proposal ${newEdge.dependsOnProposalId}`,
          },
        ];
      }
    }
  }

  return [];
}
