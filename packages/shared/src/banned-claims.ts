// packages/shared/src/banned-claims.ts
import { STANDARD_DISCLAIMER, LIMITATION_DISCLAIMER } from './disclaimers.js';

export interface BannedClaimViolation {
  pattern: string;
  matchedText: string;
}

const BANNED_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'roi', regex: /\b(roi|return on investment)\b/i },
  { name: 'conversion_rate', regex: /\bconversion rate\b/i },
  { name: 'profit', regex: /\b(profit|profits)\b/i },
  { name: 'guarantee', regex: /\bguarantee(d)?\b/i },
  { name: 'will_drive', regex: /\bwill (increase|boost|drive|generate)\b/i },
  { name: 'proven', regex: /\bproven\b/i },
  { name: 'outperform', regex: /\b(outperform|outperforming)\b/i },
  { name: 'statistically_significant', regex: /\bstatistically significant\b/i },
  { name: 'accuracy', regex: /\baccuracy\b/i },
];

export function checkBannedClaims(text: string): BannedClaimViolation[] {
  // Strip allowed disclaimers before scanning
  let cleanText = text;
  cleanText = cleanText.split(STANDARD_DISCLAIMER).join(' ');
  cleanText = cleanText.split(LIMITATION_DISCLAIMER).join(' ');
  // Also allow the exact phrase "not a prediction"
  cleanText = cleanText.replace(/\bnot a prediction\b/gi, ' ');

  const violations: BannedClaimViolation[] = [];

  // Check general banned patterns
  for (const { name, regex } of BANNED_PATTERNS) {
    const match = cleanText.match(regex);
    if (match) {
      violations.push({
        pattern: name,
        matchedText: match[0],
      });
    }
  }

  // Check revenue, forecast, and predict (forbidden outside disclaimers)
  const revenueMatch = cleanText.match(/\brevenue\b/i);
  if (revenueMatch) {
    violations.push({ pattern: 'revenue', matchedText: revenueMatch[0] });
  }

  const forecastMatch = cleanText.match(/\bforecast\b/i);
  if (forecastMatch) {
    violations.push({ pattern: 'forecast', matchedText: forecastMatch[0] });
  }

  const predictMatch = cleanText.match(/\bpredict(s|ed|ion)?\b/i);
  if (predictMatch) {
    violations.push({ pattern: 'predict', matchedText: predictMatch[0] });
  }

  return violations;
}
