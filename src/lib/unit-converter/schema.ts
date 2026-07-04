/**
 * Zod schemas for Unit Converter domain validation
 */

import { z } from 'zod';

export const RecentsEntrySchema = z.object({
  categoryId: z.enum(['length', 'mass', 'temperature', 'area', 'volume', 'speed', 'digital_storage', 'time']),
  fromUnit: z.string(),
  toUnit: z.string(),
  fromValue: z.number(),
  toValue: z.number(),
  timestamp: z.number(),
});

export const RecentsStoreSchema = z.object({
  version: z.number(),
  recents: z.array(RecentsEntrySchema),
  metadata: z.object({
    createdAt: z.number(),
  }),
});

export type RecentsStoreType = z.infer<typeof RecentsStoreSchema>;
