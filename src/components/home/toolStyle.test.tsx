import { describe, it, expect } from 'vitest';
import { tools } from '@/tools/registry';
import { TOOL_ICONS, accentTileClass } from './toolStyle';
import type { AccentColor } from '@/tools/types';

describe('toolStyle icon map', () => {
  it('maps every icon referenced by the tool registry (no Wrench fallback)', () => {
    const unmapped = tools
      .map((tool) => tool.icon)
      .filter((icon, i, arr) => arr.indexOf(icon) === i)
      .filter((icon) => !(icon in TOOL_ICONS));

    // If this fails, a tool's `icon` in registry.ts has no entry in TOOL_ICONS
    // and would silently render the generic Wrench on the home grid.
    expect(unmapped).toEqual([]);
  });

  it('has no dead entries — every mapped icon is used by at least one tool', () => {
    const used = new Set(tools.map((tool) => tool.icon));
    const dead = Object.keys(TOOL_ICONS).filter((name) => !used.has(name));
    expect(dead).toEqual([]);
  });
});

describe('accentTileClass', () => {
  it('returns soft bg + saturated text for every accent', () => {
    const accents: AccentColor[] = [
      'coral',
      'mint',
      'sky',
      'sun',
      'grape',
      'rose',
    ];
    for (const accent of accents) {
      const { bg, text } = accentTileClass(accent);
      expect(bg).toBe(`bg-accent-${accent}-soft`);
      expect(text).toBe(`text-accent-${accent}`);
    }
  });
});
