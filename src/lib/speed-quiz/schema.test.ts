import { describe, it, expect } from 'vitest';
import {
  WordSchema,
  DeckFileSchema,
  MergedDeckSchema,
  SpeedQuizStoreSchema,
  safeJsonParse,
  STORE_VERSION,
} from './schema';

describe('schema — zod validation', () => {
  describe('WordSchema', () => {
    it('parses valid word with term only', () => {
      const data = { term: '사자' };
      const result = WordSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.term).toBe('사자');
        expect(result.data.hint).toBeUndefined();
      }
    });

    it('parses valid word with term and hint', () => {
      const data = { term: '사자', hint: 'King of the jungle' };
      const result = WordSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.term).toBe('사자');
        expect(result.data.hint).toBe('King of the jungle');
      }
    });

    it('rejects empty term', () => {
      const data = { term: '' };
      const result = WordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing term', () => {
      const data = { hint: 'hint only' };
      const result = WordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects hint > 30 chars', () => {
      const data = { term: 'word', hint: 'a'.repeat(31) };
      const result = WordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts hint of exactly 30 chars', () => {
      const data = { term: 'word', hint: 'a'.repeat(30) };
      const result = WordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('DeckFileSchema', () => {
    it('parses ko file (required fields)', () => {
      const data = {
        title: 'Animals',
        category: 'animals',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Animals');
        expect(result.data.category).toBe('animals');
        expect(result.data.difficulty).toBe('easy');
        expect(result.data.words).toHaveLength(10);
      }
    });

    it('parses en file (title only, inherits category/difficulty)', () => {
      const data = {
        title: 'Animals Team A',
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Animals Team A');
        expect(result.data.category).toBeUndefined();
        expect(result.data.words).toBeUndefined();
      }
    });

    it('rejects empty title', () => {
      const data = {
        title: '',
        category: 'animals',
        difficulty: 'easy',
        words: [{ term: 'dog' }],
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const data = {
        title: 'Test',
        category: 'invalid-category',
        difficulty: 'easy',
        words: [{ term: 'dog' }],
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid difficulty', () => {
      const data = {
        title: 'Test',
        category: 'animals',
        difficulty: 'extreme',
        words: [{ term: 'dog' }],
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid slug', () => {
      const data = {
        title: 'Test',
        slug: 'Invalid Slug!',
        category: 'animals',
        difficulty: 'easy',
        words: [{ term: 'dog' }],
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts valid slug', () => {
      const data = {
        title: 'Test',
        slug: 'animals-a',
        category: 'animals',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('requires ≥10 words', () => {
      const data = {
        title: 'Test',
        category: 'animals',
        difficulty: 'easy',
        words: Array.from({ length: 9 }, (_, i) => ({ term: `word${i}` })),
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts exactly 10 words', () => {
      const data = {
        title: 'Test',
        category: 'animals',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts >10 words', () => {
      const data = {
        title: 'Test',
        category: 'animals',
        difficulty: 'easy',
        words: Array.from({ length: 15 }, (_, i) => ({ term: `word${i}` })),
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('MergedDeckSchema', () => {
    it('parses valid merged deck', () => {
      const data = {
        slug: 'animals-a',
        category: 'animals',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
        ko: {
          title: '동물 A팀',
          words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
        },
        en: {
          title: 'Animals Team A',
          words: Array.from({ length: 10 }, (_, i) => ({ term: `Word${i}` })),
        },
      };
      const result = MergedDeckSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('requires canonical words ≥10', () => {
      const data = {
        slug: 'animals-a',
        category: 'animals',
        difficulty: 'easy',
        words: Array.from({ length: 9 }, (_, i) => ({ term: `word${i}` })),
        ko: {
          title: '동물 A팀',
          words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
        },
        en: {
          title: 'Animals Team A',
          words: Array.from({ length: 10 }, (_, i) => ({ term: `Word${i}` })),
        },
      };
      const result = MergedDeckSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('requires non-empty ko.title and en.title', () => {
      const data = {
        slug: 'animals-a',
        category: 'animals',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
        ko: {
          title: '',
          words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
        },
        en: {
          title: 'Animals Team A',
          words: Array.from({ length: 10 }, (_, i) => ({ term: `Word${i}` })),
        },
      };
      const result = MergedDeckSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('SpeedQuizStoreSchema', () => {
    it('parses minimal valid store', () => {
      const data = {
        version: 1,
        settings: {
          shuffleOn: true,
          soundOn: true,
        },
        favorites: [],
        recents: [],
      };
      const result = SpeedQuizStoreSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('parses full store with optional settings', () => {
      const data = {
        version: 1,
        settings: {
          lastCategory: 'animals',
          lastDifficulty: 'easy',
          roundTimeSeconds: 60,
          shuffleOn: true,
          soundOn: false,
        },
        favorites: ['animals-a', 'animals-b'],
        recents: ['animals-a'],
      };
      const result = SpeedQuizStoreSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.settings.lastCategory).toBe('animals');
        expect(result.data.favorites).toHaveLength(2);
      }
    });

    it('requires version ≥1', () => {
      const data = {
        version: 0,
        settings: { shuffleOn: true, soundOn: true },
        favorites: [],
        recents: [],
      };
      const result = SpeedQuizStoreSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid settings shape', () => {
      const data = {
        version: 1,
        settings: { invalid: true },
        favorites: [],
        recents: [],
      };
      const result = SpeedQuizStoreSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON and returns data if schema matches', () => {
      const json = JSON.stringify({
        version: 1,
        settings: { shuffleOn: true, soundOn: true },
        favorites: [],
        recents: [],
      });
      const result = safeJsonParse(json, SpeedQuizStoreSchema);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.version).toBe(1);
      }
    });

    it('returns null on invalid JSON', () => {
      const result = safeJsonParse('{ invalid json', SpeedQuizStoreSchema);
      expect(result).toBeNull();
    });

    it('returns null if schema validation fails', () => {
      const json = JSON.stringify({
        version: 0,
        settings: { shuffleOn: true },
      });
      const result = safeJsonParse(json, SpeedQuizStoreSchema);
      expect(result).toBeNull();
    });

    it('never throws', () => {
      expect(() => {
        safeJsonParse('not json', SpeedQuizStoreSchema);
      }).not.toThrow();
    });
  });

  describe('STORE_VERSION', () => {
    it('exports STORE_VERSION = 1', () => {
      expect(STORE_VERSION).toBe(1);
    });
  });

  describe('all 10 categories', () => {
    const categories = [
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

    categories.forEach((cat) => {
      it(`accepts category: ${cat}`, () => {
        const data = {
          title: 'Test',
          category: cat,
          difficulty: 'easy',
          words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
        };
        const result = DeckFileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('all 3 difficulties', () => {
    const difficulties = ['easy', 'normal', 'hard'];

    difficulties.forEach((diff) => {
      it(`accepts difficulty: ${diff}`, () => {
        const data = {
          title: 'Test',
          category: 'animals',
          difficulty: diff,
          words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
        };
        const result = DeckFileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});
