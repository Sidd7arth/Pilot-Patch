// packages/qloo-client/src/parse/insights.ts
import { z } from 'zod';
import type { InsightItem } from '../types.js';

// Stage 1: Permissive envelope parser
const InsightsEnvelopeSchema = z
  .object({
    results: z.union([
      z
        .object({
          entities: z.array(z.record(z.string(), z.unknown())).optional(),
        })
        .passthrough(),
      z.array(z.record(z.string(), z.unknown())),
    ]),
  })
  .passthrough();

// Stage 2: Strict entity insight item parser
const InsightItemSchema = z.object({
  entity_id: z.string().min(1),
  name: z.string().min(1),
  query: z
    .object({
      affinity: z.number().nullable().optional(),
    })
    .optional(),
  affinity: z.number().nullable().optional(),
});

export interface ParseInsightsResult {
  success: boolean;
  items: InsightItem[];
  schemaMismatch?: boolean;
}

export function parseInsightsResponse(raw: unknown): ParseInsightsResult {
  const envelopeResult = InsightsEnvelopeSchema.safeParse(raw);
  if (!envelopeResult.success) {
    return {
      success: false,
      items: [],
      schemaMismatch: true,
    };
  }

  const rawResults = envelopeResult.data.results;
  const rawEntities = Array.isArray(rawResults) ? rawResults : rawResults.entities || [];

  const items: InsightItem[] = [];

  for (let i = 0; i < rawEntities.length; i++) {
    const rawEntity = rawEntities[i];
    const parsed = InsightItemSchema.safeParse(rawEntity);
    if (parsed.success) {
      const rawAffinity = parsed.data.query?.affinity ?? parsed.data.affinity;
      const affinity = typeof rawAffinity === 'number' && !isNaN(rawAffinity) ? rawAffinity : null;
      items.push({
        entityId: parsed.data.entity_id,
        name: parsed.data.name,
        affinity,
        rank: i + 1,
      });
    }
  }

  return {
    success: true,
    items,
    schemaMismatch: false,
  };
}
