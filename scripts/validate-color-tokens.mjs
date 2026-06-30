/**
 * Guard against the "missing Tailwind token renders nothing" failure mode.
 *
 * Tailwind v4 silently drops unknown color utilities (e.g. `text-semantic-danger`
 * when only `danger` is configured), so the element gets no color and the bug is
 * invisible to role/presence unit tests. This script scans the source for color
 * utility classes whose color name is NOT a real key in tailwind.config.ts (nor a
 * Tailwind default), and exits non-zero with the offenders.
 *
 * Run: `node scripts/validate-color-tokens.mjs`  (also enforced by a Vitest test)
 */
import { readFileSync, globSync } from 'node:fs';
import { join } from 'node:path';

// Repo root. `pnpm test` (vitest) and `node scripts/...` both run from the repo
// root, so cwd is reliable here and avoids Vite's /@fs import.meta.url rewriting.
const ROOT = process.cwd();

/**
 * @returns {{violations: Array<{file:string,line:number,cls:string,color:string}>, scanned: number}}
 */
export function collectViolations() {
// 1) Valid color keys from tailwind.config.ts
const cfg = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf8');
const colorBlock = cfg.match(/colors:\s*\{([\s\S]*?)\n\s*\},/);
if (!colorBlock) throw new Error('Could not locate colors block in tailwind.config.ts');
const configKeys = new Set(
  [...colorBlock[1].matchAll(/^\s*'?([a-z0-9-]+)'?\s*:/gim)].map((m) => m[1])
);

// 2) Tailwind default palette + keyword colors (available because we extend, not replace)
const KEYWORDS = ['white', 'black', 'transparent', 'current', 'inherit'];
const PALETTE = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber',
  'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const validColors = new Set([...configKeys, ...KEYWORDS]);
for (const c of PALETTE) for (const s of SHADES) validColors.add(`${c}-${s}`);

// 3) First-segments that signal "this suffix is meant to be a brand color"
//    (real color families + the known-bad invented families). Used to ignore
//    non-color utilities like text-sm / border-2 / ring-offset-2.
const COLOR_FAMILY_FIRST_SEGS = new Set([
  'brand', 'on', 'surface', 'hairline', 'text', 'accent',
  'success', 'warning', 'danger', 'info',
  'semantic', 'focus', // invented families we must catch
]);

const COLOR_PREFIXES = [
  'text', 'bg', 'border', 'ring', 'fill', 'stroke', 'from', 'to', 'via',
  'divide', 'outline', 'decoration', 'placeholder', 'caret', 'accent',
];
const VARIANT = '(?:[a-z-]+:)*'; // hover:, focus-visible:, group-hover:, md:, before: ...
const re = new RegExp(
  `(?<![\\w-])${VARIANT}(${COLOR_PREFIXES.join('|')})-([a-z][a-z0-9-]*(?:/\\d+)?(?:\\[[^\\]]*\\])?)`,
  'g'
);

const files = globSync('src/**/*.{ts,tsx}', { cwd: ROOT }).filter(
  (f) => !f.includes('.test.')
);

const violations = [];
for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      let color = m[2].replace(/\/\d+$/, ''); // strip /opacity
      if (color.startsWith('[')) continue; // arbitrary value [#...] / [var(--x)]
      if (color.endsWith('-')) continue; // dynamic `bg-accent-${x}-soft` — JIT class, not a static token (handled via safelist)
      const firstSeg = color.split('-')[0];
      if (!COLOR_FAMILY_FIRST_SEGS.has(firstSeg)) continue; // not a color family → skip (text-sm etc.)
      if (validColors.has(color)) continue; // real token
      violations.push({ file: rel, line: i + 1, cls: `${m[1]}-${m[2]}`, color });
    }
  });
}
  return { violations, scanned: files.length };
}

// CLI entry — `node scripts/validate-color-tokens.mjs`
if (process.argv[1] && process.argv[1].endsWith('validate-color-tokens.mjs')) {
  const { violations, scanned } = collectViolations();
  if (violations.length) {
    console.error(`\n✖ ${violations.length} invalid color utility class(es) — these render NO style:\n`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  ${v.cls}   (color "${v.color}" is not in tailwind.config.ts)`);
    }
    console.error('\nFix: use a real token from tailwind.config.ts, or add the token to tokens.css + tailwind.config.ts.\n');
    process.exit(1);
  }
  console.log(`✓ All color utility classes resolve to real tokens (${scanned} files scanned).`);
}
