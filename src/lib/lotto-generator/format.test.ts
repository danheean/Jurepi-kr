import { describe, it, expect } from 'vitest';
import { formatGamesPlaintext } from './format';
import type { Game } from './schema';

const game = (numbers: number[], bonus: number): Game => ({ numbers, bonus });

describe('src/lib/lotto-generator/format', () => {
  const label = (i: number) => `Game ${i + 1}`;

  it('formats a single game as "label: n, n, ... + bonus"', () => {
    expect(formatGamesPlaintext([game([2, 7, 18, 34, 41, 44], 25)], label)).toBe(
      'Game 1: 2, 7, 18, 34, 41, 44 + 25',
    );
  });

  it('joins multiple games with newlines, no trailing newline', () => {
    const out = formatGamesPlaintext(
      [game([2, 7, 18, 34, 41, 44], 25), game([5, 11, 23, 30, 38, 45], 9)],
      label,
    );
    expect(out).toBe(
      'Game 1: 2, 7, 18, 34, 41, 44 + 25\nGame 2: 5, 11, 23, 30, 38, 45 + 9',
    );
    expect(out.endsWith('\n')).toBe(false);
  });

  it('uses the injected label (locale-agnostic domain)', () => {
    expect(formatGamesPlaintext([game([1, 2, 3, 4, 5, 6], 7)], (i) => `게임 ${i + 1}`)).toBe(
      '게임 1: 1, 2, 3, 4, 5, 6 + 7',
    );
  });

  it('returns empty string for no games', () => {
    expect(formatGamesPlaintext([], label)).toBe('');
  });
});
