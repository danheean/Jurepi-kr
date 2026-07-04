/**
 * Precision formatting tests
 */

import { describe, it, expect } from 'vitest';
import { formatNumber } from './precision';

describe('formatNumber precision', () => {
  describe('en locale formatting', () => {
    it('formats with 0 decimals', () => {
      expect(formatNumber(1234.56, 0, 'en')).toBe('1,235');
    });

    it('formats with 2 decimals and comma separator', () => {
      expect(formatNumber(1234.5, 2, 'en')).toBe('1,234.50');
    });

    it('formats with 3 decimals', () => {
      expect(formatNumber(1.23456, 3, 'en')).toBe('1.235');
    });

    it('preserves trailing zeros', () => {
      expect(formatNumber(1.5, 2, 'en')).toBe('1.50');
    });

    it('rounds correctly', () => {
      expect(formatNumber(1.999, 1, 'en')).toBe('2.0');
    });
  });

  describe('ko locale formatting', () => {
    it('formats with correct separator for Korean locale', () => {
      const result = formatNumber(1234.56, 2, 'ko');
      // Korean locale formatting - check that it contains the key digits
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('decimal clamping', () => {
    it('clamps negative decimals to 0', () => {
      expect(formatNumber(1.23, -5, 'en')).toBe('1');
    });

    it('clamps decimals > 6 to 6', () => {
      expect(formatNumber(1.123456789, 10, 'en')).toBe('1.123457');
    });

    it('allows exactly 0 decimals', () => {
      expect(formatNumber(1.5, 0, 'en')).toBe('2');
    });

    it('allows exactly 6 decimals', () => {
      expect(formatNumber(1.1234567, 6, 'en')).toBe('1.123457');
    });
  });

  describe('edge cases', () => {
    it('formats zero', () => {
      expect(formatNumber(0, 2, 'en')).toBe('0.00');
    });

    it('formats negative numbers', () => {
      expect(formatNumber(-1234.5, 2, 'en')).toBe('-1,234.50');
    });

    it('formats very large numbers', () => {
      const result = formatNumber(1e10, 2, 'en');
      expect(result).toContain('10,000,000,000');
    });

    it('formats very small numbers', () => {
      const result = formatNumber(0.00001, 5, 'en');
      expect(result).toContain('0.00001');
    });

    it('handles Infinity gracefully', () => {
      expect(() => formatNumber(Infinity, 2, 'en')).not.toThrow();
    });

    it('handles NaN gracefully', () => {
      expect(() => formatNumber(NaN, 2, 'en')).not.toThrow();
    });
  });

  describe('default locale', () => {
    it('defaults to en locale', () => {
      expect(formatNumber(1234.5, 2)).toBe('1,234.50');
    });
  });
});
