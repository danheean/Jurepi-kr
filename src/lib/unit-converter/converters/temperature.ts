/**
 * Temperature converter — affine transform (not factor-based)
 * All conversions go through Celsius (base unit) as an intermediary.
 *
 * Formula: T_target = (T_source - b_source) / a_source * a_target + b_target
 * Simplified: T_base = (T_source - b) / a, then T_target = T_base * a + b
 */

export const FORMULAS: Record<string, { a: number; b: number }> = {
  celsius: { a: 1, b: 0 }, // base
  fahrenheit: { a: 9 / 5, b: 32 }, // C→F: (C × 9/5) + 32
  kelvin: { a: 1, b: 273.15 }, // C→K: C + 273.15
} as const;

/**
 * Normalize unit names to canonical form
 */
function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();
  const map: Record<string, string> = {
    c: 'celsius',
    '°c': 'celsius',
    '℃': 'celsius',
    f: 'fahrenheit',
    '°f': 'fahrenheit',
    '℉': 'fahrenheit',
    k: 'kelvin',
  };
  return map[normalized] ?? normalized;
}

/**
 * Convert temperature from one unit to another.
 * All conversions go through Celsius as an intermediary.
 * @param value — numeric input
 * @param fromUnit — unit id or symbol (e.g., "celsius", "°C", "fahrenheit")
 * @param toUnit — target unit id or symbol
 * @returns converted value (Float64)
 * @throws Error if unit is unknown
 *
 * @example convert(32, 'fahrenheit', 'celsius') → 0
 * @example convert(0, 'celsius', 'fahrenheit') → 32
 * @example convert(273.15, 'kelvin', 'celsius') → 0
 */
export function convert(value: number, fromUnit: string, toUnit: string): number {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  if (!FORMULAS[normalizedFrom] || !FORMULAS[normalizedTo]) {
    throw new Error(`Unknown temperature unit: from=${fromUnit} to=${toUnit}`);
  }

  // Step 1: Convert fromUnit → Celsius (base)
  const { a: a1, b: b1 } = FORMULAS[normalizedFrom];
  const celsius = (value - b1) / a1;

  // Step 2: Convert Celsius → toUnit
  const { a: a2, b: b2 } = FORMULAS[normalizedTo];
  const result = celsius * a2 + b2;

  return result;
}

/**
 * Check if a unit is valid in this category
 */
export function validateUnit(unit: string): boolean {
  return normalizeUnit(unit) in FORMULAS;
}
