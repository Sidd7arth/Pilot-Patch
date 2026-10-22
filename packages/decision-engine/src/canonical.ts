// packages/decision-engine/src/canonical.ts
import { createHash } from 'node:crypto';
import type { DecisionInput } from './types.js';

/**
 * Rounds a floating point number to 6 decimal places.
 * Used for deterministic score calculations and avoiding float drift.
 */
export function round6(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Produces deterministic, canonical JSON with sorted object keys and normalized numbers/bigints.
 */
export function canonicalStringify(val: unknown): string {
  if (val === null || val === undefined) {
    return 'null';
  }

  if (typeof val === 'bigint') {
    return `"${val.toString()}n"`;
  }

  if (typeof val === 'number') {
    return Number.isInteger(val) ? val.toString() : round6(val).toString();
  }

  if (typeof val === 'boolean' || typeof val === 'string') {
    return JSON.stringify(val);
  }

  if (Array.isArray(val)) {
    return `[${val.map(canonicalStringify).join(',')}]`;
  }

  if (typeof val === 'object') {
    const keys = Object.keys(val as Record<string, unknown>).sort();
    const entries = keys.map(
      (k) => `"${k}":${canonicalStringify((val as Record<string, unknown>)[k])}`,
    );
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(val);
}

/**
 * Computes deterministic SHA-256 hash of the DecisionInput snapshot.
 * ENG-01: Hash must be completely stable across platforms and executions.
 */
export function computeInputHash(input: DecisionInput): string {
  const canonical = canonicalStringify(input);
  return createHash('sha256').update(canonical).digest('hex');
}
