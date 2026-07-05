import { describe, expect, it } from 'vitest'
import { Gauge } from './schema'
import {
  stitchesPerUnit,
  rowsPerUnit,
  stitchesFor,
  rowsFor,
  dimensionFor,
  rescale,
  withActual,
  castOnStitches,
  rowsNeeded,
  finishedWidth,
  finishedLength,
  rescalePatternCount,
} from './gauge'

describe('gauge.ts', () => {
  describe('stitchesPerUnit', () => {
    it('calculates stitches per unit', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      expect(stitchesPerUnit(gauge)).toBeCloseTo(2.2, 9)
    })

    it('returns 0 when swatch width is 0', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 0,
        swatchH: 10,
        unit: 'cm',
      }
      expect(stitchesPerUnit(gauge)).toBe(0)
    })
  })

  describe('rowsPerUnit', () => {
    it('calculates rows per unit', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      expect(rowsPerUnit(gauge)).toBeCloseTo(3, 9)
    })

    it('returns 0 when swatch height is 0', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 0,
        unit: 'cm',
      }
      expect(rowsPerUnit(gauge)).toBe(0)
    })
  })

  describe('stitchesFor', () => {
    it('calculates stitches for target width', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      expect(stitchesFor(50, gauge)).toBeCloseTo(110, 9)
    })

    it('returns 0 when gauge has 0 swatch width', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 0,
        swatchH: 10,
        unit: 'cm',
      }
      expect(stitchesFor(50, gauge)).toBeCloseTo(0, 9)
    })
  })

  describe('rowsFor', () => {
    it('calculates rows for target length', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      expect(rowsFor(30, gauge)).toBeCloseTo(90, 9)
    })

    it('returns 0 when gauge has 0 swatch height', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 0,
        unit: 'cm',
      }
      expect(rowsFor(30, gauge)).toBeCloseTo(0, 9)
    })
  })

  describe('dimensionFor', () => {
    it('calculates dimension for a count', () => {
      expect(dimensionFor(110, 2.2)).toBeCloseTo(50, 9)
    })

    it('returns 0 when perUnit is 0', () => {
      expect(dimensionFor(110, 0)).toBe(0)
    })

    it('handles non-integer counts', () => {
      expect(dimensionFor(69, 2.1)).toBeCloseTo(32.857, 2)
    })
  })

  describe('rescale', () => {
    it('rescales count from one gauge to another', () => {
      // Pattern: 100 sts at 20 sts/10cm
      // Your gauge: 22 sts/10cm
      // Rescale: 100 * (22 / 20) = 110
      expect(rescale(100, 20, 22)).toBeCloseTo(110, 9)
    })

    it('returns 0 when fromPerUnit is 0', () => {
      expect(rescale(100, 0, 22)).toBe(0)
    })

    it('handles different ratios', () => {
      // Pattern: 50 sts at 25 sts per unit
      // Your gauge: 20 sts per unit
      // Rescale: 50 * (20 / 25) = 40
      expect(rescale(50, 25, 20)).toBeCloseTo(40, 9)
    })
  })

  describe('withActual', () => {
    it('returns rounded count with actual dimension and delta', () => {
      // 50cm × 2.2 stitches/cm = 110 stitches (exact)
      const result = withActual(50, 2.2)
      expect(result.value).toBeCloseTo(110, 9)
      expect(result.rounded).toBe(110)
      expect(result.actual).toBeCloseTo(50, 9)
      expect(result.delta).toBeCloseTo(0, 9)
    })

    it('shows delta for non-integer results', () => {
      // 33cm × (21/10) sts/cm = 69.3 stitches
      // Rounded to 69 stitches
      // 69 / (21/10) = 69 * 10 / 21 = 32.857... cm
      // Delta = 32.857... - 33 = -0.142... cm
      const perUnit = 21 / 10 // 2.1
      const result = withActual(33, perUnit)
      expect(result.value).toBeCloseTo(69.3, 1)
      expect(result.rounded).toBe(69)
      expect(result.actual).toBeCloseTo(32.857, 2)
      expect(result.delta).toBeCloseTo(-0.142, 2)
    })

    it('returns zero values when perUnit is 0', () => {
      const result = withActual(50, 0)
      expect(result.value).toBe(0)
      expect(result.rounded).toBe(0)
      expect(result.actual).toBe(0)
      expect(result.delta).toBe(0)
    })

    it('handles infinities gracefully', () => {
      const result = withActual(Infinity, 2.2)
      expect(result.value).toBe(0)
      expect(result.rounded).toBe(0)
      expect(result.actual).toBe(0)
      expect(result.delta).toBe(0)
    })
  })

  describe('castOnStitches', () => {
    it('calculates cast-on stitches for target width', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      const result = castOnStitches(50, gauge)
      expect(result.rounded).toBe(110)
      expect(result.value).toBeCloseTo(110, 9)
      expect(result.actual).toBeCloseTo(50, 9)
    })

    it('handles non-integer results', () => {
      const gauge: Gauge = {
        stitches: 21,
        rows: 33,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      const result = castOnStitches(33, gauge)
      expect(result.rounded).toBe(69)
      expect(result.actual).toBeCloseTo(32.857, 2)
      expect(result.delta).toBeCloseTo(-0.142, 2)
    })
  })

  describe('rowsNeeded', () => {
    it('calculates rows needed for target length', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      const result = rowsNeeded(30, gauge)
      expect(result.rounded).toBe(90)
      expect(result.value).toBeCloseTo(90, 9)
      expect(result.actual).toBeCloseTo(30, 9)
    })
  })

  describe('finishedWidth', () => {
    it('calculates finished width for stitch count', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      expect(finishedWidth(110, gauge)).toBeCloseTo(50, 9)
    })

    it('handles large stitch counts', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      // 100 sts at 22/10 sts/cm = 100 / 2.2 ≈ 45.454... cm
      expect(finishedWidth(100, gauge)).toBeCloseTo(45.454, 2)
    })

    it('returns 0 when gauge has 0 swatch width', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 0,
        swatchH: 10,
        unit: 'cm',
      }
      expect(finishedWidth(110, gauge)).toBe(0)
    })
  })

  describe('finishedLength', () => {
    it('calculates finished length for row count', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      expect(finishedLength(90, gauge)).toBeCloseTo(30, 9)
    })

    it('returns 0 when gauge has 0 swatch height', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 0,
        unit: 'cm',
      }
      expect(finishedLength(90, gauge)).toBe(0)
    })
  })

  describe('rescalePatternCount', () => {
    it('rescales pattern count to user gauge', () => {
      // Pattern: 100 sts at 20 sts/10cm = 2.0 sts/cm (=50cm finished)
      // Your gauge: 22 sts/10cm = 2.2 sts/cm
      // Rescale: 100 * (2.2 / 2.0) = 110 sts (for same 50cm)
      const patternPerUnit = 20 / 10 // 2.0 sts/cm
      const yourPerUnit = 22 / 10 // 2.2 sts/cm
      const result = rescalePatternCount(100, patternPerUnit, yourPerUnit)
      expect(result.value).toBeCloseTo(110, 9)
      expect(result.rounded).toBe(110)
      expect(result.actual).toBeCloseTo(50, 9)
    })

    it('calculates delta for pattern rescale', () => {
      // Pattern: 100 sts at 20 sts/10cm = 2.0 sts/cm (=50cm finished)
      // Your gauge: 21 sts/10cm = 2.1 sts/cm
      // Rescale: 100 * (2.1 / 2.0) = 105 sts
      // Rounded to 105 stitches
      // Finished width at 2.1 sts/cm: 105 / 2.1 = 50cm
      // Delta should be ~0
      const patternPerUnit = 20 / 10 // 2.0 sts/cm
      const yourPerUnit = 21 / 10 // 2.1 sts/cm
      const result = rescalePatternCount(100, patternPerUnit, yourPerUnit)
      expect(result.rounded).toBe(105)
      expect(result.actual).toBeCloseTo(50, 9)
      expect(result.delta).toBeCloseTo(0, 9)
    })

    it('handles gauge increase', () => {
      // Gauge increase: more stitches per unit
      const patternPerUnit = 20 / 10 // 2.0
      const yourPerUnit = 25 / 10 // 2.5
      const result = rescalePatternCount(100, patternPerUnit, yourPerUnit)
      expect(result.rounded).toBe(125)
    })

    it('handles gauge decrease', () => {
      // Gauge decrease: fewer stitches per unit
      const patternPerUnit = 20 / 10 // 2.0
      const yourPerUnit = 16 / 10 // 1.6
      const result = rescalePatternCount(100, patternPerUnit, yourPerUnit)
      expect(result.rounded).toBe(80)
    })

    it('returns zero values when pattern gauge is 0', () => {
      const result = rescalePatternCount(100, 0, 22)
      expect(result.value).toBe(0)
      expect(result.rounded).toBe(0)
    })
  })

  describe('comprehensive scenario: 22 sts/30 rows per 10cm → 50cm × 30cm', () => {
    it('calculates 110 sts, 90 rows for 50cm × 30cm', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }

      const stResult = castOnStitches(50, gauge)
      const rowResult = rowsNeeded(30, gauge)

      expect(stResult.rounded).toBe(110)
      expect(stResult.actual).toBeCloseTo(50, 9)
      expect(stResult.delta).toBeCloseTo(0, 9)

      expect(rowResult.rounded).toBe(90)
      expect(rowResult.actual).toBeCloseTo(30, 9)
      expect(rowResult.delta).toBeCloseTo(0, 9)
    })
  })

  describe('comprehensive scenario: Non-integer gauge', () => {
    it('shows rounding transparency for 21 sts → 33cm', () => {
      const gauge: Gauge = {
        stitches: 21,
        rows: 33,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }

      const result = castOnStitches(33, gauge)
      expect(result.value).toBeCloseTo(69.3, 1)
      expect(result.rounded).toBe(69)
      expect(result.actual).toBeCloseTo(32.857, 2)
      expect(result.delta).toBeCloseTo(-0.142, 2)
    })
  })

  describe('comprehensive scenario: Pattern rescale 20→22 sts/10cm', () => {
    it('rescales 100 sts pattern to 110 sts for 50cm', () => {
      // Pattern written at 20 sts/10cm = 2.0 sts/cm, cast on 100 (= 50cm)
      // Your gauge 22 sts/10cm = 2.2 sts/cm
      // How many stitches for same 50cm?
      const patternPerUnit = 20 / 10 // 2.0 sts/cm
      const yourPerUnit = 22 / 10 // 2.2 sts/cm
      const result = rescalePatternCount(100, patternPerUnit, yourPerUnit)
      expect(result.rounded).toBe(110)
      expect(result.actual).toBeCloseTo(50, 9)
    })
  })

  describe('comprehensive scenario: 100 sts at 22/10cm', () => {
    it('gives ~45.45cm finished width', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      }
      const width = finishedWidth(100, gauge)
      expect(width).toBeCloseTo(45.454, 2)
    })
  })

  describe('edge cases', () => {
    it('guards against divide by zero with 0 swatch width', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 0,
        swatchH: 10,
        unit: 'cm',
      }
      expect(stitchesFor(50, gauge)).toBeCloseTo(0, 9)
    })

    it('guards against divide by zero with 0 swatch height', () => {
      const gauge: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 0,
        unit: 'cm',
      }
      expect(rowsFor(30, gauge)).toBeCloseTo(0, 9)
    })

    it('handles inch unit same as cm (math is unit-agnostic)', () => {
      const gaugeInch: Gauge = {
        stitches: 22,
        rows: 30,
        swatchW: 4,
        swatchH: 4,
        unit: 'inch',
      }
      // Same ratio as 22/10 cm
      expect(stitchesPerUnit(gaugeInch)).toBeCloseTo(5.5, 9) // 22/4
      expect(rowsPerUnit(gaugeInch)).toBeCloseTo(7.5, 9) // 30/4
    })
  })
})
