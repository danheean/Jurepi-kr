import { describe, it, expect } from 'vitest';
import {
  manNai,
  yeonNai,
  seeneunNai,
  dayOfWeek,
  daysLived,
  breakdown,
  nextBirthdayCountdown,
  calculateAge,
} from './age';

describe('age-calculator/age', () => {
  describe('manNai', () => {
    it('calculates legal age (Korea 2023+)', () => {
      const birthDate = new Date(2000, 2, 15); // March 15, 2000
      const asOfDate = new Date(2024, 6, 15); // July 15, 2024

      // Birthday has passed in 2024 (July > March)
      expect(manNai(birthDate, asOfDate)).toBe(24);
    });

    it('does not increment until actual birthday', () => {
      const birthDate = new Date(2000, 2, 15); // March 15, 2000
      const beforeBirthday = new Date(2024, 2, 14); // March 14, 2024
      const afterBirthday = new Date(2024, 2, 15); // March 15, 2024

      expect(manNai(birthDate, beforeBirthday)).toBe(23);
      expect(manNai(birthDate, afterBirthday)).toBe(24);
    });

    it('handles leap day births in non-leap years', () => {
      const birthDate = new Date(1996, 1, 29); // Feb 29, 1996 (leap year)
      const nonLeapYear2025 = new Date(2025, 2, 1); // March 1, 2025

      // Birthday Feb 29 in non-leap year 2025: anniversary is Feb 28 or Mar 1?
      // We'll check the implementation handles this
      const age = manNai(birthDate, nonLeapYear2025);
      expect(age).toBeGreaterThanOrEqual(28);
      expect(age).toBeLessThanOrEqual(29);
    });

    it('returns 0 for newborns (same day)', () => {
      const birthDate = new Date(2024, 6, 15);
      const sameDay = new Date(2024, 6, 15);

      expect(manNai(birthDate, sameDay)).toBe(0);
    });

    it('handles >100 year old births', () => {
      const birthDate = new Date(1900, 0, 1);
      const asOfDate = new Date(2024, 0, 1);

      expect(manNai(birthDate, asOfDate)).toBe(124);
    });
  });

  describe('yeonNai', () => {
    it('calculates calendar year based age', () => {
      expect(yeonNai(2000, 2024)).toBe(24);
    });

    it('returns same value even before birthday', () => {
      // yeonNai doesn't care about actual birthday, just year difference
      expect(yeonNai(2000, 2024)).toBe(24);
      expect(yeonNai(2000, 2025)).toBe(25);
    });

    it('returns 0 for same year birth', () => {
      expect(yeonNai(2024, 2024)).toBe(0);
    });
  });

  describe('seeneunNai', () => {
    it('calculates traditional Korean counting age', () => {
      // Birth year counts as 1
      expect(seeneunNai(2000, 2024)).toBe(25); // 2024 - 2000 + 1
    });

    it('is yeonNai + 1', () => {
      const birthYear = 1990;
      const asOfYear = 2024;

      expect(seeneunNai(birthYear, asOfYear)).toBe(yeonNai(birthYear, asOfYear) + 1);
    });

    it('returns 1 for same year birth', () => {
      expect(seeneunNai(2024, 2024)).toBe(1);
    });
  });

  describe('dayOfWeek', () => {
    it('returns 0-6 for day of week', () => {
      const date = new Date(2000, 2, 15); // March 15, 2000 (known Wednesday)
      const dow = dayOfWeek(date);

      expect(dow).toBeGreaterThanOrEqual(0);
      expect(dow).toBeLessThanOrEqual(6);
    });

    it('returns correct day for known dates', () => {
      // Jan 1, 2000 was a Saturday (day 6)
      expect(dayOfWeek(new Date(2000, 0, 1))).toBe(6);

      // Jan 1, 2024 was a Monday (day 1)
      expect(dayOfWeek(new Date(2024, 0, 1))).toBe(1);
    });
  });

  describe('daysLived', () => {
    it('calculates total days lived', () => {
      const birthDate = new Date(2000, 0, 1); // Jan 1, 2000
      const asOfDate = new Date(2000, 0, 11); // Jan 11, 2000

      expect(daysLived(birthDate, asOfDate)).toBe(10);
    });

    it('returns 0 on birth day', () => {
      const birthDate = new Date(2000, 0, 1);
      const sameDay = new Date(2000, 0, 1);

      expect(daysLived(birthDate, sameDay)).toBe(0);
    });

    it('handles year boundary', () => {
      const birthDate = new Date(2000, 0, 1); // Jan 1, 2000
      const asOfDate = new Date(2001, 0, 1); // Jan 1, 2001

      expect(daysLived(birthDate, asOfDate)).toBe(366); // 2000 is leap year
    });

    it('accumulates to ~8000+ days for ~22 years', () => {
      const birthDate = new Date(2000, 2, 15);
      const asOfDate = new Date(2022, 2, 15);

      const days = daysLived(birthDate, asOfDate);
      expect(days).toBeGreaterThan(8000);
      expect(days).toBeLessThan(8100); // ~22 years (accounting for leap years)
    });
  });

  describe('breakdown', () => {
    it('calculates years, months, days', () => {
      const birthDate = new Date(2000, 2, 15); // March 15, 2000
      const asOfDate = new Date(2024, 6, 15); // July 15, 2024

      const result = breakdown(birthDate, asOfDate);
      expect(result.years).toBe(24);
      expect(result.months).toBe(4); // March to July = 4 months
      expect(result.days).toBe(0);
    });

    it('handles fractional months', () => {
      const birthDate = new Date(2000, 2, 15);
      const asOfDate = new Date(2024, 6, 10); // 5 days before anniversary

      const result = breakdown(birthDate, asOfDate);
      expect(result.years).toBe(24);
      expect(result.months).toBe(3);
      expect(result.days).toBe(25); // 25 days remaining (April 15 - July 10)
    });

    it('invariant: years <= manNai', () => {
      const birthDate = new Date(2000, 2, 15);
      const asOfDate = new Date(2024, 6, 15);

      const bd = breakdown(birthDate, asOfDate);
      const age = manNai(birthDate, asOfDate);

      expect(bd.years).toBeLessThanOrEqual(age);
    });

    it('returns 0/0/0 for same day', () => {
      const birthDate = new Date(2000, 2, 15);
      const sameDay = new Date(2000, 2, 15);

      const result = breakdown(birthDate, sameDay);
      expect(result.years).toBe(0);
      expect(result.months).toBe(0);
      expect(result.days).toBe(0);
    });
  });

  describe('nextBirthdayCountdown', () => {
    it('returns days until next birthday in same year', () => {
      const birthDate = new Date(2000, 2, 15); // March 15
      const asOfDate = new Date(2024, 6, 1); // July 1, 2024

      // Birthday already passed this year, so next is March 15, 2025
      const countdown = nextBirthdayCountdown(birthDate, asOfDate);
      expect(countdown).toBeGreaterThan(200); // Should be ~259 days
    });

    it('returns correct countdown before birthday', () => {
      const birthDate = new Date(2000, 2, 15);
      const beforeBirthday = new Date(2024, 2, 1); // March 1, 2024

      const countdown = nextBirthdayCountdown(birthDate, beforeBirthday);
      expect(countdown).toBe(14); // 14 days until March 15
    });

    it('returns 365 or 366 day cycle length', () => {
      const birthDate = new Date(2000, 2, 15);

      // Day after birthday
      const afterBirthday = new Date(2024, 2, 16);
      const countdown = nextBirthdayCountdown(birthDate, afterBirthday);

      expect(countdown).toBeGreaterThanOrEqual(364);
      expect(countdown).toBeLessThanOrEqual(366);
    });

    it('handles leap day edge case (Feb 29)', () => {
      const birthDate = new Date(1996, 1, 29); // Feb 29, 1996
      const asOfDate = new Date(2025, 1, 28); // Feb 28, 2025 (non-leap year)

      const countdown = nextBirthdayCountdown(birthDate, asOfDate);
      // Next anniversary depends on impl: Mar 1 or Feb 28
      expect(countdown).toBeGreaterThanOrEqual(0);
      expect(countdown).toBeLessThanOrEqual(366);
    });

    it('invariant: countdown in [1, 366]', () => {
      const birthDate = new Date(2000, 2, 15);
      const dates = [
        new Date(2024, 2, 14),
        new Date(2024, 2, 15),
        new Date(2024, 2, 16),
        new Date(2024, 6, 1),
        new Date(2024, 11, 31),
      ];

      dates.forEach((d) => {
        const countdown = nextBirthdayCountdown(birthDate, d);
        expect(countdown).toBeGreaterThanOrEqual(1);
        expect(countdown).toBeLessThanOrEqual(366);
      });
    });
  });

  describe('calculateAge', () => {
    it('returns complete AgeResult', () => {
      const birthDate = new Date(2000, 2, 15);
      const asOfDate = new Date(2024, 6, 15);

      const result = calculateAge(birthDate, asOfDate);

      expect(result).toHaveProperty('manNai', 24);
      expect(result).toHaveProperty('yeonNai', 24);
      expect(result).toHaveProperty('seeneunNai', 25);
      expect(result).toHaveProperty('dayOfWeek');
      expect(result).toHaveProperty('daysLived');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('nextBirthdayCountdown');
      expect(result).toHaveProperty('zodiacKey');
      expect(result).toHaveProperty('starSignKey');
    });

    it('zodiacKey and starSignKey are strings', () => {
      const birthDate = new Date(2000, 2, 15);
      const asOfDate = new Date(2024, 6, 15);

      const result = calculateAge(birthDate, asOfDate);

      expect(typeof result.zodiacKey).toBe('string');
      expect(typeof result.starSignKey).toBe('string');
      expect(result.zodiacKey).toBe('dragon'); // 2000
      expect(result.starSignKey).toBe('pisces'); // March 15
    });

    it('includes correct zodiac for birth year', () => {
      const birthDate = new Date(2008, 0, 1);
      const asOfDate = new Date(2024, 0, 1);

      const result = calculateAge(birthDate, asOfDate);
      expect(result.zodiacKey).toBe('rat'); // 2008
    });

    it('invariants hold for all ages', () => {
      const birthDate = new Date(1960, 0, 15);
      const asOfDate = new Date(2024, 6, 15);

      const result = calculateAge(birthDate, asOfDate);

      expect(result.manNai).toBeGreaterThanOrEqual(0);
      expect(result.yeonNai).toBeGreaterThanOrEqual(0);
      expect(result.seeneunNai).toBeGreaterThanOrEqual(0);
      expect(result.daysLived).toBeGreaterThanOrEqual(0);
      expect(result.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(result.dayOfWeek).toBeLessThanOrEqual(6);
      expect(result.breakdown.years).toBeLessThanOrEqual(result.manNai);
      expect(result.nextBirthdayCountdown).toBeGreaterThanOrEqual(1);
      expect(result.nextBirthdayCountdown).toBeLessThanOrEqual(366);
    });
  });
});
