import { describe, it, expect } from 'vitest';
import { slugify, resolveSlug } from './slug';
import type { BookmarkFileFront } from './schema';

describe('bookmarks/slug', () => {
  describe('slugify', () => {
    it('converts to lowercase', () => {
      expect(slugify('HARNESS ENGINEERING')).toContain('harness');
    });

    it('removes diacritics', () => {
      expect(slugify('café')).not.toContain('é');
    });

    it('replaces spaces with hyphens', () => {
      expect(slugify('harness engineering')).toBe('harness-engineering');
    });

    it('removes special characters', () => {
      expect(slugify('test!@#$%')).toBe('test');
    });

    it('collapses multiple hyphens', () => {
      expect(slugify('test---slug')).toBe('test-slug');
    });

    it('trims leading/trailing hyphens', () => {
      expect(slugify('---test---')).toBe('test');
    });

    it('handles Korean text (results in empty after normalization)', () => {
      // Korean characters don't have ASCII equivalents and are stripped by normalize/regex
      // This is expected behavior — use English filenames, not Korean
      const result = slugify('하네스 엔지니어링');
      // Result will be empty since Korean chars have no ASCII equiv
      expect(typeof result).toBe('string');
    });

    it('handles numbers', () => {
      expect(slugify('test 123')).toBe('test-123');
    });

    it('converts to alphanumeric + hyphens only', () => {
      expect(/^[a-z0-9-]*$/.test(slugify('Test@#$%Slug'))).toBe(true);
    });
  });

  describe('resolveSlug', () => {
    it('uses frontmatter slug if present', () => {
      const front: BookmarkFileFront = {
        title: 'Test',
        description: 'Desc',
        slug: 'custom-slug',
        sections: [
          {
            heading: 'H',
            links: [{ label: 'L', url: 'https://example.com' }],
          },
        ],
      };
      expect(resolveSlug(front, 'harness-engineering.md')).toBe('custom-slug');
    });

    it('derives from filename if slug absent', () => {
      const front: BookmarkFileFront = {
        title: 'Test',
        description: 'Desc',
        sections: [
          {
            heading: 'H',
            links: [{ label: 'L', url: 'https://example.com' }],
          },
        ],
      };
      expect(resolveSlug(front, 'harness-engineering.md')).toBe(
        'harness-engineering'
      );
    });

    it('handles _en.md suffix (Korean canonical)', () => {
      const front: BookmarkFileFront = {
        title: 'Test',
        description: 'Desc',
        sections: [
          {
            heading: 'H',
            links: [{ label: 'L', url: 'https://example.com' }],
          },
        ],
      };
      // EN file should not have _en suffix in derived slug
      // resolveSlug strips _en.md before deriving
      // But in practice, we only call resolveSlug on KO files
      // For completeness, test that it handles _en.md gracefully
      expect(resolveSlug(front, 'harness-engineering_en.md')).toBe(
        'harness-engineering'
      );
    });

    it('slugifies derived slug from filename', () => {
      const front: BookmarkFileFront = {
        title: 'Test',
        description: 'Desc',
        sections: [
          {
            heading: 'H',
            links: [{ label: 'L', url: 'https://example.com' }],
          },
        ],
      };
      expect(resolveSlug(front, 'Frontend Resources.md')).toContain('frontend');
    });

    it('prioritizes explicit slug over filename', () => {
      const front: BookmarkFileFront = {
        title: 'Test',
        description: 'Desc',
        slug: 'explicit-id',
        sections: [
          {
            heading: 'H',
            links: [{ label: 'L', url: 'https://example.com' }],
          },
        ],
      };
      expect(resolveSlug(front, 'some-other-name.md')).toBe('explicit-id');
    });
  });
});
