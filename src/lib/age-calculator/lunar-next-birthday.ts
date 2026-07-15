import { lunarToSolar } from '@/lib/lunar-converter/conversion';
import type { LunarEngine } from '@/lib/lunar-converter/conversion';
import { daysUntilCountdown } from './age';

/**
 * Convert a lunar month/day in a given lunar YEAR to its solar Date (midnight),
 * or null if that lunar date does not exist that year (out of range, missing
 * leap month, or absent day-30). If the birthday was a leap month but the target
 * year has no such leap month, fall back to the regular month of the same
 * number — the common Korean convention for recurring leap-month birthdays.
 */
async function lunarDateToSolar(
  lunarYear: number,
  month: number,
  day: number,
  isLeapMonth: boolean,
  engine?: LunarEngine
): Promise<Date | null> {
  let result = await lunarToSolar(lunarYear, month, day, isLeapMonth, engine);
  if ('error' in result && isLeapMonth) {
    // Leap month absent this year → recur on the regular month.
    result = await lunarToSolar(lunarYear, month, day, false, engine);
  }
  if ('error' in result) return null;
  const { year, month: sm, day: sd } = result.solarDate;
  return new Date(year, sm - 1, sd);
}

/**
 * nextBirthdayCountdown for a LUNAR birthday (1-366), or null when the lunar
 * recurrence can't be resolved (e.g. asOf near the engine's upper bound so next
 * year is out of range). A lunar birthday recurs on the LUNAR calendar, so the
 * next occurrence is this year's (or next year's) lunar month/day re-projected
 * onto the solar calendar — NOT the solar month/day of the original birth year.
 *
 * @param engine optional injected engine (tests); production loads the library.
 */
export async function lunarNextBirthdayCountdown(
  month: number,
  day: number,
  isLeapMonth: boolean,
  asOfDate: Date,
  engine?: LunarEngine
): Promise<number | null> {
  const thisYear = asOfDate.getFullYear();

  const solarThis = await lunarDateToSolar(thisYear, month, day, isLeapMonth, engine);
  if (solarThis && solarThis > asOfDate) {
    return daysUntilCountdown(solarThis, asOfDate);
  }

  const solarNext = await lunarDateToSolar(thisYear + 1, month, day, isLeapMonth, engine);
  if (solarNext) {
    return daysUntilCountdown(solarNext, asOfDate);
  }

  return null;
}
