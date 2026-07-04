/**
 * Speed converter — factor-based conversions to/from meter per second (base unit)
 */

export const UNITS = {
  meter_per_second: 1,
  kilometer_per_hour: 1 / 3.6,
  mile_per_hour: 0.44704,
  knot: 0.51444,
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
