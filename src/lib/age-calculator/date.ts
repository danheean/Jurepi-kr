/**
 * DateKey: string in YYYY-MM-DD format (local midnight, never UTC)
 */
export type DateKey = string; // "YYYY-MM-DD"

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Convert a Date to "YYYY-MM-DD" using LOCAL date components (never UTC).
 */
export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Parse "YYYY-MM-DD" to a Date at local midnight.
 */
export function parseDateKey(k: DateKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Add/subtract days to a dateKey, DST-safe via setDate().
 */
export function addDays(k: DateKey, delta: number): DateKey {
  const d = parseDateKey(k);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Return the number of days in a month (1-12), respecting leap years.
 */
export function daysInMonth(y: number, m: number): number {
  if (m === 2) {
    return isLeapYear(y) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(m)) {
    return 30;
  }
  return 31;
}

/**
 * Get today's dateKey. Accepts an optional injected `now` for testing.
 */
export function today(now?: Date): DateKey {
  return toDateKey(now ?? new Date());
}
