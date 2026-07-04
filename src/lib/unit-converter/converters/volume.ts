/**
 * Volume converter — factor-based conversions to/from cubic meter (base unit)
 * Note: Liter is 0.001 m³, so we use m³ as the base internally
 */

export const UNITS = {
  liter: 0.001,
  milliliter: 1e-6,
  cubic_inch: 1.63871e-5,
  cubic_foot: 0.0283168,
  gallon: 0.00378541, // US gallon
} as const;

export function convert(value: number, fromUnit: string, toUnit: string): number {
  const fromFactor = UNITS[fromUnit as keyof typeof UNITS];
  const toFactor = UNITS[toUnit as keyof typeof UNITS];

  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown unit: from=${fromUnit} to=${toUnit}`);
  }

  return (value * fromFactor) / toFactor;
}

export function validateUnit(unit: string): boolean {
  return unit in UNITS;
}
