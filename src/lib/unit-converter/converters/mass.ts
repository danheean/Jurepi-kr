/**
 * Mass converter — factor-based conversions to/from kilogram (base unit)
 */

export const UNITS = {
  kilogram: 1,
  gram: 0.001,
  milligram: 1e-6,
  ounce: 0.0283495,
  pound: 0.453592,
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
