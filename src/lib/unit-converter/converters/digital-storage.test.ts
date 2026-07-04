import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './digital-storage';

describe('digital storage converter', () => {
  describe('decimal units (KB=1000, MB, GB, TB)', () => {
    it('converts 1 KB to 1000 bytes', () => {
      expect(convert(1, 'kilobyte', 'byte')).toBe(1000);
    });

    it('converts 1 MB to 1000 KB', () => {
      expect(convert(1, 'megabyte', 'kilobyte')).toBe(1000);
    });

    it('converts 1 GB to 1e9 bytes', () => {
      expect(convert(1, 'gigabyte', 'byte')).toBe(1e9);
    });

    it('converts 1 TB to 1e12 bytes', () => {
      expect(convert(1, 'terabyte', 'byte')).toBe(1e12);
    });
  });

  describe('binary units (KiB=1024, MiB, GiB, TiB)', () => {
    it('converts 1 KiB to 1024 bytes', () => {
      expect(convert(1, 'kibibyte', 'byte')).toBe(1024);
    });

    it('converts 1 MiB to 1024 KiB', () => {
      expect(convert(1, 'mebibyte', 'kibibyte')).toBe(1024);
    });

    it('converts 1 GiB to 1024 MiB', () => {
      expect(convert(1, 'gibibyte', 'mebibyte')).toBe(1024);
    });

    it('converts 1 TiB to 1024 GiB', () => {
      expect(convert(1, 'tebibyte', 'gibibyte')).toBe(1024);
    });
  });

  describe('decimal ↔ binary conversions', () => {
    it('converts 1 MB (decimal) to ~0.9537 MiB (binary)', () => {
      // 1 MB = 1e6 bytes, 1 MiB = 1048576 bytes, so 1e6 / 1048576 = 0.95367...
      expect(convert(1, 'megabyte', 'mebibyte')).toBeCloseTo(1e6 / 1048576, 5);
    });

    it('converts 1 MiB (binary) to ~1.04858 MB (decimal)', () => {
      // 1 MiB = 1048576 bytes, 1 MB = 1e6 bytes, so 1048576 / 1e6 = 1.048576
      expect(convert(1, 'mebibyte', 'megabyte')).toBeCloseTo(1048576 / 1e6, 5);
    });
  });

  describe('edge cases', () => {
    it('handles zero input', () => {
      expect(convert(0, 'megabyte', 'kilobyte')).toBe(0);
    });

    it('round-trip: byte → TB → byte = original', () => {
      const original = 1e15;
      const tb = convert(original, 'byte', 'terabyte');
      const back = convert(tb, 'terabyte', 'byte');
      expect(Math.abs(original - back)).toBeLessThan(1e5);
    });

    it('throws on unknown unit', () => {
      expect(() => convert(1, 'byte', 'petabyte')).toThrow();
    });
  });

  describe('validateUnit', () => {
    it('returns true for decimal units', () => {
      expect(validateUnit('kilobyte')).toBe(true);
      expect(validateUnit('megabyte')).toBe(true);
      expect(validateUnit('gigabyte')).toBe(true);
    });

    it('returns true for binary units', () => {
      expect(validateUnit('kibibyte')).toBe(true);
      expect(validateUnit('mebibyte')).toBe(true);
      expect(validateUnit('gibibyte')).toBe(true);
    });

    it('returns false for invalid units', () => {
      expect(validateUnit('petabyte')).toBe(false);
    });
  });
});
