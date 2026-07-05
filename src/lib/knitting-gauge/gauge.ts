import { Gauge } from './schema'
import { toBaseCm, fromBaseCm } from './units'

/**
 * Calculate stitches per unit based on gauge measurement
 * @param gauge the gauge swatch measurement
 * @returns stitches per unit (cm or inch depending on gauge.unit)
 */
export function stitchesPerUnit(gauge: Gauge): number {
  if (gauge.swatchW <= 0) return 0
  return gauge.stitches / gauge.swatchW
}

/**
 * Calculate rows per unit based on gauge measurement
 * @param gauge the gauge swatch measurement
 * @returns rows per unit (cm or inch depending on gauge.unit)
 */
export function rowsPerUnit(gauge: Gauge): number {
  if (gauge.swatchH <= 0) return 0
  return gauge.rows / gauge.swatchH
}

/**
 * Calculate how many stitches needed for a target width
 * @param targetWidth width in the gauge's unit (cm or inch)
 * @param gauge the gauge measurement
 * @returns exact number of stitches needed
 */
export function stitchesFor(targetWidth: number, gauge: Gauge): number {
  const perUnit = stitchesPerUnit(gauge)
  return targetWidth * perUnit
}

/**
 * Calculate how many rows needed for a target length/height
 * @param targetLength length in the gauge's unit (cm or inch)
 * @param gauge the gauge measurement
 * @returns exact number of rows needed
 */
export function rowsFor(targetLength: number, gauge: Gauge): number {
  const perUnit = rowsPerUnit(gauge)
  return targetLength * perUnit
}

/**
 * Calculate the actual dimension produced by a given count
 * @param count the number of stitches or rows
 * @param perUnit the stitches/rows per unit
 * @returns the dimension in the current unit
 */
export function dimensionFor(count: number, perUnit: number): number {
  if (perUnit === 0) return 0
  return count / perUnit
}

/**
 * Rescale a count from one gauge to another
 * e.g., "pattern calls for 100 sts at 20 sts/10cm, what's equivalent at 22 sts/10cm?"
 * @param count the count in the pattern (stitches or rows)
 * @param fromPerUnit stitches/rows per unit in the pattern gauge
 * @param toPerUnit stitches/rows per unit in your gauge
 * @returns the rescaled count for your gauge
 */
export function rescale(count: number, fromPerUnit: number, toPerUnit: number): number {
  if (fromPerUnit === 0) return 0
  return count * (toPerUnit / fromPerUnit)
}

/**
 * Result of calculating a count with rounding and actual dimension
 */
export interface CountResult {
  /** The exact value (may be fractional) */
  value: number
  /** Rounded to nearest integer */
  rounded: number
  /** The actual dimension this rounded count produces */
  actual: number
  /** Difference from target (actual - target) */
  delta: number
}

/**
 * Calculate stitches/rows with rounding transparency
 * Shows the exact value, rounded value, and the actual dimension the rounded count yields
 * @param targetDimension the target width or length in the gauge's unit
 * @param perUnit stitches or rows per unit
 * @returns result with exact, rounded, actual, and delta
 */
export function withActual(
  targetDimension: number,
  perUnit: number,
): CountResult {
  // Guard against invalid gauge (0 or negative per-unit)
  if (perUnit <= 0) {
    return {
      value: 0,
      rounded: 0,
      actual: 0,
      delta: 0,
    }
  }

  const value = targetDimension * perUnit

  // Guard against invalid values (NaN, Infinity)
  if (!isFinite(value)) {
    return {
      value: 0,
      rounded: 0,
      actual: 0,
      delta: 0,
    }
  }

  const rounded = Math.round(value)
  const actual = dimensionFor(rounded, perUnit)
  const delta = actual - targetDimension

  return {
    value,
    rounded,
    actual,
    delta,
  }
}

/**
 * Calculate cast-on stitches needed for a target width
 * @param targetWidth width in the gauge's unit
 * @param gauge the gauge measurement
 * @returns result with exact, rounded, actual, and delta
 */
export function castOnStitches(targetWidth: number, gauge: Gauge): CountResult {
  const perUnit = stitchesPerUnit(gauge)
  return withActual(targetWidth, perUnit)
}

/**
 * Calculate rows needed for a target length
 * @param targetLength length in the gauge's unit
 * @param gauge the gauge measurement
 * @returns result with exact, rounded, actual, and delta
 */
export function rowsNeeded(targetLength: number, gauge: Gauge): CountResult {
  const perUnit = rowsPerUnit(gauge)
  return withActual(targetLength, perUnit)
}

/**
 * Calculate finished dimensions for a given count
 * @param stitchCount the number of stitches
 * @param gauge the gauge measurement
 * @returns the finished width in the gauge's unit
 */
export function finishedWidth(stitchCount: number, gauge: Gauge): number {
  const perUnit = stitchesPerUnit(gauge)
  return dimensionFor(stitchCount, perUnit)
}

/**
 * Calculate finished dimensions for a given row count
 * @param rowCount the number of rows
 * @param gauge the gauge measurement
 * @returns the finished length in the gauge's unit
 */
export function finishedLength(rowCount: number, gauge: Gauge): number {
  const perUnit = rowsPerUnit(gauge)
  return dimensionFor(rowCount, perUnit)
}

/**
 * Rescale a pattern count to your gauge
 * @param patternCount the cast-on or stitch count from the pattern
 * @param patternStitchesPerUnit stitches per unit in the pattern gauge
 * @param yourStitchesPerUnit stitches per unit in your gauge
 * @returns the rescaled count for your gauge (rounded)
 */
export function rescalePatternCount(
  patternCount: number,
  patternStitchesPerUnit: number,
  yourStitchesPerUnit: number,
): CountResult {
  const value = rescale(patternCount, patternStitchesPerUnit, yourStitchesPerUnit)

  // Guard against invalid values
  if (!isFinite(value)) {
    return {
      value: 0,
      rounded: 0,
      actual: 0,
      delta: 0,
    }
  }

  const rounded = Math.round(value)
  // For pattern rescale, we calculate what finished size the new count produces at the new gauge
  const actual = dimensionFor(rounded, yourStitchesPerUnit)
  // And compare to what the pattern count produces at the pattern gauge
  const patternDimension = dimensionFor(patternCount, patternStitchesPerUnit)
  const delta = actual - patternDimension

  return {
    value,
    rounded,
    actual,
    delta,
  }
}
