// packages/qloo-client/src/fingerprint.ts
import { createHash } from 'crypto';

/**
 * Computes a deterministic SHA-256 fingerprint from an endpoint and sanitized query parameters.
 * Keys are sorted lexicographically; arrays are joined canonically.
 */
export function computeRequestFingerprint(
  endpoint: string,
  params: Record<string, string | string[] | undefined>,
): string {
  const sortedKeys = Object.keys(params).sort();
  const canonicalParts: string[] = [endpoint];

  for (const key of sortedKeys) {
    const val = params[key];
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val)) {
      const sortedArray = [...val].sort();
      canonicalParts.push(`${key}=${sortedArray.join(',')}`);
    } else {
      canonicalParts.push(`${key}=${val}`);
    }
  }

  const canonicalString = canonicalParts.join('&');
  return createHash('sha256').update(canonicalString).digest('hex');
}
