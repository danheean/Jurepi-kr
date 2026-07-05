import { describe, expect, it } from 'vitest'
import {
  STORE_VERSION,
  GaugeSchema,
  ProjectSchema,
  StoreSchema,
  parseGauge,
  parseStore,
} from './schema'

describe('schema.ts', () => {
  describe('GaugeSchema', () => {
    it('validates a valid gauge', () => {
      const validGauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm' as const,
      }
      expect(GaugeSchema.parse(validGauge)).toEqual(validGauge)
    })

    it('accepts optional note', () => {
      const gaugeWithNote = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'inch' as const,
        note: 'Size 5 needles',
      }
      expect(GaugeSchema.parse(gaugeWithNote)).toEqual(gaugeWithNote)
    })

    it('rejects zero or negative stitches', () => {
      expect(() =>
        GaugeSchema.parse({
          stitches: 0,
          rows: 30,
          swatchW: 10,
          swatchH: 10,
          unit: 'cm',
        })
      ).toThrow()

      expect(() =>
        GaugeSchema.parse({
          stitches: -5,
          rows: 30,
          swatchW: 10,
          swatchH: 10,
          unit: 'cm',
        })
      ).toThrow()
    })

    it('rejects zero or negative swatch dimensions', () => {
      expect(() =>
        GaugeSchema.parse({
          stitches: 22,
          rows: 30,
          swatchW: 0,
          swatchH: 10,
          unit: 'cm',
        })
      ).toThrow()

      expect(() =>
        GaugeSchema.parse({
          stitches: 22,
          rows: 30,
          swatchW: 10,
          swatchH: -5,
          unit: 'cm',
        })
      ).toThrow()
    })

    it('rejects invalid unit', () => {
      expect(() =>
        GaugeSchema.parse({
          stitches: 22,
          rows: 30,
          swatchW: 10,
          swatchH: 10,
          unit: 'mm',
        })
      ).toThrow()
    })
  })

  describe('ProjectSchema', () => {
    it('validates a valid project', () => {
      const project = {
        name: 'Sweater front',
        gauge: {
          stitches: 22,
          rows: 30,
          swatchW: 10,
          swatchH: 10,
          unit: 'cm' as const,
        },
      }
      expect(ProjectSchema.parse(project)).toEqual(project)
    })

    it('rejects empty project name', () => {
      expect(() =>
        ProjectSchema.parse({
          name: '',
          gauge: {
            stitches: 22,
            rows: 30,
            swatchW: 10,
            swatchH: 10,
            unit: 'cm',
          },
        })
      ).toThrow()
    })

    it('rejects invalid gauge within project', () => {
      expect(() =>
        ProjectSchema.parse({
          name: 'Sweater front',
          gauge: {
            stitches: 0,
            rows: 30,
            swatchW: 10,
            swatchH: 10,
            unit: 'cm',
          },
        })
      ).toThrow()
    })
  })

  describe('StoreSchema', () => {
    it('validates a valid store', () => {
      const store = {
        version: 1,
        projects: [
          {
            name: 'Sweater',
            gauge: {
              stitches: 22,
              rows: 30,
              swatchW: 10,
              swatchH: 10,
              unit: 'cm' as const,
            },
          },
        ],
        recents: [
          {
            stitches: 24,
            rows: 32,
            swatchW: 10,
            swatchH: 10,
            unit: 'cm' as const,
          },
        ],
        meta: {
          createdAt: Date.now(),
        },
      }
      expect(StoreSchema.parse(store)).toEqual(store)
    })

    it('provides default empty arrays', () => {
      const store = {
        version: 1,
      }
      const parsed = StoreSchema.parse(store)
      expect(parsed.projects).toEqual([])
      expect(parsed.recents).toEqual([])
    })

    it('allows omitted meta', () => {
      const store = {
        version: 1,
        projects: [],
        recents: [],
      }
      const parsed = StoreSchema.parse(store)
      expect(parsed.version).toBe(1)
      expect(parsed.projects).toEqual([])
    })
  })

  describe('parseGauge', () => {
    it('returns gauge if valid', () => {
      const gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      expect(parseGauge(gauge)).toEqual(gauge)
    })

    it('returns null if invalid', () => {
      expect(parseGauge({ stitches: 0, rows: 30 })).toBeNull()
      expect(parseGauge(null)).toBeNull()
      expect(parseGauge(undefined)).toBeNull()
      expect(parseGauge('invalid')).toBeNull()
    })
  })

  describe('parseStore', () => {
    it('returns store if valid', () => {
      const store = {
        version: 1,
        projects: [],
        recents: [],
      }
      expect(parseStore(store)).toEqual(store)
    })

    it('returns null if invalid', () => {
      expect(parseStore({ version: 'invalid' })).toBeNull()
      expect(parseStore(null)).toBeNull()
      expect(parseStore('invalid')).toBeNull()
    })
  })

  describe('STORE_VERSION', () => {
    it('is 1', () => {
      expect(STORE_VERSION).toBe(1)
    })
  })
})
