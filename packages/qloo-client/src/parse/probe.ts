// packages/qloo-client/src/parse/probe.ts
import { z } from 'zod';
import type { ProbeInfo } from '../types.js';

const ProbeEnvelopeSchema = z
  .object({
    deployment: z
      .object({
        version: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export function parseProbeResponse(raw: unknown): {
  success: boolean;
  data: ProbeInfo;
  schemaMismatch?: boolean;
} {
  const result = ProbeEnvelopeSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      data: { version: 'unknown', status: 'unreachable' },
      schemaMismatch: true,
    };
  }

  const version = result.data.deployment?.version || '2.x';
  return {
    success: true,
    data: {
      version,
      status: 'connected',
    },
    schemaMismatch: false,
  };
}
