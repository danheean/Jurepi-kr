/**
 * Router conversion tests
 */

import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './convert';

describe('convert router', () => {
  describe('dispatches to correct category', () => {
    it('length: meter to kilometer', () => {
      expect(convert('length', 1000, 'meter', 'kilometer')).toBe(1);
    });

    it('mass: kilogram to pound', () => {
      expect(convert('mass', 1, 'kilogram', 'pound')).toBeCloseTo(2.20462, 5);
    });

    it('temperature: celsius to fahrenheit', () => {
      expect(convert('temperature', 0, 'celsius', 'fahrenheit')).toBe(32);
    });

    it('area: square_meter to square_foot', () => {
      expect(convert('area', 1, 'square_meter', 'square_foot')).toBeCloseTo(10.764, 3);
    });

    it('volume: liter to gallon', () => {
      expect(convert('volume', 1, 'liter', 'gallon')).toBeCloseTo(0.264172, 6);
    });

    it('speed: meter_per_second to kilometer_per_hour', () => {
      expect(convert('speed', 1, 'meter_per_second', 'kilometer_per_hour')).toBeCloseTo(3.6, 10);
    });

    it('digital_storage: megabyte to kilobyte', () => {
      expect(convert('digital_storage', 1, 'megabyte', 'kilobyte')).toBe(1000);
    });

    it('time: minute to second', () => {
      expect(convert('time', 1, 'minute', 'second')).toBe(60);
    });
  });

  describe('error handling', () => {
    it('throws on unknown category', () => {
      expect(() => convert('currency' as any, 1, 'usd', 'eur')).toThrow();
    });

    it('throws on unknown unit in category', () => {
      expect(() => convert('length', 1, 'meter', 'furlong')).toThrow();
    });

    it('throws when both units unknown', () => {
      expect(() => convert('length', 1, 'furlong', 'fathom')).toThrow();
    });
  });

  describe('validateUnit router', () => {
    it('validates units in correct category', () => {
      expect(validateUnit('length', 'meter')).toBe(true);
      expect(validateUnit('mass', 'kilogram')).toBe(true);
      expect(validateUnit('temperature', 'celsius')).toBe(true);
    });

    it('rejects units not in category', () => {
      expect(validateUnit('length', 'kilogram')).toBe(false);
      expect(validateUnit('mass', 'meter')).toBe(false);
    });

    it('returns false for unknown category', () => {
      expect(validateUnit('currency' as any, 'usd')).toBe(false);
    });

    it('returns false for unknown unit', () => {
      expect(validateUnit('length', 'furlong')).toBe(false);
    });
  });
});
