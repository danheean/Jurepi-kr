/**
 * Pure fruit name suggestions for players.
 * Uses uniform shuffling via uniformPermutation for deterministic, fair selection.
 */

import type { Rng } from './ladder';
import { uniformPermutation, cryptoRng } from './ladder';

export interface Fruit {
  emoji: string;
  key: string;
}

/**
 * Exactly 10 fruits in fixed order.
 * Used by pickFruits to ensure uniqueness when n<=10.
 */
export const FRUITS: Fruit[] = [
  { emoji: '🍎', key: 'apple' },
  { emoji: '🍇', key: 'grape' },
  { emoji: '🍊', key: 'orange' },
  { emoji: '🍓', key: 'strawberry' },
  { emoji: '🍑', key: 'peach' },
  { emoji: '🍌', key: 'banana' },
  { emoji: '🍉', key: 'watermelon' },
  { emoji: '🥝', key: 'kiwi' },
  { emoji: '🍒', key: 'cherry' },
  { emoji: '🍈', key: 'melon' },
];

/**
 * Pick n fruits via uniform shuffling.
 * For n<=10, all returned fruits are unique.
 * For n>10, fruits cycle (repeats allowed).
 *
 * @param n number of fruits to pick
 * @param rng optional RNG; defaults to cryptoRng
 * @returns array of n fruits
 */
export function pickFruits(n: number, rng: Rng = cryptoRng): Fruit[] {
  if (n <= 0) return [];

  // Use uniform permutation to shuffle indices
  const indices = uniformPermutation(FRUITS.length, rng);
  const result: Fruit[] = [];

  for (let i = 0; i < n; i++) {
    // Cycle through the shuffled indices if n > 10
    const idx = indices[i % FRUITS.length];
    result.push(FRUITS[idx]);
  }

  return result;
}
