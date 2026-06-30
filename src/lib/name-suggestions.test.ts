import { describe, it, expect } from 'vitest';
import { FRUITS, pickFruits } from './name-suggestions';
import { mulberry32 } from './ladder';

describe('name-suggestions', () => {
  describe('FRUITS constant', () => {
    it('exports exactly 10 fruits', () => {
      expect(FRUITS).toHaveLength(10);
    });

    it('has correct order (apple, grape, orange, strawberry, peach, banana, watermelon, kiwi, cherry, melon)', () => {
      expect(FRUITS[0].key).toBe('apple');
      expect(FRUITS[1].key).toBe('grape');
      expect(FRUITS[2].key).toBe('orange');
      expect(FRUITS[3].key).toBe('strawberry');
      expect(FRUITS[4].key).toBe('peach');
      expect(FRUITS[5].key).toBe('banana');
      expect(FRUITS[6].key).toBe('watermelon');
      expect(FRUITS[7].key).toBe('kiwi');
      expect(FRUITS[8].key).toBe('cherry');
      expect(FRUITS[9].key).toBe('melon');
    });

    it('each fruit has emoji and key', () => {
      for (const fruit of FRUITS) {
        expect(fruit).toHaveProperty('emoji');
        expect(fruit).toHaveProperty('key');
        expect(typeof fruit.emoji).toBe('string');
        expect(typeof fruit.key).toBe('string');
        expect(fruit.emoji.length).toBeGreaterThan(0);
        expect(fruit.key.length).toBeGreaterThan(0);
      }
    });

    it('all fruits have emoji that are emojis', () => {
      const expectedEmojis = ['🍎', '🍇', '🍊', '🍓', '🍑', '🍌', '🍉', '🥝', '🍒', '🍈'];
      for (let i = 0; i < FRUITS.length; i++) {
        expect(FRUITS[i].emoji).toBe(expectedEmojis[i]);
      }
    });
  });

  describe('pickFruits', () => {
    it('returns empty array when n=0', () => {
      const result = pickFruits(0);
      expect(result).toEqual([]);
    });

    it('returns correct length when n<=10', () => {
      for (let n = 1; n <= 10; n++) {
        const result = pickFruits(n);
        expect(result).toHaveLength(n);
      }
    });

    it('returns all unique fruits when n<=10', () => {
      for (let n = 1; n <= 10; n++) {
        const result = pickFruits(n);
        const keys = result.map((f) => f.key);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(n);
      }
    });

    it('returns deterministic result with seeded RNG', () => {
      const rng1 = mulberry32(42);
      const result1 = pickFruits(5, rng1);

      const rng2 = mulberry32(42);
      const result2 = pickFruits(5, rng2);

      expect(result1).toEqual(result2);
    });

    it('handles n>10 by cycling', () => {
      const rng = mulberry32(999);
      const result = pickFruits(15, rng);
      expect(result).toHaveLength(15);
      // All returned items should be from FRUITS
      for (const fruit of result) {
        expect(FRUITS).toContainEqual(fruit);
      }
    });

    it('uses default crypto RNG when no RNG provided', () => {
      const result1 = pickFruits(3);
      const result2 = pickFruits(3);
      // With crypto RNG, results should typically differ (with overwhelming probability)
      // At least verify they are valid fruits
      expect(result1).toHaveLength(3);
      expect(result2).toHaveLength(3);
      for (const fruit of result1) {
        expect(FRUITS).toContainEqual(fruit);
      }
    });
  });
});
