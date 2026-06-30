import { describe, it, expect } from 'vitest';
import { toRankEmoji, winnerIndex, shuffledRanks } from './result-suggestions';
import { mulberry32 } from './ladder';

describe('result-suggestions', () => {
  describe('toRankEmoji', () => {
    it('converts single digit 1-9 to keycap emoji', () => {
      const expected1 = '1️⃣';
      const expected9 = '9️⃣';
      expect(toRankEmoji(1)).toBe(expected1);
      expect(toRankEmoji(9)).toBe(expected9);
    });

    it('converts 10 to "1️⃣0️⃣"', () => {
      const result = toRankEmoji(10);
      expect(result).toBe('1️⃣0️⃣');
    });

    it('converts 12 to "1️⃣2️⃣"', () => {
      const result = toRankEmoji(12);
      expect(result).toBe('1️⃣2️⃣');
    });

    it('builds keycap digits using codepoint formula', () => {
      // Verify each digit d maps to String.fromCodePoint(0x30 + d) + '️⃣'
      const result5 = toRankEmoji(5);
      const expectedCodePoint = String.fromCodePoint(0x30 + 5) + '️⃣';
      expect(result5).toBe(expectedCodePoint);
    });

    it('handles multi-digit numbers like 11, 99', () => {
      const result11 = toRankEmoji(11);
      const result99 = toRankEmoji(99);
      // 11 = "1️⃣1️⃣", 99 = "9️⃣9️⃣"
      expect(result11).toContain('1️⃣');
      expect(result99).toContain('9️⃣');
    });
  });

  describe('winnerIndex', () => {
    it('returns a number in range [0, n)', () => {
      const rng = mulberry32(42);
      for (let n = 2; n <= 10; n++) {
        const result = winnerIndex(n, rng);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(n);
      }
    });

    it('returns deterministic result with seeded RNG', () => {
      const rng1 = mulberry32(42);
      const result1 = winnerIndex(5, rng1);

      const rng2 = mulberry32(42);
      const result2 = winnerIndex(5, rng2);

      expect(result1).toBe(result2);
    });

    it('uses default crypto RNG when no RNG provided', () => {
      const result = winnerIndex(5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(5);
    });

    it('handles n=2 (edge case)', () => {
      const rng = mulberry32(99);
      const result = winnerIndex(2, rng);
      expect([0, 1]).toContain(result);
    });

    it('handles n=10 (upper limit)', () => {
      const rng = mulberry32(77);
      const result = winnerIndex(10, rng);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });
  });

  describe('shuffledRanks', () => {
    it('returns an array of length n', () => {
      for (let n = 2; n <= 10; n++) {
        const result = shuffledRanks(n);
        expect(result).toHaveLength(n);
      }
    });

    it('returns a permutation of [1..n]', () => {
      const rng = mulberry32(42);
      for (let n = 2; n <= 10; n++) {
        const result = shuffledRanks(n, rng);
        const sorted = [...result].sort((a, b) => a - b);
        const expected = Array.from({ length: n }, (_, i) => i + 1);
        expect(sorted).toEqual(expected);
      }
    });

    it('returns deterministic result with seeded RNG', () => {
      const rng1 = mulberry32(123);
      const result1 = shuffledRanks(5, rng1);

      const rng2 = mulberry32(123);
      const result2 = shuffledRanks(5, rng2);

      expect(result1).toEqual(result2);
    });

    it('uses default crypto RNG when no RNG provided', () => {
      const result = shuffledRanks(5);
      const sorted = [...result].sort((a, b) => a - b);
      const expected = [1, 2, 3, 4, 5];
      expect(sorted).toEqual(expected);
    });

    it('produces different shuffles with different seeds', () => {
      const rng1 = mulberry32(111);
      const result1 = shuffledRanks(5, rng1);

      const rng2 = mulberry32(222);
      const result2 = shuffledRanks(5, rng2);

      // Very unlikely to be identical
      expect(result1).not.toEqual(result2);
    });

    it('handles n=2 (edge case)', () => {
      const rng = mulberry32(55);
      const result = shuffledRanks(2, rng);
      expect(result).toHaveLength(2);
      expect(new Set(result).size).toBe(2);
    });

    it('handles n=10 (upper limit)', () => {
      const rng = mulberry32(66);
      const result = shuffledRanks(10, rng);
      expect(result).toHaveLength(10);
      const sorted = [...result].sort((a, b) => a - b);
      expect(sorted).toEqual(Array.from({ length: 10 }, (_, i) => i + 1));
    });
  });
});
