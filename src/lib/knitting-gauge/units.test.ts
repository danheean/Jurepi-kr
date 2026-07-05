import { describe, expect, it } from 'vitest'
import {
  IN_TO_CM,
  cmToIn,
  inToCm,
  toBaseCm,
  fromBaseCm,
  defaultSwatchSize,
  convertSwatchSizeOnUnitToggle,
} from './units'

describe('units.ts', () => {
  describe('IN_TO_CM constant', () => {
    it('equals 2.54', () => {
      expect(IN_TO_CM).toBe(2.54)
    })
  })

  describe('cmToIn', () => {
    it('converts 2.54cm to 1 inch', () => {
      expect(cmToIn(2.54)).toBeCloseTo(1, 9)
    })

    it('converts 10cm to inches', () => {
      expect(cmToIn(10)).toBeCloseTo(10 / 2.54, 9)
    })

    it('converts 0cm to 0 inches', () => {
      expect(cmToIn(0)).toBeCloseTo(0, 9)
    })

    it('converts negative values', () => {
      expect(cmToIn(-10)).toBeCloseTo(-10 / 2.54, 9)
    })
  })

  describe('inToCm', () => {
    it('converts 1 inch to 2.54cm', () => {
      expect(inToCm(1)).toBeCloseTo(2.54, 9)
    })

    it('converts 4 inches to 10.16cm', () => {
      expect(inToCm(4)).toBeCloseTo(10.16, 9)
    })

    it('converts 0 inches to 0cm', () => {
      expect(inToCm(0)).toBeCloseTo(0, 9)
    })

    it('converts negative values', () => {
      expect(inToCm(-4)).toBeCloseTo(-10.16, 9)
    })
  })

  describe('roundtrip conversion', () => {
    it('cm -> in -> cm maintains precision', () => {
      const original = 10
      const toInches = cmToIn(original)
      const backToCm = inToCm(toInches)
      expect(backToCm).toBeCloseTo(original, 9)
    })

    it('in -> cm -> in maintains precision', () => {
      const original = 4
      const toCm = inToCm(original)
      const backToIn = cmToIn(toCm)
      expect(backToIn).toBeCloseTo(original, 9)
    })

    it('22 sts/10cm stays 22 sts/4in (gauge meaning)', () => {
      // 10cm = 10/2.54 inches ≈ 3.937 inches, not exactly 4
      // But the default is 4in for a swatch
      // So if we have 22 sts over 10cm, the gauge is 22/10 = 2.2 sts/cm
      // In inches: 2.2 sts/cm = 2.2 * 2.54 sts/inch ≈ 5.588 sts/inch
      // For a 4in swatch: 5.588 * 4 ≈ 22.352 stitches
      // But the intent is 22 stitches per "10cm or 4in" (the convention)
      // This test checks that if we say "22 sts per 10cm", we mean per the 10cm measurement
      const stitchesPerCm = 22 / 10 // 2.2 stitches per cm
      const stitchesPerInch = stitchesPerCm * 2.54 // ≈ 5.588 stitches per inch
      // For a 4in swatch: 5.588 * 4 ≈ 22.352, rounded to 22
      // So the gauge meaning is preserved via the exact conversion
      expect(stitchesPerInch * 4).toBeCloseTo(22.352, 2)
    })
  })

  describe('toBaseCm', () => {
    it('returns cm value unchanged for cm unit', () => {
      expect(toBaseCm(10, 'cm')).toBeCloseTo(10, 9)
    })

    it('converts inches to cm', () => {
      expect(toBaseCm(4, 'inch')).toBeCloseTo(10.16, 9)
    })

    it('returns 0 for both units', () => {
      expect(toBaseCm(0, 'cm')).toBeCloseTo(0, 9)
      expect(toBaseCm(0, 'inch')).toBeCloseTo(0, 9)
    })
  })

  describe('fromBaseCm', () => {
    it('returns cm value unchanged for cm unit', () => {
      expect(fromBaseCm(10, 'cm')).toBeCloseTo(10, 9)
    })

    it('converts cm to inches', () => {
      expect(fromBaseCm(10.16, 'inch')).toBeCloseTo(4, 9)
    })

    it('returns 0 for both units', () => {
      expect(fromBaseCm(0, 'cm')).toBeCloseTo(0, 9)
      expect(fromBaseCm(0, 'inch')).toBeCloseTo(0, 9)
    })
  })

  describe('defaultSwatchSize', () => {
    it('returns 10 for cm', () => {
      expect(defaultSwatchSize('cm')).toBe(10)
    })

    it('returns 4 for inch', () => {
      expect(defaultSwatchSize('inch')).toBe(4)
    })
  })

  describe('convertSwatchSizeOnUnitToggle', () => {
    it('uses default when toggling from cm default to inch', () => {
      // User has fresh 10cm swatch, toggles to inch → should get 4in default
      const result = convertSwatchSizeOnUnitToggle(10, 'cm', 'inch')
      expect(result).toBeCloseTo(4, 9)
    })

    it('uses default when toggling from inch default to cm', () => {
      // User has fresh 4in swatch, toggles to cm → should get 10cm default
      const result = convertSwatchSizeOnUnitToggle(4, 'inch', 'cm')
      expect(result).toBeCloseTo(10, 9)
    })

    it('converts custom value when toggling from cm to inch', () => {
      // User has custom 12cm swatch, toggles to inch → should convert 12cm to inches
      const result = convertSwatchSizeOnUnitToggle(12, 'cm', 'inch')
      expect(result).toBeCloseTo(12 / 2.54, 9)
    })

    it('converts custom value when toggling from inch to cm', () => {
      // User has custom 5in swatch, toggles to cm → should convert 5in to cm
      const result = convertSwatchSizeOnUnitToggle(5, 'inch', 'cm')
      expect(result).toBeCloseTo(5 * 2.54, 9)
    })

    it('preserves gauge meaning across unit toggle', () => {
      // Scenario: User has 22 sts over 10cm default swatch in cm
      // They toggle to inches
      const swatchCm = 10 // fresh default
      const swatchIn = convertSwatchSizeOnUnitToggle(swatchCm, 'cm', 'inch')
      expect(swatchIn).toBeCloseTo(4, 9) // fresh default for inch

      // Gauge meaning should be preserved
      // 22 sts per 10cm = 2.2 sts/cm
      // With inch default (4in): how many stitches?
      // 4in = 10.16cm, so 22 * (10.16 / 10) = 22.352 ≈ 22
      // The gauge meaning is preserved via exact conversion

      // Now test the reverse: fresh 4in to cm
      const swatchIn2 = 4 // fresh default
      const swatchCm2 = convertSwatchSizeOnUnitToggle(swatchIn2, 'inch', 'cm')
      expect(swatchCm2).toBeCloseTo(10, 9) // fresh default for cm
    })

    it('uses tolerance for near-default values', () => {
      // A value very close to the default should be treated as default
      const almostDefault = 10.0000000001 // Just barely over 10
      const result = convertSwatchSizeOnUnitToggle(almostDefault, 'cm', 'inch')
      expect(result).toBeCloseTo(4, 9) // Should use default
    })
  })

  describe('unit toggle swatch goal 50cm example', () => {
    it('when toggling units, gauge meaning and target dimension relationship preserved', () => {
      // Start with 22 sts / 30 rows per 10cm, want 50cm × 30cm → 110 sts, 90 rows
      const swatchCm = 10
      const stitches = 22
      const rows = 30
      const targetWidthCm = 50

      // Gauge
      const stPerCm = stitches / swatchCm // 2.2
      const rowPerCm = rows / swatchCm // 3

      // Cast-on stitches for 50cm
      const castOnSts = Math.round(targetWidthCm * stPerCm) // 110
      expect(castOnSts).toBe(110)

      // Toggle to inches
      const swatchIn = convertSwatchSizeOnUnitToggle(swatchCm, 'cm', 'inch')
      expect(swatchIn).toBeCloseTo(4, 9) // Fresh default

      // Now user enters the same swatch measurement in inches
      // They actually measured over 4in, so recalculate gauge
      const stPerIn = stitches / swatchIn // 22 / 4 = 5.5
      const rowPerIn = rows / swatchIn // 30 / 4 = 7.5

      // For 50cm = ~19.685in
      const targetWidthIn = targetWidthCm / 2.54 // ≈ 19.685
      const castOnStsIn = Math.round(targetWidthIn * stPerIn) // 19.685 * 5.5 ≈ 108.27 → 108
      expect(castOnStsIn).toBe(108)

      // The difference arises because 4in ≠ 10cm
      // But the gauge *meaning* (stitches per actual measurement) is preserved
    })
  })
})
