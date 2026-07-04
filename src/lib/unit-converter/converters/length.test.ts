/**
 * Length converter tests
 */

import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './length';

describe('length converter', () => {
  describe('meter conversions', () => {
    it('converts 1 meter to 1000 millimeters', () => {
      expect(convert(1, 'meter', 'millimeter')).toBe(1000);
    });

    it('converts 1 meter to 100 centimeters', () => {
      expect(convert(1, 'meter', 'centimeter')).toBe(100);
    });

    it('converts 1 meter to 0.001 kilometers', () => {
      expect(convert(1, 'meter', 'kilometer')).toBe(0.001);
    });

    it('converts 1 meter to ~3.28084 feet', () => {
      expect(convert(1, 'meter', 'foot')).toBeCloseTo(3.28084, 5);
    });

    it('converts 1 meter to ~39.3701 inches', () => {
      expect(convert(1, 'meter', 'inch')).toBeCloseTo(39.3701, 4);
    });

    it('converts 1 meter to ~1.09361 yards', () => {
      expect(convert(1, 'meter', 'yard')).toBeCloseTo(1.09361, 5);
    });

    it('converts 1 meter to ~0.000621371 miles', () => {
      expect(convert(1, 'meter', 'mile')).toBeCloseTo(0.000621371, 7);
    });
  });

  describe('reverse conversions', () => {
    it('converts 1000 millimeters to 1 meter', () => {
      expect(convert(1000, 'millimeter', 'meter')).toBe(1);
    });

    it('converts 12 inches to 1 foot', () => {
      expect(convert(12, 'inch', 'foot')).toBeCloseTo(1, 10);
    });

    it('converts 3 feet to 1 yard', () => {
      expect(convert(3, 'foot', 'yard')).toBeCloseTo(1, 10);
    });

    it('converts 5280 feet to 1 mile', () => {
      expect(convert(5280, 'foot', 'mile')).toBeCloseTo(1, 4);
    });
  });

  describe('round-trip accuracy', () => {
    it('meter → mile → meter = original', () => {
      const original = 1000;
      const miles = convert(original, 'meter', 'mile');
      const back = convert(miles, 'mile', 'meter');
      expect(Math.abs(original - back)).toBeLessThan(1e-10);
    });

    it('inch → foot → inch = original', () => {
      const original = 100;
      const feet = convert(original, 'inch', 'foot');
      const back = convert(feet, 'foot', 'inch');
      expect(Math.abs(original - back)).toBeLessThan(1e-10);
    });
  });

  describe('edge cases', () => {
    it('handles zero input', () => {
      expect(convert(0, 'meter', 'kilometer')).toBe(0);
    });

    it('handles very large values', () => {
      const result = convert(1e10, 'meter', 'kilometer');
      expect(isFinite(result)).toBe(true);
      expect(result).toBe(1e7);
    });

    it('handles very small values', () => {
      const result = convert(1e-10, 'meter', 'millimeter');
      expect(isFinite(result)).toBe(true);
    });

    it('throws on unknown "from" unit', () => {
      expect(() => convert(1, 'nautical_mile', 'meter')).toThrow();
    });

    it('throws on unknown "to" unit', () => {
      expect(() => convert(1, 'meter', 'fathom')).toThrow();
    });
  });

  describe('validateUnit', () => {
    it('returns true for valid units', () => {
      expect(validateUnit('meter')).toBe(true);
      expect(validateUnit('kilometer')).toBe(true);
      expect(validateUnit('foot')).toBe(true);
      expect(validateUnit('mile')).toBe(true);
    });

    it('returns false for invalid units', () => {
      expect(validateUnit('nautical_mile')).toBe(false);
      expect(validateUnit('fathom')).toBe(false);
      expect(validateUnit('lightyear')).toBe(false);
    });
  });
});
