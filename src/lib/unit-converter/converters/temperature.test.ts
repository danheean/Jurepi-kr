/**
 * Temperature converter tests — CRITICAL round-trip accuracy gate
 */

import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './temperature';

describe('temperature converter', () => {
  describe('celsius ↔ fahrenheit', () => {
    it('converts 0°C to 32°F', () => {
      expect(convert(0, 'celsius', 'fahrenheit')).toBe(32);
    });

    it('converts 32°F to 0°C', () => {
      expect(convert(32, 'fahrenheit', 'celsius')).toBeCloseTo(0, 5);
    });

    it('converts 212°F (boiling) to 100°C', () => {
      expect(convert(212, 'fahrenheit', 'celsius')).toBeCloseTo(100, 1);
    });

    it('converts 100°C (boiling) to 212°F', () => {
      expect(convert(100, 'celsius', 'fahrenheit')).toBeCloseTo(212, 1);
    });

    it('converts -40°C to -40°F (affine fixed point)', () => {
      expect(convert(-40, 'celsius', 'fahrenheit')).toBe(-40);
    });
  });

  describe('celsius ↔ kelvin', () => {
    it('converts 0°C to 273.15K', () => {
      expect(convert(0, 'celsius', 'kelvin')).toBeCloseTo(273.15, 5);
    });

    it('converts 273.15K to 0°C', () => {
      expect(convert(273.15, 'kelvin', 'celsius')).toBeCloseTo(0, 5);
    });

    it('converts 100°C to 373.15K (boiling)', () => {
      expect(convert(100, 'celsius', 'kelvin')).toBeCloseTo(373.15, 5);
    });
  });

  describe('fahrenheit ↔ kelvin', () => {
    it('converts 32°F to 273.15K', () => {
      expect(convert(32, 'fahrenheit', 'kelvin')).toBeCloseTo(273.15, 5);
    });

    it('converts 273.15K to 32°F', () => {
      expect(convert(273.15, 'kelvin', 'fahrenheit')).toBeCloseTo(32, 5);
    });

    it('converts 212°F to 373.15K (boiling)', () => {
      expect(convert(212, 'fahrenheit', 'kelvin')).toBeCloseTo(373.15, 5);
    });
  });

  describe('CRITICAL: round-trip accuracy ±0.0001', () => {
    it('0°C → °F → °C round-trip = 0 (within ±0.0001)', () => {
      const c1 = 0;
      const f = convert(c1, 'celsius', 'fahrenheit');
      const c2 = convert(f, 'fahrenheit', 'celsius');
      expect(Math.abs(c1 - c2)).toBeLessThan(0.0001);
    });

    it('100°C → °F → °C round-trip = 100 (within ±0.0001)', () => {
      const c1 = 100;
      const f = convert(c1, 'celsius', 'fahrenheit');
      const c2 = convert(f, 'fahrenheit', 'celsius');
      expect(Math.abs(c1 - c2)).toBeLessThan(0.0001);
    });

    it('273.15K → °C → K round-trip = 273.15 (within ±0.0001)', () => {
      const k1 = 273.15;
      const c = convert(k1, 'kelvin', 'celsius');
      const k2 = convert(c, 'celsius', 'kelvin');
      expect(Math.abs(k1 - k2)).toBeLessThan(0.0001);
    });

    it('37°C (body temp) → °F → °C round-trip (within ±0.0001)', () => {
      const c1 = 37;
      const f = convert(c1, 'celsius', 'fahrenheit');
      const c2 = convert(f, 'fahrenheit', 'celsius');
      expect(Math.abs(c1 - c2)).toBeLessThan(0.0001);
    });

    it('-273.15°C (absolute zero K) → K → °C round-trip (within ±0.0001)', () => {
      const c1 = -273.15;
      const k = convert(c1, 'celsius', 'kelvin');
      const c2 = convert(k, 'kelvin', 'celsius');
      expect(Math.abs(c1 - c2)).toBeLessThan(0.0001);
    });
  });

  describe('unit normalization (symbols)', () => {
    it('accepts lowercase "c" for celsius', () => {
      expect(convert(0, 'c', 'fahrenheit')).toBe(32);
    });

    it('accepts symbol "°C" for celsius', () => {
      expect(convert(0, '°C', 'fahrenheit')).toBe(32);
    });

    it('accepts lowercase "f" for fahrenheit', () => {
      expect(convert(32, 'f', 'celsius')).toBeCloseTo(0, 5);
    });

    it('accepts symbol "°F" for fahrenheit', () => {
      expect(convert(32, '°F', 'celsius')).toBeCloseTo(0, 5);
    });

    it('accepts lowercase "k" for kelvin', () => {
      expect(convert(273.15, 'k', 'celsius')).toBeCloseTo(0, 5);
    });
  });

  describe('edge cases', () => {
    it('handles very large positive values', () => {
      const result = convert(1000000, 'celsius', 'fahrenheit');
      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('handles very large negative values', () => {
      const result = convert(-1000000, 'celsius', 'fahrenheit');
      expect(isFinite(result)).toBe(true);
      expect(result).toBeLessThan(0);
    });

    it('handles zero input', () => {
      expect(convert(0, 'celsius', 'celsius')).toBe(0);
      expect(convert(0, 'fahrenheit', 'fahrenheit')).toBe(0);
      expect(convert(0, 'kelvin', 'kelvin')).toBe(0);
    });

    it('throws on unknown unit', () => {
      expect(() => convert(0, 'celsius', 'rankine')).toThrow();
    });

    it('throws on both unknown units', () => {
      expect(() => convert(0, 'rankine', 'rankine')).toThrow();
    });
  });

  describe('validateUnit', () => {
    it('returns true for valid units', () => {
      expect(validateUnit('celsius')).toBe(true);
      expect(validateUnit('fahrenheit')).toBe(true);
      expect(validateUnit('kelvin')).toBe(true);
    });

    it('returns true for symbol variants', () => {
      expect(validateUnit('°C')).toBe(true);
      expect(validateUnit('°F')).toBe(true);
      expect(validateUnit('c')).toBe(true);
    });

    it('returns false for unknown units', () => {
      expect(validateUnit('rankine')).toBe(false);
      expect(validateUnit('invalid')).toBe(false);
    });
  });
});
