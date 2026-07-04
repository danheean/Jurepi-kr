/**
 * Area converter — factor-based conversions to/from square meter (base unit)
 */

export const UNITS = {
  square_meter: 1,
  square_millimeter: 1e-6,
  square_centimeter: 0.0001,
  square_kilometer: 1e6,
  square_inch: 0.00064516,
  square_foot: 0.092903,
  square_yard: 0.836127,
  square_mile: 2.58999e6,
  // 평 (Korean pyeong): a square of side 6 ja (1 ja = 10/33 m) → (20/11)² = 400/121 m².
  pyeong: 400 / 121,
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
