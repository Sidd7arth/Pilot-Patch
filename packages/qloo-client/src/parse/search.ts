// packages/qloo-client/src/parse/search.ts
import { z } from 'zod';
import type { EntityCandidate } from '../types.js';

// Stage 1: Permissive envelope parser
const SearchEnvelopeSchema = z
  .object({
    results: z.array(z.record(z.string(), z.unknown())),
  })
  .passthrough();

// Stage 2: Strict entity item parser
const SearchEntityItemSchema = z.object({
  entity_id: z.string().min(1),
  name: z.string().min(1),
  types: z.union([z.string(), z.array(z.string())]).optional(),
  popularity: z.number().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export interface ParseSearchResult {
  success: boolean;
  candidates: EntityCandidate[];
  schemaMismatch?: boolean;
}

export function parseSearchResponse(raw: unknown): ParseSearchResult {
  const envelopeResult = SearchEnvelopeSchema.safeParse(raw);
  if (!envelopeResult.success) {
    return {
      success: false,
      candidates: [],
      schemaMismatch: true,
    };
  }

  const rawItems = envelopeResult.data.results;
  const candidates: EntityCandidate[] = [];

  for (const item of rawItems) {
    const itemResult = SearchEntityItemSchema.safeParse(item);
    if (itemResult.success) {
      const typesStr = Array.isArray(itemResult.data.types)
        ? itemResult.data.types.join(',')
        : itemResult.data.types || '';

      candidates.push({
        entityId: itemResult.data.entity_id,
        name: itemResult.data.name,
        types: typesStr,
        popularity: itemResult.data.popularity,
        properties: itemResult.data.properties,
      });
    }
  }

  return {
    success: true,
    candidates,
    schemaMismatch: false,
  };
}
