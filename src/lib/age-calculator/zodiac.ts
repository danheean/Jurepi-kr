/**
 * Korean Zodiac (띠): 12-year cycle
 * Based on lunar calendar, but simplified to solar year calculation.
 * Returns lowercase stable keys for i18n mapping.
 */

const ZODIACS = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
] as const;

/**
 * Return the Korean zodiac animal key for a given year.
 * Uses (year - 1900) % 12 mapping, where 1900 = rat.
 */
export function koreanZodiac(year: number): string {
  // Handle negative modulo for years before 1900
  const index = ((year - 1900) % 12 + 12) % 12;
  return ZODIACS[index];
}

/**
 * Western Star Signs (Zodiac constellations)
 * Month-day boundaries following standard astrology.
 * Returns lowercase stable keys for i18n mapping.
 */

interface StarSignBoundary {
  sign: string;
  monthStart: number;
  dayStart: number;
  monthEnd: number;
  dayEnd: number;
}

const STAR_SIGNS: StarSignBoundary[] = [
  { sign: 'capricorn', monthStart: 12, dayStart: 22, monthEnd: 1, dayEnd: 19 },
  { sign: 'aquarius', monthStart: 1, dayStart: 20, monthEnd: 2, dayEnd: 18 },
  { sign: 'pisces', monthStart: 2, dayStart: 19, monthEnd: 3, dayEnd: 20 },
  { sign: 'aries', monthStart: 3, dayStart: 21, monthEnd: 4, dayEnd: 19 },
  { sign: 'taurus', monthStart: 4, dayStart: 20, monthEnd: 5, dayEnd: 20 },
  { sign: 'gemini', monthStart: 5, dayStart: 21, monthEnd: 6, dayEnd: 20 },
  { sign: 'cancer', monthStart: 6, dayStart: 21, monthEnd: 7, dayEnd: 22 },
  { sign: 'leo', monthStart: 7, dayStart: 23, monthEnd: 8, dayEnd: 22 },
  { sign: 'virgo', monthStart: 8, dayStart: 23, monthEnd: 9, dayEnd: 22 },
  { sign: 'libra', monthStart: 9, dayStart: 23, monthEnd: 10, dayEnd: 22 },
  { sign: 'scorpio', monthStart: 10, dayStart: 23, monthEnd: 11, dayEnd: 21 },
  { sign: 'sagittarius', monthStart: 11, dayStart: 22, monthEnd: 12, dayEnd: 21 },
];

/**
 * Determine if a date (month, day) falls within a star sign range.
 * Handles Capricorn which spans year boundary (Dec 22 - Jan 19).
 */
function isInSignRange(month: number, day: number, boundary: StarSignBoundary): boolean {
  const { monthStart, dayStart, monthEnd, dayEnd } = boundary;

  // Handle year-spanning signs (e.g., Capricorn)
  if (monthStart > monthEnd) {
    return (month === monthStart && day >= dayStart) || (month === monthEnd && day <= dayEnd);
  }

  // Normal case
  if (month < monthStart || month > monthEnd) {
    return false;
  }

  if (month === monthStart) {
    return day >= dayStart;
  }

  if (month === monthEnd) {
    return day <= dayEnd;
  }

  return true;
}

/**
 * Return the star sign key for a given month (1-12) and day (1-31).
 */
export function starSign(month: number, day: number): string {
  const boundary = STAR_SIGNS.find((b) => isInSignRange(month, day, b));
  return boundary?.sign ?? 'unknown';
}
