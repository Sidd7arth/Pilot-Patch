// packages/decision-engine/src/engine.ts
import type { DecisionInput, DecisionOutput } from './types.js';
import { computeInputHash } from './canonical.js';
import { runVariant, compareVariants } from './variants.js';

export const ENGINE_VERSION = '1.0.0';

/**
 * Pure, deterministic decision engine.
 * Computes portfolio rankings, selection knapsack, baseline comparisons, and explanations.
 * Zero I/O, zero clock reads, zero non-deterministic randomness.
 */
export function runDecision(input: DecisionInput): DecisionOutput {
  const inputHash = computeInputHash(input);
  const variantOption = input.options?.variants ?? 'both';

  const output: DecisionOutput = {
    engineVersion: ENGINE_VERSION,
    signalConfigVersion: input.signalConfigVersion,
    inputHash,
    variants: {},
  };

  if (variantOption === 'qloo_informed' || variantOption === 'both') {
    output.variants.qloo_informed = runVariant(input, 'qloo_informed');
  }

  if (variantOption === 'baseline' || variantOption === 'both') {
    output.variants.baseline = runVariant(input, 'baseline');
  }

  if (output.variants.qloo_informed && output.variants.baseline) {
    output.comparison = compareVariants(
      output.variants.qloo_informed.rankings,
      output.variants.baseline.rankings,
    );
  }

  return output;
}
