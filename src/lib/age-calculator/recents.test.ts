import { describe, it, expect } from 'vitest';
import {
  pushRecent,
  pruneUnknown,
  serializeRecents,
  deserializeRecents,
} from './recents';
import { DateKey } from './date';

describe('age-calculator/recents', () => {
  describe('pushRecent', () => {
    it('adds a recent to the front of the list', () => {
      const list: string[] = [];
      const result = pushRecent(list, '2000-03-15' as DateKey);

      expect(result).toEqual(['2000-03-15']);
    });

    it('prepends new item to existing list', () => {
      const list = ['2000-01-01', '1990-06-15'] as DateKey[];
      const result = pushRecent(list, '2005-12-25' as DateKey);

      expect(result[0]).toBe('2005-12-25');
      expect(result).toHaveLength(3);
    });

    it('deduplicates: moving existing item to front', () => {
      const list = ['2000-01-01', '1990-06-15', '2005-12-25'] as DateKey[];
      const result = pushRecent(list, '1990-06-15' as DateKey);

      expect(result[0]).toBe('1990-06-15');
      expect(result).toHaveLength(3); // Not 4!
      expect(result).toEqual(['1990-06-15', '2000-01-01', '2005-12-25']);
    });

    it('truncates to max length (default 10)', () => {
      let list: string[] = [];

      for (let i = 0; i < 15; i++) {
        const date = `2000-${String(i + 1).padStart(2, '0')}-15`;
        list = pushRecent(list, date as DateKey);
      }

      expect(list).toHaveLength(10);
      expect(list[0]).toBe('2000-15-15'); // Last added (before truncate)
    });

    it('respects custom max length', () => {
      let list: string[] = [];

      for (let i = 0; i < 8; i++) {
        const date = `2000-${String(i + 1).padStart(2, '0')}-15`;
        list = pushRecent(list, date as DateKey, 5);
      }

      expect(list).toHaveLength(5);
    });

    it('returns immutable array (new instance)', () => {
      const list = ['2000-01-01'] as DateKey[];
      const result = pushRecent(list, '1990-06-15' as DateKey);

      expect(result).not.toBe(list);
    });
  });

  describe('pruneUnknown', () => {
    it('keeps valid DateKey strings', () => {
      const list: unknown[] = ['2000-03-15', '1990-06-15', '2020-01-01'];
      const result = pruneUnknown(list);

      expect(result).toEqual(['2000-03-15', '1990-06-15', '2020-01-01']);
    });

    it('filters out non-strings', () => {
      const list: unknown[] = ['2000-03-15', 123, null, '1990-06-15', undefined];
      const result = pruneUnknown(list);

      expect(result).toEqual(['2000-03-15', '1990-06-15']);
    });

    it('filters out empty strings', () => {
      const list: unknown[] = ['2000-03-15', '', '1990-06-15'];
      const result = pruneUnknown(list);

      expect(result).toEqual(['2000-03-15', '1990-06-15']);
    });

    it('filters out malformed DateKey (invalid YYYY-MM-DD format)', () => {
      const list: unknown[] = [
        '2000-03-15',
        '2000/03/15',
        '03-15-2000',
        '2000-13-01', // invalid month
        '1990-06-15',
      ];
      const result = pruneUnknown(list);

      // Only valid YYYY-MM-DD format is kept
      expect(result).toEqual(['2000-03-15', '1990-06-15']);
    });

    it('returns empty array for non-array input', () => {
      expect(pruneUnknown(null as any)).toEqual([]);
      expect(pruneUnknown(undefined as any)).toEqual([]);
      expect(pruneUnknown('not an array' as any)).toEqual([]);
      expect(pruneUnknown(123 as any)).toEqual([]);
    });

    it('returns new array instance', () => {
      const list = ['2000-03-15'];
      const result = pruneUnknown(list);

      expect(result).not.toBe(list);
    });
  });

  describe('serializeRecents', () => {
    it('converts array to JSON string', () => {
      const recents = ['2000-03-15', '1990-06-15'] as DateKey[];
      const result = serializeRecents(recents);

      expect(typeof result).toBe('string');
      expect(JSON.parse(result)).toEqual(recents);
    });

    it('handles empty array', () => {
      const result = serializeRecents([]);

      expect(result).toBe('[]');
    });

    it('serialization is reversible', () => {
      const original = ['2000-03-15', '1990-06-15'] as DateKey[];
      const serialized = serializeRecents(original);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(original);
    });
  });

  describe('deserializeRecents', () => {
    it('parses valid JSON array of strings', () => {
      const json = '["2000-03-15", "1990-06-15"]';
      const result = deserializeRecents(json);

      expect(result).toEqual(['2000-03-15', '1990-06-15']);
    });

    it('prunes invalid entries', () => {
      const json = '["2000-03-15", 123, "", "1990-06-15", null]';
      const result = deserializeRecents(json);

      expect(result).toEqual(['2000-03-15', '1990-06-15']);
    });

    it('handles invalid JSON gracefully (returns empty array)', () => {
      expect(deserializeRecents('not valid json')).toEqual([]);
      expect(deserializeRecents('{ broken')).toEqual([]);
      expect(deserializeRecents('')).toEqual([]);
    });

    it('handles JSON that is not an array gracefully', () => {
      expect(deserializeRecents('"just a string"')).toEqual([]);
      expect(deserializeRecents('123')).toEqual([]);
      expect(deserializeRecents('{ "a": 1 }')).toEqual([]);
    });

    it('round-trips serialization', () => {
      const original = ['2000-03-15', '1990-06-15'] as DateKey[];
      const serialized = serializeRecents(original);
      const deserialized = deserializeRecents(serialized);

      expect(deserialized).toEqual(original);
    });

    it('invariant: result never throws', () => {
      const inputs = [
        'not json',
        '',
        '[]',
        '["valid", "strings"]',
        JSON.stringify(['2000-03-15']),
      ];

      inputs.forEach((input) => {
        expect(() => deserializeRecents(input)).not.toThrow();
      });
    });
  });
});
