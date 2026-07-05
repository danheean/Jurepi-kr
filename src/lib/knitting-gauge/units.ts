/**
 * Unit conversion helpers: cm ↔ inch
 * 1 inch = 2.54 cm (exact)
 *
 * All internal calculations use cm as the base unit.
 * When displaying, we convert back to the selected unit.
 */

export const IN_TO_CM = 2.54

/**
 * Convert cm to inches
 * @param cm value in centimeters
 * @returns value in inches
 */
export function cmToIn(cm: number): number {
  return cm / IN_TO_CM
}

/**
 * Convert inches to cm
 * @param inches value in inches
 * @returns value in centimeters
 */
export function inToCm(inches: number): number {
  return inches * IN_TO_CM
}

/**
 * Normalize a measurement to base unit (cm)
 * @param value the measurement value
 * @param unit "cm" or "inch"
 * @returns value in cm
 */
export function toBaseCm(value: number, unit: 'cm' | 'inch'): number {
  if (unit === 'inch') {
    return inToCm(value)
  }
  return value
}

/**
 * Convert a cm value to the target unit
 * @param baseCmValue value in cm
 * @param targetUnit "cm" or "inch"
 * @returns value in target unit
 */
export function fromBaseCm(baseCmValue: number, targetUnit: 'cm' | 'inch'): number {
  if (targetUnit === 'inch') {
    return cmToIn(baseCmValue)
  }
  return baseCmValue
}

/**
 * Get default swatch size for a unit
 * @param unit "cm" or "inch"
 * @returns default swatch size in that unit
 */
export function defaultSwatchSize(unit: 'cm' | 'inch'): number {
  return unit === 'cm' ? 10 : 4
}

/**
 * Convert default swatch size when toggling units
 * If user has a fresh 10cm swatch and toggles to inch, suggest 4in
 * If user has a fresh 4in swatch and toggles to cm, suggest 10cm
 * @param currentSwatchSize current swatch size
 * @param fromUnit current unit
 * @param toUnit target unit
 * @returns the swatch size to use in the new unit (either default or converted value)
 */
export function convertSwatchSizeOnUnitToggle(
  currentSwatchSize: number,
  fromUnit: 'cm' | 'inch',
  toUnit: 'cm' | 'inch',
): number {
  // Check if it's a "fresh" default value
  const fromDefault = defaultSwatchSize(fromUnit)
  const toDefault = defaultSwatchSize(toUnit)

  // If current swatch is exactly the default for the current unit,
  // return the default for the new unit
  if (Math.abs(currentSwatchSize - fromDefault) < 1e-9) {
    return toDefault
  }

  // Otherwise, convert the actual value
  const baseCm = toBaseCm(currentSwatchSize, fromUnit)
  return fromBaseCm(baseCm, toUnit)
}
