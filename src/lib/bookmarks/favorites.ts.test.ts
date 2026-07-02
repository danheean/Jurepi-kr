import { describe, it, expect } from 'vitest';
import { toggleFavorite, pushRecent, pruneUnknown, RECENTS_MAX } from './favorites';
import type { MergedTopic } from './schema';

describe('bookmarks/favorites', () => {
  describe('toggleFavorite', () => {
    it('adds slug if absent', () => {
      const list = ['slug1', 'slug2'];
      const result = toggleFavorite(list, 'slug3');
      expect(result).toContain('slug3');
      expect(result).toHaveLength(3);
    });

    it('removes slug if present', () => {
      const list = ['slug1', 'slug2', 'slug3'];
      const result = toggleFavorite(list, 'slug2');
      expect(result).not.toContain('slug2');
      expect(result).toHaveLength(2);
    });

    it('preserves order when adding', () => {
      const list = ['slug1', 'slug2'];
      const result = toggleFavorite(list, 'slug3');
      expect(result).toEqual(['slug1', 'slug2', 'slug3']);
    });

    it('returns new array (immutable)', () => {
      const list = ['slug1'];
      const result = toggleFavorite(list, 'slug2');
      expect(result).not.toBe(list);
      expect(list).toEqual(['slug1']); // Original unchanged
    });

    it('handles empty list', () => {
      const result = toggleFavorite([], 'slug1');
      expect(result).toEqual(['slug1']);
    });

    it('handles toggle on/off/on', () => {
      let list = ['slug1'];
      list = toggleFavorite(list, 'slug2'); // Add
      expect(list).toContain('slug2');
      list = toggleFavorite(list, 'slug2'); // Remove
      expect(list).not.toContain('slug2');
      list = toggleFavorite(list, 'slug2'); // Add again
      expect(list).toContain('slug2');
    });
  });

  describe('pushRecent', () => {
    it('adds slug to front if absent', () => {
      const list = ['slug2', 'slug3'];
      const result = pushRecent(list, 'slug1');
      expect(result[0]).toBe('slug1');
      expect(result).toHaveLength(3);
    });

    it('moves slug to front if present', () => {
      const list = ['slug1', 'slug2', 'slug3'];
      const result = pushRecent(list, 'slug2');
      expect(result[0]).toBe('slug2');
      expect(result).toEqual(['slug2', 'slug1', 'slug3']);
    });

    it('deduplicates', () => {
      const list = ['slug1', 'slug2'];
      const result = pushRecent(list, 'slug1');
      expect(result).toEqual(['slug1', 'slug2']);
      expect(result).toHaveLength(2);
    });

    it('truncates to max length', () => {
      const list = Array.from({ length: RECENTS_MAX }, (_, i) => `slug${i}`);
      const result = pushRecent(list, 'new-slug');
      expect(result).toHaveLength(RECENTS_MAX);
      expect(result[0]).toBe('new-slug');
    });

    it('respects custom max parameter', () => {
      const list = ['slug1', 'slug2', 'slug3'];
      const result = pushRecent(list, 'slug4', 2);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('slug4');
    });

    it('returns new array (immutable)', () => {
      const list = ['slug1'];
      const result = pushRecent(list, 'slug2');
      expect(result).not.toBe(list);
      expect(list).toEqual(['slug1']);
    });

    it('handles empty list', () => {
      const result = pushRecent([], 'slug1');
      expect(result).toEqual(['slug1']);
    });

    it('maintains MRU order', () => {
      let list: string[] = [];
      list = pushRecent(list, 'a');
      list = pushRecent(list, 'b');
      list = pushRecent(list, 'c');
      list = pushRecent(list, 'b'); // b back to front
      expect(list).toEqual(['b', 'c', 'a']);
    });
  });

  describe('pruneUnknown', () => {
    const catalog: MergedTopic[] = [
      {
        slug: 'slug1',
        ko: {
          title: 'T1',
          description: 'D1',
          sections: [
            {
              heading: 'H',
              links: [{ label: 'L', url: 'https://example.com' }],
            },
          ],
        },
        en: {
          title: 'T1',
          description: 'D1',
          sections: [
            {
              heading: 'H',
              links: [{ label: 'L', url: 'https://example.com' }],
            },
          ],
        },
      },
      {
        slug: 'slug2',
        ko: {
          title: 'T2',
          description: 'D2',
          sections: [
            {
              heading: 'H',
              links: [{ label: 'L', url: 'https://example.com' }],
            },
          ],
        },
        en: {
          title: 'T2',
          description: 'D2',
          sections: [
            {
              heading: 'H',
              links: [{ label: 'L', url: 'https://example.com' }],
            },
          ],
        },
      },
    ];

    it('keeps known slugs', () => {
      const list = ['slug1', 'slug2'];
      const result = pruneUnknown(list, catalog);
      expect(result).toEqual(['slug1', 'slug2']);
    });

    it('removes unknown slugs', () => {
      const list = ['slug1', 'unknown', 'slug2'];
      const result = pruneUnknown(list, catalog);
      expect(result).toEqual(['slug1', 'slug2']);
      expect(result).not.toContain('unknown');
    });

    it('returns new array (immutable)', () => {
      const list = ['slug1'];
      const result = pruneUnknown(list, catalog);
      expect(result).not.toBe(list);
    });

    it('handles empty list', () => {
      const result = pruneUnknown([], catalog);
      expect(result).toEqual([]);
    });

    it('handles empty catalog', () => {
      const list = ['slug1', 'slug2'];
      const result = pruneUnknown(list, []);
      expect(result).toEqual([]);
    });

    it('removes all unknown', () => {
      const list = ['unknown1', 'unknown2', 'unknown3'];
      const result = pruneUnknown(list, catalog);
      expect(result).toEqual([]);
    });
  });

  describe('RECENTS_MAX constant', () => {
    it('is exported', () => {
      expect(RECENTS_MAX).toBe(20);
    });
  });
});
