import { describe, it, expect } from 'vitest';
import { collectViolations } from '../../scripts/validate-color-tokens.mjs';

/**
 * Recurrence guard for the "missing Tailwind token renders nothing" failure mode.
 *
 * Tailwind v4 silently drops unknown color utilities (e.g. `text-semantic-danger`
 * when only `danger` is configured), so the element gets no color — invisible to
 * role/presence tests. This asserts every static color utility class in src/
 * resolves to a real token in tailwind.config.ts (or a Tailwind default).
 */
describe('design tokens: color utility classes', () => {
  it('every color utility class resolves to a real Tailwind token', () => {
    const { violations } = collectViolations();
    const report = violations
      .map((v: { file: string; line: number; cls: string }) => `${v.file}:${v.line}  ${v.cls}`)
      .join('\n');
    expect(violations, `Invalid color classes (render no style):\n${report}`).toEqual([]);
  });
});
