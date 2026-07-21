import type { Game } from './schema';

/**
 * Format a list of games as plaintext for clipboard copy.
 * Pure: the per-game label is injected so the domain stays i18n-free.
 *
 * Each line is the 6 main numbers, then " + " and the bonus number, mirroring
 * the official result format.
 *
 * Example output (gameLabel = (i) => `Game ${i + 1}`):
 *   Game 1: 2, 7, 18, 34, 41, 44 + 25
 *   Game 2: 5, 11, 23, 30, 38, 45 + 9
 *
 * @param games - Array of games (each 6 sorted numbers + a bonus)
 * @param gameLabel - Maps zero-based index to a label (e.g. "Game 1" / "게임 1")
 * @returns Newline-joined plaintext (no trailing newline)
 */
export function formatGamesPlaintext(
  games: Game[],
  gameLabel: (index: number) => string,
): string {
  return games
    .map((game, index) => `${gameLabel(index)}: ${game.numbers.join(', ')} + ${game.bonus}`)
    .join('\n');
}
