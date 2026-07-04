/**
 * Mass converter tests
 */

import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './mass';

describe('mass converter', () => {
  describe('kilogram conversions', () => {
    it('converts 1 kg to 1000 grams', () => {
      expect(convert(1, 'kilogram', 'gram')).toBe(1000);
    });

    it('converts 1 kg to 1e6 milligrams', () => {
      expect(convert(1, 'kilogram', 'milligram')).toBe(1e6);
    });

    it('converts 1 kg to ~35.274 ounces', () => {
      expect(convert(1, 'kilogram', 'ounce')).toBeCloseTo(35.274, 2);
    });

    it('converts 1 kg to ~2.20462 pounds', () => {
      expect(convert(1, 'kilogram', 'pound')).toBeCloseTo(2.20462, 5);
    });
  });

  describe('reverse conversions', () => {
    it('converts 1000 grams to 1 kilogram', () => {
      expect(convert(1000, 'gram', 'kilogram')).toBe(1);
    });

    it('converts 1 pound to ~0.453592 kilograms', () => {
      expect(convert(1, 'pound', 'kilogram')).toBeCloseTo(0.453592, 6);
    });

    it('converts 16 ounces to 1 pound', () => {
      expect(convert(16, 'ounce', 'pound')).toBeCloseTo(1, 5);
    });
  });

  describe('round-trip accuracy', () => {
    it('kg → lb → kg = original', () => {
      const original = 75;
      const lbs = convert(original, 'kilogram', 'pound');
      const back = convert(lbs, 'pound', 'kilogram');
      expect(Math.abs(original - back)).toBeLessThan(1e-10);
    });
  });

  describe('edge cases', () => {
    it('handles zero input', () => {
      expect(convert(0, 'kilogram', 'gram')).toBe(0);
    });

    it('throws on unknown unit', () => {
      expect(() => convert(1, 'kilogram', 'ton')).toThrow();
    });
  });

  describe('validateUnit', () => {
    it('returns true for valid units', () => {
      expect(validateUnit('kilogram')).toBe(true);
      expect(validateUnit('gram')).toBe(true);
      expect(validateUnit('pound')).toBe(true);
    });

    it('returns false for invalid units', () => {
      expect(validateUnit('ton')).toBe(false);
    });
  });
});
