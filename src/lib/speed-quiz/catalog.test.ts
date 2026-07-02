import { describe, it, expect } from 'vitest';
import { CATEGORY_ORDER, createCatalog, validateUniqueSlugs } from './catalog';
import type { MergedDeck } from './schema';

describe('catalog — deck catalog operations', () => {
  const mockDeck = (slug: string, category: string = 'animals', difficulty: string = 'easy'): MergedDeck => ({
    slug,
    category: category as any,
    difficulty: difficulty as any,
    words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    ko: {
      title: `${category} ${slug} KO`,
      words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    },
    en: {
      title: `${category} ${slug} EN`,
      words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    },
  });

  const mockCatalog: MergedDeck[] = [
    mockDeck('animals-a', 'animals', 'easy'),
    mockDeck('animals-b', 'animals', 'easy'),
    mockDeck('movies-a', 'movies', 'normal'),
    mockDeck('proverbs-a', 'proverbs', 'hard'),
  ];

  describe('CATEGORY_ORDER', () => {
    it('exports 10 categories in correct order', () => {
      const expected = [
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
      expect(CATEGORY_ORDER).toEqual(expected);
    });
  });

  describe('createCatalog', () => {
    it('returns allDecks', () => {
      const catalog = createCatalog(mockCatalog);
      expect(catalog.allDecks).toEqual(mockCatalog);
    });

    it('provides byId', () => {
      const catalog = createCatalog(mockCatalog);
      expect(catalog.byId('animals-a')).toEqual(mockDeck('animals-a', 'animals', 'easy'));
    });

    it('byId returns undefined for unknown slug', () => {
      const catalog = createCatalog(mockCatalog);
      expect(catalog.byId('unknown')).toBeUndefined();
    });

    it('provides byCategory', () => {
      const catalog = createCatalog(mockCatalog);
      const animals = catalog.byCategory('animals');
      expect(animals).toHaveLength(2);
      expect(animals.map((d) => d.slug)).toEqual(['animals-a', 'animals-b']);
    });

    it('byCategory returns empty array for unknown category', () => {
      const catalog = createCatalog(mockCatalog);
      expect(catalog.byCategory('unknown')).toEqual([]);
    });

    it('provides categories (live category ids)', () => {
      const catalog = createCatalog(mockCatalog);
      const cats = catalog.categories();
      expect(cats).toContain('animals');
      expect(cats).toContain('movies');
      expect(cats).toContain('proverbs');
      expect(cats).not.toContain('food'); // not in catalog
      expect(cats).not.toContain('unknown');
    });

    it('categories are ordered by CATEGORY_ORDER', () => {
      const catalog = createCatalog([
        mockDeck('proverbs-a', 'proverbs', 'hard'),
        mockDeck('animals-a', 'animals', 'easy'),
        mockDeck('movies-a', 'movies', 'normal'),
      ]);
      const cats = catalog.categories();
      const proverbs = cats.indexOf('proverbs');
      const animals = cats.indexOf('animals');
      const movies = cats.indexOf('movies');
      expect(animals).toBeLessThan(movies);
      expect(movies).toBeLessThan(proverbs);
    });
  });

  describe('validateUniqueSlugs', () => {
    it('returns empty errors for unique slugs', () => {
      const errors = validateUniqueSlugs(mockCatalog);
      expect(errors).toEqual([]);
    });

    it('detects duplicate slugs', () => {
      const dup = [
        mockDeck('animals-a', 'animals', 'easy'),
        mockDeck('animals-a', 'food', 'easy'), // same slug, different category
      ];
      const errors = validateUniqueSlugs(dup);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatch(/animals-a/);
    });

    it('allows same slug if categories differ... wait, slug must be globally unique', () => {
      // Per blueprint: slug is globally unique (not per-category)
      const dup = [
        mockDeck('animals-a', 'animals', 'easy'),
        mockDeck('animals-a', 'animals', 'hard'), // same slug, same category
      ];
      const errors = validateUniqueSlugs(dup);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('handles empty catalog', () => {
      const errors = validateUniqueSlugs([]);
      expect(errors).toEqual([]);
    });
  });
});
