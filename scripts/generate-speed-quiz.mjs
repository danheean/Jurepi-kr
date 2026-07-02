#!/usr/bin/env node

/**
 * Build-time generator: scan content/speed-quiz/decks/, parse markdown,
 * validate, merge ko+en pairs, and emit speed-quiz.generated.json.
 *
 * Deterministic: no Date/random, exit 0 on success, 1 on any validation failure.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

/**
 * Re-declare schemas for Node.js (cannot import .ts directly).
 * Keep in sync with src/lib/speed-quiz/schema.ts.
 */
const WordSchema = z.object({
  term: z.string().min(1, 'term required'),
  hint: z.string().max(30, 'hint ≤30 chars').optional(),
});

const DeckFileFrontSchema = z.object({
  title: z.string().min(1, 'title required'),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  category: z.enum([
    'animals',
    'food',
    'sports',
    'movies',
    'kpop',
    'countries',
    'jobs',
    'brands',
    'proverbs',
    'historical-figures',
  ]).optional(),
  difficulty: z.enum(['easy', 'normal', 'hard']).optional(),
  words: z.array(WordSchema).min(10, '≥10 words required').optional(),
});

const MergedDeckSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum([
    'animals',
    'food',
    'sports',
    'movies',
    'kpop',
    'countries',
    'jobs',
    'brands',
    'proverbs',
    'historical-figures',
  ]),
  difficulty: z.enum(['easy', 'normal', 'hard']),
  words: z.array(WordSchema).min(10),
  ko: z.object({
    title: z.string().min(1),
    words: z.array(WordSchema).min(10),
  }),
  en: z.object({
    title: z.string().min(1),
    words: z.array(WordSchema).min(10),
  }),
});

const CATEGORY_ORDER = [
  'animals',
  'food',
  'sports',
  'movies',
  'kpop',
  'countries',
  'jobs',
  'brands',
  'proverbs',
  'historical-figures',
];

const DIFFICULTY_ORDER = ['easy', 'normal', 'hard'];

/**
 * Resolve slug: use frontmatter slug if present, else derive from filename.
 */
function resolveSlug(front, filename) {
  if (front.slug) {
    return front.slug;
  }
  const base = filename.replace(/(_en)?\.md$/, '');
  return base.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Merge ko + en pair following canonical rule.
 * Ko category/difficulty/words canonical; en inherits if absent, but always has own title.
 */
function mergePair(koFront, enFront, koFilename = 'unknown.md') {
  const slug = resolveSlug(koFront, koFilename);
  const category = koFront.category;
  const difficulty = koFront.difficulty;
  const koWords = koFront.words || [];
  const enWords = enFront.words && enFront.words.length > 0 ? enFront.words : koWords;

  return {
    slug,
    category,
    difficulty,
    words: koWords, // canonical
    ko: {
      title: koFront.title,
      words: koWords,
    },
    en: {
      title: enFront.title,
      words: enWords,
    },
  };
}

/**
 * Validate pair + merged record; collect all errors (non-blocking).
 */
function validatePair(koFilename, koFront, enFront, allDecks) {
  const errors = [];

  const koResult = DeckFileFrontSchema.safeParse(koFront);
  const enResult = DeckFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(
      `${koFilename}: KO parse error — ${koResult.error.message}`
    );
  }
  if (!enResult.success) {
    errors.push(
      `${koFilename}: EN parse error — ${enResult.error.message}`
    );
  }

  if (errors.length > 0) {
    return { deck: null, errors };
  }

  const ko = koResult.data;
  const en = enResult.data;

  // Ko must have category, difficulty, words
  if (!ko.category) {
    errors.push(`${koFilename}: category required in Korean file`);
  }
  if (!ko.difficulty) {
    errors.push(`${koFilename}: difficulty required in Korean file`);
  }
  if (!ko.words || ko.words.length < 10) {
    errors.push(`${koFilename}: ≥10 words required in Korean file`);
  }

  // En must have title and words (≥10, inherit ko if absent)
  if (!en.title) {
    errors.push(`${koFilename}: title required in English file`);
  }

  if (en.words && en.words.length > 0 && en.words.length !== ko.words?.length) {
    errors.push(
      `${koFilename}: English words count must match Korean (KO=${ko.words?.length}, EN=${en.words.length})`
    );
  }

  if (errors.length > 0) {
    return { deck: null, errors };
  }

  // Check word uniqueness within deck (ko)
  const koTerms = ko.words.map((w) => w.term);
  const koUnique = new Set(koTerms);
  if (koUnique.size !== koTerms.length) {
    const dupes = koTerms.filter((t, idx) => koTerms.indexOf(t) !== idx);
    errors.push(
      `${koFilename}: duplicate word terms in Korean: ${[...new Set(dupes)].join(', ')}`
    );
  }

  // Check word uniqueness within deck (en)
  if (en.words && en.words.length > 0) {
    const enTerms = en.words.map((w) => w.term);
    const enUnique = new Set(enTerms);
    if (enUnique.size !== enTerms.length) {
      const dupes = enTerms.filter((t, idx) => enTerms.indexOf(t) !== idx);
      errors.push(
        `${koFilename}: duplicate word terms in English: ${[...new Set(dupes)].join(', ')}`
      );
    }
  }

  if (errors.length > 0) {
    return { deck: null, errors };
  }

  const deck = mergePair(ko, en, koFilename);

  // Check slug uniqueness globally
  const existingSlugs = allDecks.map((d) => d.slug);
  if (existingSlugs.includes(deck.slug)) {
    errors.push(`${koFilename}: duplicate slug "${deck.slug}" (slug must be globally unique)`);
  }

  return { deck: errors.length === 0 ? deck : null, errors };
}

/**
 * Main generator function.
 */
async function generateSpeedQuiz() {
  const cwd = process.cwd();
  const decksDir = join(cwd, 'content/speed-quiz/decks');
  const outputDir = join(cwd, 'src/components/tools/speed-quiz/data');
  const outputPath = join(outputDir, 'speed-quiz.generated.json');

  const allErrors = [];
  let files;

  // 1. Scan and list files
  try {
    files = readdirSync(decksDir).filter(
      (f) => f.endsWith('.md') && !f.startsWith('_')
    );
  } catch (err) {
    console.error(`Error reading decks directory: ${err.message}`);
    process.exit(1);
  }

  // 2. Group into ko/en pairs
  const pairs = new Map();
  files.forEach((file) => {
    try {
      const content = readFileSync(join(decksDir, file), 'utf8');
      const { data } = matter(content);
      const base = file.replace(/(_en)?\.md$/, '');
      const isEn = file.endsWith('_en.md');

      if (!pairs.has(base)) {
        pairs.set(base, {});
      }
      pairs.get(base)[isEn ? 'en' : 'ko'] = { filename: file, data };
    } catch (err) {
      allErrors.push(`${file}: read/parse error — ${err.message}`);
    }
  });

  // 3. Merge and validate pairs
  const decks = [];
  pairs.forEach(({ ko, en }, base) => {
    if (!ko || !en) {
      allErrors.push(
        `${base}: missing ${!ko ? 'Korean' : 'English'} file`
      );
      return;
    }

    const { deck, errors } = validatePair(base, ko.data, en.data, decks);
    if (errors.length > 0) {
      allErrors.push(...errors);
    }

    if (deck) {
      decks.push(deck);
    }
  });

  // 4. Final validation: each deck passes MergedDeckSchema
  decks.forEach((deck) => {
    const result = MergedDeckSchema.safeParse(deck);
    if (!result.success) {
      allErrors.push(
        `${deck.slug}: final validation error — ${result.error.message}`
      );
    }
  });

  // 5. Exit if errors
  if (allErrors.length > 0) {
    console.error('Build errors:');
    allErrors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }

  // 6. Sort: CATEGORY_ORDER → difficulty → slug
  decks.sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(a.category);
    const catB = CATEGORY_ORDER.indexOf(b.category);
    if (catA !== catB) {
      return catA - catB;
    }
    const diffA = DIFFICULTY_ORDER.indexOf(a.difficulty);
    const diffB = DIFFICULTY_ORDER.indexOf(b.difficulty);
    if (diffA !== diffB) {
      return diffA - diffB;
    }
    return a.slug.localeCompare(b.slug);
  });

  // 7. Ensure output directory exists
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating output directory: ${err.message}`);
    process.exit(1);
  }

  // 8. Write output
  try {
    writeFileSync(
      outputPath,
      JSON.stringify(decks, null, 2),
      'utf8'
    );
    console.log(`✓ Generated ${decks.length} decks → ${outputPath}`);
  } catch (err) {
    console.error(`Error writing output: ${err.message}`);
    process.exit(1);
  }
}

generateSpeedQuiz().catch((err) => {
  console.error('Generator error:', err);
  process.exit(1);
});
