// apps/api/test/unit/validators.test.ts
import { describe, it, expect } from 'vitest';
import {
  detectDependencyCycle,
  validateWeights,
  validateCurrencyMatch,
  validateProposalCount,
  proposalInputSchema,
  constraintsInputSchema,
} from '../../src/domain/validators.js';

describe('P3-03: Domain Validators & Invariants', () => {
  describe('Dependency Cycle Detection (DFS)', () => {
    it('rejects self-dependency', () => {
      const errors = detectDependencyCycle([], {
        proposalId: 'prop-1',
        dependsOnProposalId: 'prop-1',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('dependsOnProposalId');
      expect(errors[0].message).toContain('cannot depend on itself');
    });

    it('rejects 2-node cycle: A -> B and B -> A', () => {
      const existing = [{ proposalId: 'prop-A', dependsOnProposalId: 'prop-B' }];
      const errors = detectDependencyCycle(existing, {
        proposalId: 'prop-B',
        dependsOnProposalId: 'prop-A',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('dependsOnProposalId');
      expect(errors[0].message).toContain('circular reference cycle');
    });

    it('rejects multi-node cycle: A -> B -> C and C -> A', () => {
      const existing = [
        { proposalId: 'prop-A', dependsOnProposalId: 'prop-B' },
        { proposalId: 'prop-B', dependsOnProposalId: 'prop-C' },
      ];
      const errors = detectDependencyCycle(existing, {
        proposalId: 'prop-C',
        dependsOnProposalId: 'prop-A',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('dependsOnProposalId');
    });

    it('accepts valid DAG without cycles: A -> B and C -> B', () => {
      const existing = [{ proposalId: 'prop-A', dependsOnProposalId: 'prop-B' }];
      const errors = detectDependencyCycle(existing, {
        proposalId: 'prop-C',
        dependsOnProposalId: 'prop-B',
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('Weights Validation', () => {
    it('accepts weights summing to 1.0', () => {
      const weights = {
        cultural: 0.35,
        confidence: 0.15,
        feasibility: 0.2,
        commercial: 0.2,
        stakeholder: 0.1,
      };
      const errors = validateWeights(weights);
      expect(errors).toHaveLength(0);
    });

    it('rejects weights not summing to 1.0', () => {
      const weights = {
        cultural: 0.5,
        confidence: 0.1,
      };
      const errors = validateWeights(weights);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('weights');
      expect(errors[0].message).toContain('must sum to 1.0');
    });

    it('rejects weights outside [0, 1]', () => {
      const weights = {
        cultural: 1.5,
        feasibility: -0.5,
      };
      const errors = validateWeights(weights);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Currency Match Validation', () => {
    it('accepts matching currencies (case-insensitive)', () => {
      expect(validateCurrencyMatch('USD', 'USD')).toHaveLength(0);
      expect(validateCurrencyMatch('usd', 'USD')).toHaveLength(0);
    });

    it('rejects mismatched currencies', () => {
      const errors = validateCurrencyMatch('EUR', 'USD');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('currency');
      expect(errors[0].message).toContain('does not match');
    });
  });

  describe('Proposal Count Limit', () => {
    it('allows proposal creation when under 12 proposals', () => {
      expect(validateProposalCount(5)).toHaveLength(0);
      expect(validateProposalCount(11)).toHaveLength(0);
    });

    it('blocks proposal creation at or over 12 proposals', () => {
      const errors = validateProposalCount(12);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('proposals');
      expect(errors[0].message).toContain('maximum 12');
    });
  });

  describe('Zod Schemas Validation', () => {
    it('validates proposal release window ordering', () => {
      const invalid = {
        name: 'Invalid Window Proposal',
        category: 'seasonal_event',
        estimatedCostMinor: 1000000n,
        currency: 'USD',
        effortPersonDays: 30,
        releaseWindowStart: '2027-05-01',
        releaseWindowEnd: '2027-04-01', // End before start
      };
      const result = proposalInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than or equal to');
      }
    });

    it('validates constraints contingency reserve cannot exceed budget', () => {
      const invalid = {
        currency: 'USD',
        budgetTotalMinor: 100000n,
        contingencyReserveMinor: 200000n, // Exceeds budget
        horizonStart: '2027-01-01',
        horizonEnd: '2027-06-30',
        weights: { cultural: 1.0 },
      };
      const result = constraintsInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed budgetTotalMinor');
      }
    });
  });
});
