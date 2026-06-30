/**
 * Pure suggestions and utilities for result display.
 * Converts rankings to emojis, picks winner, generates rank permutations.
 */

import type { Rng } from './ladder';
import { cryptoRng } from './ladder';

/**
 * Convert a rank number to keycap emoji string.
 * Each digit d (0-9) maps to String.fromCodePoint(0x30 + d) + '️⃣'.
 * Examples: 1 → '1️⃣', 10 → '1️⃣0️⃣', 12 → '1️⃣2️⃣'.
 *
 * @param n rank number
 * @returns keycap emoji string representation
 */
export function toRankEmoji(n: number): string {
  const digits = String(n);
  return Array.from(digits)
    .map((d) => String.fromCodePoint(0x30 + parseInt(d, 10)) + '️⃣')
    .join('');
}

/**
 * Pick a uniformly random winner index from [0, n).
 *
 * @param n number of candidates (2..10 typical)
 * @param rng optional RNG; defaults to cryptoRng
 * @returns index in [0, n)
 */
export function winnerIndex(n: number, rng: Rng = cryptoRng): number {
  return Math.floor(rng() * n);
}

/**
 * Generate a uniformly random permutation of [1..n].
 * Uses Fisher–Yates shuffle via uniformPermutation.
 *
 * @param n number of ranks (2..10 typical)
 * @param rng optional RNG; defaults to cryptoRng
 * @returns array of length n containing each i in [1..n] exactly once
 */
export function shuffledRanks(n: number, rng: Rng = cryptoRng): number[] {
  // Create [0..n-1], shuffle it, then map to [1..n]
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.map((i) => i + 1);
}
