import { describe, it, expect } from 'vitest';
import { ballColor } from './colors';

// WCAG 2.1 contrast ratio — local to this test, mirrors src/lib/cheer/contrast.ts's
// algorithm but works on raw hex pairs instead of a fixed swatch enum.
function relativeLuminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hexA: string, hexB: string): number {
  const [lA, lB] = [relativeLuminance(hexA), relativeLuminance(hexB)];
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA_NORMAL_TEXT = 4.5;

describe('src/lib/lotto-generator/colors', () => {
  describe('ballColor — official 동행복권 band colors', () => {
    // Blue/red/gray match dhlottery.co.kr's live result-page CSS exactly
    // (.num-1n/.num-2n/.num-3n) — verified live, all already clear 4.5:1.
    // Gold/green are darkened from the official .num-0n/.num-4n values
    // (which are only 2.59:1 / 3.45:1 on white) to the same hue, just deep
    // enough to clear WCAG AA — "official-looking but readable", not a
    // different color family.
    it('maps 1–10 to a deepened gold with a white numeral', () => {
      for (let i = 1; i <= 10; i++) {
        expect(ballColor(i)).toEqual({ background: '#9e6500', color: '#ffffff' });
      }
    });

    it('maps 11–20 to the official blue with white text', () => {
      for (let i = 11; i <= 20; i++) {
        expect(ballColor(i)).toEqual({ background: '#0063cc', color: '#ffffff' });
      }
    });

    it('maps 21–30 to the official red with white text', () => {
      for (let i = 21; i <= 30; i++) {
        expect(ballColor(i)).toEqual({ background: '#d8314f', color: '#ffffff' });
      }
    });

    it('maps 31–40 to the official gray with white text', () => {
      for (let i = 31; i <= 40; i++) {
        expect(ballColor(i)).toEqual({ background: '#6e7382', color: '#ffffff' });
      }
    });

    it('maps 41–45 to a deepened green with white text', () => {
      for (let i = 41; i <= 45; i++) {
        expect(ballColor(i)).toEqual({ background: '#258439', color: '#ffffff' });
      }
    });

    it('returns background + color hex strings', () => {
      const result = ballColor(7);
      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('color');
      expect(result.background).toMatch(/^#[0-9a-f]{6}$/);
      expect(result.color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('meets WCAG AA (4.5:1) text contrast for every band', () => {
      for (let n = 1; n <= 45; n++) {
        const { background, color } = ballColor(n);
        expect(contrastRatio(background, color)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      }
    });
  });
});
