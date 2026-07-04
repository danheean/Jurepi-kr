/**
 * Precision formatting via Intl.NumberFormat
 */

/**
 * Format a number to a given number of decimal places using Intl.NumberFormat.
 * Preserves trailing zeros (e.g., 1.50 with 2 decimals displays as "1.50").
 *
 * @param value — numeric value to format
 * @param decimals — number of decimal places (0–6, will be clamped)
 * @param locale — BCP 47 locale (e.g., 'ko', 'en', 'de'); defaults to 'en'
 * @returns formatted string (e.g., "1,234.56" for en, "1234,56" for de)
 */
export function formatNumber(value: number, decimals: number, locale: string = 'en'): string {
  // Clamp decimals to [0, 6]
  const clampedDecimals = Math.min(6, Math.max(0, Math.round(decimals)));

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: clampedDecimals,
    maximumFractionDigits: clampedDecimals,
  });

  return formatter.format(value);
}
