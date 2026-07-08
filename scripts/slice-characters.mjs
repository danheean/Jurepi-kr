#!/usr/bin/env node
/**
 * Slice the Jurepi character sprite sheet into per-tool webp assets.
 *
 * Source: docs/resources/jurepi_characters.png (1254×1254, a 6×4 grid of 24
 * mascot tiles, each themed to one tool). Output: public/characters/<slug>.webp
 * for the 22 live tools plus a `home` welcome pose.
 *
 * Requires ImageMagick (`magick`) on PATH. One-time asset generation; re-run if
 * the sprite is regenerated. TILE_TO_SLUG is the single source of truth for the
 * grid→tool mapping (left→right, top→bottom, 0-indexed).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SPRITE = join(ROOT, 'docs/resources/jurepi_characters.png');
const OUT_DIR = join(ROOT, 'public/characters');

const COLS = 6;
const ROWS = 4;
// Uniform 2:3 output so <Image> can use one fixed width/height (CLS-safe) for
// every tile. Cover-resize + center-extent normalizes the slightly-varying cell
// aspect ratios and trims minor neighbour slivers at the edges. 300×450 is
// retina-safe for a ~150px display.
const OUT_W = 300;
const OUT_H = 450;
const QUALITY = 80;

// The sheet has an outer margin and uneven gutters, so equal division bleeds
// neighbors in. These cut lines were measured from the brightness profile
// (gutters = local cream maxima; outer edges = small inset that keeps a thin
// cream border without clipping any character). 7 x-cuts → 6 columns; 5 y-cuts
// → 4 rows. See scripts note; re-measure if the sprite is regenerated.
const X_CUTS = [16, 261, 434, 623, 818, 1029, 1240];
const Y_CUTS = [56, 349, 634, 910, 1200];

// Grid index (row-major, 0-based) → asset slug. `null` = unused spare tile.
const TILE_TO_SLUG = [
  null,             // 0  dev montage (spare)
  'ladder',         // 1
  'roulette',       // 2
  'age-calculator', // 3
  'knitting-gauge', // 4
  'new-word',       // 5
  'character-counter', // 6
  'find-replace',   // 7
  'lunar-converter',// 8
  'qr-code',        // 9
  'transparent-background', // 10
  'unit-converter', // 11
  'speed-quiz',     // 12
  'restaurant-map', // 13
  'qna-a-day',      // 14
  'bookmarks',      // 15
  'dev-people',     // 16
  'url-encoder',    // 17
  'json-formatter', // 18
  'base64-encoder', // 19
  'my-ip',          // 20
  'howto',          // 21
  'rankings',       // 22
  'home',           // 23  arms-spread welcome pose
];

function main() {
  if (!existsSync(SPRITE)) {
    console.error(`[chars] sprite not found: ${SPRITE}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  TILE_TO_SLUG.forEach((slug, i) => {
    if (!slug) return;
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const x = X_CUTS[col];
    const y = Y_CUTS[row];
    const w = X_CUTS[col + 1] - x;
    const h = Y_CUTS[row + 1] - y;
    const dest = join(OUT_DIR, `${slug}.webp`);
    execFileSync('magick', [
      SPRITE,
      '-crop', `${w}x${h}+${x}+${y}`,
      '+repage',
      '-resize', `${OUT_W}x${OUT_H}^`,
      '-gravity', 'center',
      '-extent', `${OUT_W}x${OUT_H}`,
      '-quality', String(QUALITY),
      dest,
    ]);
    const kb = (statSync(dest).size / 1024).toFixed(1);
    console.log(`[chars] tile ${String(i).padStart(2)} (r${row}c${col}) → ${slug}.webp (${kb} KB)`);
    written += 1;
  });

  console.log(`[chars] wrote ${written} assets to public/characters/`);
}

main();
