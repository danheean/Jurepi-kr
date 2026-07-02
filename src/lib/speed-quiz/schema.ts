import { z } from 'zod';

export const STORE_VERSION = 1;

/**
 * Individual prompt word (term + optional hint)
 */
export const WordSchema = z.object({
  term: z.string().min(1, 'term required'),
  hint: z.string().max(30, 'hint max 30 chars').optional(),
});

export type Word = z.infer<typeof WordSchema>;

/**
 * Individual markdown file frontmatter (parse unit, ko or en)
 */
export const DeckFileSchema = z.object({
  title: z.string().min(1, 'title required'),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  category: z
    .enum([
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
    ])
    .optional(),
  difficulty: z.enum(['easy', 'normal', 'hard']).optional(),
  words: z.array(WordSchema).min(10, 'words requires ≥10').optional(),
});

export type DeckFile = z.infer<typeof DeckFileSchema>;

/**
 * Merged ko+en record (catalog item)
 */
export const MergedDeckSchema = z.object({
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
  words: z.array(WordSchema).min(10, 'words requires ≥10'),
  ko: z.object({
    title: z.string().min(1),
    words: z.array(WordSchema).min(10),
  }),
  en: z.object({
    title: z.string().min(1),
    words: z.array(WordSchema).min(10),
  }),
});

export type MergedDeck = z.infer<typeof MergedDeckSchema>;

/**
 * localStorage blob: game settings + favorites + recents
 */
export const SpeedQuizStoreSchema = z.object({
  version: z.number().int().min(1),
  settings: z.object({
    lastCategory: z.string().optional(),
    lastDifficulty: z.string().optional(),
    roundTimeSeconds: z.number().int().optional(),
    shuffleOn: z.boolean(),
    soundOn: z.boolean(),
  }),
  favorites: z.array(z.string()),
  recents: z.array(z.string()),
});

export type SpeedQuizStore = z.infer<typeof SpeedQuizStoreSchema>;

/**
 * Safe JSON parsing (for corrupt localStorage recovery)
 * Returns null if parse or validation fails (never throws)
 */
export function safeJsonParse<T>(json: string, schema: z.ZodType<T>): T | null {
  try {
    const parsed = JSON.parse(json);
    const result = schema.safeParse(parsed);
    return result.success ? parsed : null;
  } catch {
    return null;
  }
}
