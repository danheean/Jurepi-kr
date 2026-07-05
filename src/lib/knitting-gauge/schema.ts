import { z } from 'zod'

// Version for schema migration
export const STORE_VERSION = 1

// Mode type for knitting gauge tool
export const ModeSchema = z.enum(['dimToCounts', 'countsToDim', 'patternRescale'])
export type Mode = z.infer<typeof ModeSchema>

// Gauge schema (core swatch measurement)
export const GaugeSchema = z.object({
  stitches: z.number().positive('Stitches must be positive'),
  rows: z.number().positive('Rows must be positive'),
  swatchW: z.number().positive('Swatch width must be positive'),
  swatchH: z.number().positive('Swatch height must be positive'),
  unit: z.enum(['cm', 'inch']),
  note: z.string().optional(),
})

export type Gauge = z.infer<typeof GaugeSchema>

// Saved project (named gauge)
export const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name required'),
  gauge: GaugeSchema,
})

export type Project = z.infer<typeof ProjectSchema>

// Full localStorage store
export const StoreSchema = z.object({
  version: z.number(),
  projects: z.array(ProjectSchema).default([]),
  recents: z.array(GaugeSchema).default([]),
  // Last-used gauge, restored on reload (SPEC test_scenario_4: gauge persists)
  current: GaugeSchema.optional(),
  meta: z.object({
    createdAt: z.number(),
  }).optional(),
})

export type Store = z.infer<typeof StoreSchema>

// Parse helpers
export const parseGauge = (data: unknown): Gauge | null => {
  const result = GaugeSchema.safeParse(data)
  return result.success ? result.data : null
}

export const parseStore = (data: unknown): Store | null => {
  const result = StoreSchema.safeParse(data)
  return result.success ? result.data : null
}
