/**
 * Time converter — factor-based conversions to/from second (base unit)
 */

export const UNITS = {
  millisecond: 0.001,
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
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
