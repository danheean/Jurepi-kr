/**
 * Digital Storage converter — factor-based conversions to/from byte (base unit)
 * Includes both decimal (KB=1000) and binary (KiB=1024) units
 */

export const UNITS = {
  byte: 1,
  kilobyte: 1000,
  megabyte: 1e6,
  gigabyte: 1e9,
  terabyte: 1e12,
  kibibyte: 1024,
  mebibyte: 1048576,
  gibibyte: 1073741824,
  tebibyte: 1099511627776,
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
