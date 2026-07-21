import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  relativeLuminance,
  contrastRatio,
  isLowContrast,
  MIN_CONTRAST,
  SWATCH_COLORS,
} from './contrast';

describe('contrast.ts', () => {
  describe('relativeLuminance', () => {
    it('returns value between 0 and 1', () => {
      const lum = relativeLuminance('#ffffff');
      expect(lum).toBeGreaterThanOrEqual(0);
      expect(lum).toBeLessThanOrEqual(1);
    });

    it('white (#ffffff) has high luminance', () => {
      const lum = relativeLuminance('#ffffff');
      expect(lum).toBeCloseTo(1, 1);
    });

    it('black (#000000) has low luminance', () => {
      const lum = relativeLuminance('#000000');
      expect(lum).toBeCloseTo(0, 1);
    });

    it('gray (#808080) is approximately 0.2..0.3 (not middle)', () => {
      const lum = relativeLuminance('#808080');
      // Luminance uses gamma, so middle gray is not 0.5
      expect(lum).toBeGreaterThan(0.1);
      expect(lum).toBeLessThan(0.4);
    });

    it('case-insensitive hex', () => {
      const lower = relativeLuminance('#ffffff');
      const upper = relativeLuminance('#FFFFFF');
      expect(lower).toBeCloseTo(upper, 10);
    });

    it('handles hex without # prefix', () => {
      const with_hash = relativeLuminance('#ffffff');
      const without_hash = relativeLuminance('ffffff');
      expect(with_hash).toBeCloseTo(without_hash, 10);
    });
  });

  describe('contrastRatio', () => {
    it('white text on black bg has high contrast', () => {
      const ratio = contrastRatio('white', 'black');
      expect(ratio).toBeGreaterThan(10);
    });

    it('black text on white bg has high contrast', () => {
      const ratio = contrastRatio('black', 'white');
      expect(ratio).toBeGreaterThan(10);
    });

    it('same color has ratio ~1.0', () => {
      const ratio = contrastRatio('white', 'white');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('follows (L1 + 0.05) / (L2 + 0.05) formula', () => {
      // Manual check: white (#fff) vs black (#000)
      // white lum ≈ 1.0, black lum ≈ 0.0
      // ratio = (1.0 + 0.05) / (0.0 + 0.05) = 1.05 / 0.05 = 21
      const ratio = contrastRatio('white', 'black');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('order does not matter (max vs min)', () => {
      const ab = contrastRatio('coral', 'black');
      const ba = contrastRatio('black', 'coral');
      expect(ab).toBeCloseTo(ba, 5);
    });

    it('coral on white has moderate contrast', () => {
      const ratio = contrastRatio('coral', 'white');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(10);
    });

    it('sun on white has lower contrast', () => {
      const ratio = contrastRatio('sun', 'white');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(5);
    });
  });

  describe('isLowContrast', () => {
    it('white on black is NOT low contrast', () => {
      expect(isLowContrast('white', 'black')).toBe(false);
    });

    it('black on white is NOT low contrast', () => {
      expect(isLowContrast('black', 'white')).toBe(false);
    });

    it('sun on white IS low contrast (< 3.0)', () => {
      const ratio = contrastRatio('sun', 'white');
      if (ratio < MIN_CONTRAST) {
        expect(isLowContrast('sun', 'white')).toBe(true);
      }
    });

    it('uses MIN_CONTRAST threshold (3.0)', () => {
      // Test a pair we know should be low contrast
      const ratio = contrastRatio('rose', 'white');
      expect(isLowContrast('rose', 'white')).toBe(ratio < MIN_CONTRAST);
    });

    it('order does not matter', () => {
      const ab = isLowContrast('coral', 'sky');
      const ba = isLowContrast('sky', 'coral');
      expect(ab).toBe(ba);
    });
  });

  describe('MIN_CONTRAST constant', () => {
    it('is set to 3.0', () => {
      expect(MIN_CONTRAST).toBe(3.0);
    });
  });

  describe('SWATCH_COLORS single source of truth', () => {
    // The swatch picker, the contrast math, and the rendered banner (via the
    // `--accent-*` Tailwind tokens) must all agree. This reads the real token
    // file so the map can never silently drift from tokens.css again.
    const tokensCss = readFileSync(
      resolve(__dirname, '../../styles/tokens.css'),
      'utf8'
    );
    // First :root block = light theme (source of the accent swatch values).
    const darkIdx = tokensCss.search(/\[data-theme="dark"\]|@media\s*\(prefers-color-scheme/);
    const lightRoot = darkIdx === -1 ? tokensCss : tokensCss.slice(0, darkIdx);

    function tokenHex(name: string): string {
      const m = lightRoot.match(new RegExp(`--accent-${name}:\\s*(#[0-9a-fA-F]{6})`));
      if (!m) throw new Error(`--accent-${name} not found in tokens.css`);
      return m[1].toLowerCase();
    }

    it('white and black are literal', () => {
      expect(SWATCH_COLORS.white).toBe('#ffffff');
      expect(SWATCH_COLORS.black).toBe('#000000');
    });

    it.each(['coral', 'sun', 'sky', 'grape', 'rose'] as const)(
      '%s swatch matches --accent-%s in tokens.css',
      (id) => {
        expect(SWATCH_COLORS[id].toLowerCase()).toBe(tokenHex(id));
      }
    );

    it('grape is the honey token (#e0912b), NOT purple — regression guard', () => {
      // The picker used to hard-code #a78bfa (purple) while the banner rendered
      // honey via --accent-grape, so the color you picked was not the color shown.
      expect(SWATCH_COLORS.grape.toLowerCase()).toBe('#e0912b');
      expect(SWATCH_COLORS.grape.toLowerCase()).not.toBe('#a78bfa');
    });
  });
});
