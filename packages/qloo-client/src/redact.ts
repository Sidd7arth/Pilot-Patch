// packages/qloo-client/src/redact.ts

/**
 * Sanitizes request query parameters for safe storage and logging.
 * Replaces any accidental key or secret parameter.
 */
export function sanitizeParams(
  rawParams: Record<string, string | string[] | undefined>,
): Record<string, string | string[]> {
  const sanitized: Record<string, string | string[]> = {};

  for (const [key, val] of Object.entries(rawParams)) {
    if (val === undefined || val === null) continue;
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('key') || lowerKey.includes('secret') || lowerKey.includes('auth')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

/**
 * Sanitizes URLs to remove sensitive query parameters.
 */
export function sanitizeUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    for (const key of Array.from(url.searchParams.keys())) {
      const lower = key.toLowerCase();
      if (lower.includes('key') || lower.includes('secret') || lower.includes('auth')) {
        url.searchParams.set(key, '[REDACTED]');
      }
    }
    return url.toString();
  } catch {
    return urlStr.split('?')[0] || urlStr;
  }
}
