import { describe, it, expect } from 'vitest';
import {
  DateKey,
  toDateKey,
  parseDateKey,
  addDays,
  isLeapYear,
  daysInMonth,
  today,
} from './date';

describe('age-calculator/date', () => {
  describe('toDateKey', () => {
    it('converts a Date to YYYY-MM-DD using local time', () => {
      const d = new Date(2000, 2, 15); // March 15, 2000
      expect(toDateKey(d)).toBe('2000-03-15');
    });

    it('pads months and days to 2 digits', () => {
      const d = new Date(2000, 0, 5); // Jan 5, 2000
      expect(toDateKey(d)).toBe('2000-01-05');
    });

    it('handles leap year edge', () => {
      const d = new Date(2000, 1, 29); // Feb 29, 2000 (leap year)
      expect(toDateKey(d)).toBe('2000-02-29');
    });
  });

  describe('parseDateKey', () => {
    it('parses YYYY-MM-DD to a Date at local midnight', () => {
      const parsed = parseDateKey('2000-03-15');
      expect(parsed.getFullYear()).toBe(2000);
      expect(parsed.getMonth()).toBe(2); // March (0-indexed)
      expect(parsed.getDate()).toBe(15);
    });

    it('round-trips with toDateKey', () => {
      const key = '1996-02-29';
      const d = parseDateKey(key);
      expect(toDateKey(d)).toBe(key);
    });

    it('handles Jan 1', () => {
      const d = parseDateKey('2000-01-01');
      expect(d.getFullYear()).toBe(2000);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(1);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      expect(addDays('2000-03-15', 5)).toBe('2000-03-20');
    });

    it('subtracts with negative delta', () => {
      expect(addDays('2000-03-15', -5)).toBe('2000-03-10');
    });

    it('handles month boundary forward', () => {
      expect(addDays('2000-03-30', 5)).toBe('2000-04-04');
    });

    it('handles month boundary backward', () => {
      expect(addDays('2000-03-05', -5)).toBe('2000-02-29'); // leap year
    });

    it('handles year boundary', () => {
      expect(addDays('2000-12-28', 5)).toBe('2001-01-02');
    });

    it('zero days is identity', () => {
      expect(addDays('2000-03-15', 0)).toBe('2000-03-15');
    });
  });

  describe('isLeapYear', () => {
    it('returns true for leap years divisible by 4 (not 100)', () => {
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2004)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
    });

    it('returns false for non-leap years', () => {
      expect(isLeapYear(2001)).toBe(false);
      expect(isLeapYear(2100)).toBe(false); // divisible by 100 but not 400
      expect(isLeapYear(1900)).toBe(false);
    });

    it('returns true for years divisible by 400', () => {
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2400)).toBe(true);
    });

    it('handles negative years (edge)', () => {
      // Leap year logic still applies
      expect(isLeapYear(-4)).toBe(true);
    });
  });

  describe('daysInMonth', () => {
    it('returns 31 for Jan, Mar, May, Jul, Aug, Oct, Dec', () => {
      [1, 3, 5, 7, 8, 10, 12].forEach((m) => {
        expect(daysInMonth(2000, m)).toBe(31);
      });
    });

    it('returns 30 for Apr, Jun, Sep, Nov', () => {
      [4, 6, 9, 11].forEach((m) => {
        expect(daysInMonth(2000, m)).toBe(30);
      });
    });

    it('returns 29 for Feb in leap years', () => {
      expect(daysInMonth(2000, 2)).toBe(29);
      expect(daysInMonth(2004, 2)).toBe(29);
    });

    it('returns 28 for Feb in non-leap years', () => {
      expect(daysInMonth(2001, 2)).toBe(28);
      expect(daysInMonth(1900, 2)).toBe(28);
    });
  });

  describe('today', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const now = new Date(2024, 6, 15); // July 15, 2024
      const key = today(now);
      expect(key).toBe('2024-07-15');
    });

    it('uses current date if no argument', () => {
      const key = today();
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
