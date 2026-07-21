import {
  LOTTO_MIN,
  LOTTO_MAX,
  NUMBERS_PER_GAME,
  DrawSchema,
  type Draw,
  type DrawResult,
  type Game,
  type Settings,
} from './schema';

/**
 * RNG type: returns uniform [0, 1)
 */
export type Rng = () => number;

/**
 * Default unbiased RNG: crypto.getRandomValues → [0, 1)
 * This is the ONLY place that directly calls crypto.
 */
export const cryptoRng: Rng = () => {
  const randomBuf = new Uint32Array(1);
  crypto.getRandomValues(randomBuf);
  // Convert uint32 [0, 2^32-1] to float [0, 1)
  return randomBuf[0] / 0x100000000;
};

/**
 * Generate a random integer in [min, max) using rejection sampling (no modulo bias).
 * Assumes rng() returns uniform [0, 1).
 */
function randomInt(min: number, max: number, rng: Rng): number {
  const range = max - min;
  if (range <= 0) return min;

  // Use rejection sampling to avoid modulo bias
  const maxValid = Math.floor(0x100000000 / range) * range;

  let randomValue: number;
  do {
    randomValue = Math.floor(rng() * 0x100000000);
  } while (randomValue >= maxValid);

  return min + (randomValue % range);
}

/**
 * CRITICAL FAIRNESS: Draw N unique numbers from valid set.
 *
 * Algorithm: Fisher–Yates partial shuffle on candidates.
 * Invariant: All eligible numbers have equal probability of being selected.
 *
 * @param fixedNumbers - Always included (0–5)
 * @param excludedNumbers - Never picked (0–39)
 * @param rng - Injectable RNG function (default: cryptoRng)
 * @returns Array of exactly 6 unique sorted numbers from 1–45
 * @throws Error if constraints are infeasible
 */
export function fairDraw(
  fixedNumbers: number[] = [],
  excludedNumbers: number[] = [],
  rng: Rng = cryptoRng
): Draw {
  // Build valid numbers: [1..45] minus excluded
  const excludedSet = new Set(excludedNumbers);
  const validNumbers = Array.from({ length: LOTTO_MAX - LOTTO_MIN + 1 }, (_, i) => i + LOTTO_MIN).filter(
    (n) => !excludedSet.has(n)
  );

  // Build candidates: valid minus fixed
  const fixedSet = new Set(fixedNumbers);
  const candidates = validNumbers.filter((n) => !fixedSet.has(n));

  // Check feasibility
  const neededCount = NUMBERS_PER_GAME - fixedNumbers.length;
  if (candidates.length < neededCount) {
    throw new Error(
      `Insufficient numbers: need ${neededCount}, have ${candidates.length} available. ` +
        `(Excluded: ${excludedNumbers.length}, Fixed: ${fixedNumbers.length})`
    );
  }

  // Fisher–Yates partial shuffle: shuffle first `neededCount` positions
  for (let i = 0; i < neededCount; i++) {
    const j = i + randomInt(0, candidates.length - i, rng);
    // Swap candidates[i] and candidates[j]
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Take first `neededCount` as selected
  const selected = candidates.slice(0, neededCount);

  // Combine fixed and selected, then sort
  const allNumbers = [...fixedNumbers, ...selected].sort((a, b) => a - b);

  // Validate schema
  const draw = DrawSchema.parse(allNumbers);
  return draw;
}

/**
 * Draw a single bonus number (the official 7th ball).
 *
 * Uniformly picked from 1–45, excluding the 6 main numbers and the user's
 * excluded numbers. In the degenerate case where every non-main number is
 * excluded (only possible at 39 exclusions), the exclusion is relaxed so a
 * bonus always exists — there are always 39 numbers outside the 6 main.
 *
 * @param mainNumbers - the 6 already-drawn main numbers
 * @param excludedNumbers - user's excluded numbers
 * @param rng - Injectable RNG (default: cryptoRng)
 */
export function fairBonus(
  mainNumbers: number[],
  excludedNumbers: number[] = [],
  rng: Rng = cryptoRng
): number {
  const mainSet = new Set(mainNumbers);
  const excludedSet = new Set(excludedNumbers);
  const all = Array.from({ length: LOTTO_MAX - LOTTO_MIN + 1 }, (_, i) => i + LOTTO_MIN);

  let pool = all.filter((n) => !mainSet.has(n) && !excludedSet.has(n));
  if (pool.length === 0) {
    // Degenerate: all non-main numbers excluded → relax exclusion for the bonus.
    pool = all.filter((n) => !mainSet.has(n));
  }

  return pool[randomInt(0, pool.length, rng)];
}

/**
 * Draw one full game: 6 main numbers + 1 bonus (official 6/45 format).
 */
export function fairGame(
  fixedNumbers: number[] = [],
  excludedNumbers: number[] = [],
  rng: Rng = cryptoRng
): Game {
  const numbers = fairDraw(fixedNumbers, excludedNumbers, rng);
  const bonus = fairBonus(numbers, excludedNumbers, rng);
  return { numbers, bonus };
}

/**
 * Generate multiple games in one call.
 *
 * @param gameCount - 1–10
 * @param fixedNumbers - 0–5
 * @param excludedNumbers - 0–39
 * @param rng - Optional injectable RNG
 * @returns DrawResult with games array (each game has 6 numbers + bonus)
 */
export function fairDrawGames(
  gameCount: number,
  fixedNumbers: number[] = [],
  excludedNumbers: number[] = [],
  rng: Rng = cryptoRng
): DrawResult {
  const games: Game[] = [];
  for (let i = 0; i < gameCount; i++) {
    games.push(fairGame(fixedNumbers, excludedNumbers, rng));
  }

  return {
    games,
    settings: {
      gameCount,
      fixedNumbers,
      excludedNumbers,
    },
  };
}

/**
 * Chi-square uniformity test.
 * Asserts that each number 1–45 has equal probability across many draws.
 *
 * @param iterations - Number of draws to generate (suggested ≥ 10000)
 * @param rng - Optional RNG (default: cryptoRng)
 * @returns chi2 statistic
 */
export function chiSquareUniformityTest(iterations: number, rng: Rng = cryptoRng): number {
  const counts: Record<number, number> = {};
  for (let i = LOTTO_MIN; i <= LOTTO_MAX; i++) {
    counts[i] = 0;
  }

  // Run fairDraw many times, collecting frequencies
  for (let iter = 0; iter < iterations; iter++) {
    const draw = fairDraw([], [], rng);
    draw.forEach((n) => {
      counts[n]++;
    });
  }

  // Compute chi-square
  const expectedCount = (iterations * NUMBERS_PER_GAME) / LOTTO_MAX; // Each number appears ~expectedCount times
  let chi2 = 0;
  for (let i = LOTTO_MIN; i <= LOTTO_MAX; i++) {
    const observed = counts[i];
    const expected = expectedCount;
    chi2 += Math.pow(observed - expected, 2) / expected;
  }

  return chi2;
}
