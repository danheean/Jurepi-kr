/**
 * Length converter — factor-based conversions to/from meter (base unit)
 */

export const UNITS = {
  meter: 1,
  millimeter: 0.001,
  centimeter: 0.01,
  kilometer: 1000,
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.34,
} as const;

/**
 * Convert a length value from one unit to another.
 * @param value — numeric input
 * @param fromUnit — unit id (e.g., "meter", "foot")
 * @param toUnit — target unit id
 * @returns converted value (Float64)
 * @throws Error if unit is unknown
 */
export function convert(value: number, fromUnit: string, toUnit: string): number {
  const fromFactor = UNITS[fromUnit as keyof typeof UNITS];
  const toFactor = UNITS[toUnit as keyof typeof UNITS];

  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown unit: from=${fromUnit} to=${toUnit}`);
  }

  return (value * fromFactor) / toFactor;
}

/**
 * Check if a unit is valid in this category
 */
export function validateUnit(unit: string): boolean {
  return unit in UNITS;
}
