/**
 * Recents history tests
 */

import { describe, it, expect } from 'vitest';
import { addRecent, pruneUnknown, deserialize, serialize } from './recents';
import type { RecentsEntry, RecentsStore } from './types';

describe('addRecent', () => {
  it('adds a new entry to empty list', () => {
    const list: RecentsEntry[] = [];
    const entry = {
      categoryId: 'length' as const,
      fromUnit: 'meter',
      toUnit: 'kilometer',
      fromValue: 100,
      toValue: 0.1,
    };

    const result = addRecent(list, entry);
    expect(result.length).toBe(1);
    expect(result[0].categoryId).toBe('length');
    expect(result[0].timestamp).toBeDefined();
  });

  it('prepends new entry (MRU order)', () => {
    const list: RecentsEntry[] = [
      {
        categoryId: 'length',
        fromUnit: 'meter',
        toUnit: 'kilometer',
        fromValue: 100,
        toValue: 0.1,
        timestamp: 1000,
      },
    ];
    const newEntry = {
      categoryId: 'mass' as const,
      fromUnit: 'kilogram',
      toUnit: 'pound',
      fromValue: 50,
      toValue: 110.23,
    };

    const result = addRecent(list, newEntry);
    expect(result.length).toBe(2);
    expect(result[0].categoryId).toBe('mass');
    expect(result[1].categoryId).toBe('length');
  });

  it('deduplicates same (categoryId, fromUnit, toUnit) tuple', () => {
    const list: RecentsEntry[] = [
      {
        categoryId: 'length',
        fromUnit: 'meter',
        toUnit: 'kilometer',
        fromValue: 100,
        toValue: 0.1,
        timestamp: 1000,
      },
    ];
    const duplicate = {
      categoryId: 'length' as const,
      fromUnit: 'meter',
      toUnit: 'kilometer',
      fromValue: 200,
      toValue: 0.2,
    };

    const result = addRecent(list, duplicate);
    expect(result.length).toBe(1);
    expect(result[0].fromValue).toBe(200); // New value
  });

  it('respects maxEntries limit', () => {
    const list: RecentsEntry[] = Array.from({ length: 20 }, (_, i) => ({
      categoryId: 'length' as const,
      fromUnit: 'meter',
      toUnit: 'kilometer',
      fromValue: i,
      toValue: i * 0.001,
      timestamp: i,
    }));

    const newEntry = {
      categoryId: 'mass' as const,
      fromUnit: 'kilogram',
      toUnit: 'pound',
      fromValue: 50,
      toValue: 110.23,
    };

    const result = addRecent(list, newEntry, 20);
    expect(result.length).toBe(20);
    expect(result[0].categoryId).toBe('mass'); // New entry at top
    expect(result[19].fromValue).toBe(18); // Oldest entry dropped
  });

  it('custom maxEntries works', () => {
    const list: RecentsEntry[] = [
      { categoryId: 'length', fromUnit: 'm', toUnit: 'km', fromValue: 1, toValue: 0.001, timestamp: 1 },
      { categoryId: 'mass', fromUnit: 'kg', toUnit: 'lb', fromValue: 2, toValue: 4.4, timestamp: 2 },
    ];

    const newEntry = {
      categoryId: 'temperature' as const,
      fromUnit: 'celsius',
      toUnit: 'fahrenheit',
      fromValue: 0,
      toValue: 32,
    };

    const result = addRecent(list, newEntry, 2);
    expect(result.length).toBe(2);
    expect(result[0].categoryId).toBe('temperature');
  });
});

describe('pruneUnknown', () => {
  it('keeps valid entries', () => {
    const list: RecentsEntry[] = [
      { categoryId: 'length', fromUnit: 'meter', toUnit: 'kilometer', fromValue: 1, toValue: 0.001, timestamp: 1 },
      { categoryId: 'mass', fromUnit: 'kilogram', toUnit: 'pound', fromValue: 50, toValue: 110.23, timestamp: 2 },
    ];

    const result = pruneUnknown(list);
    expect(result.length).toBe(2);
  });

  it('removes entries with unknown category', () => {
    const list: RecentsEntry[] = [
      { categoryId: 'length', fromUnit: 'meter', toUnit: 'kilometer', fromValue: 1, toValue: 0.001, timestamp: 1 },
      { categoryId: 'currency' as any, fromUnit: 'usd', toUnit: 'eur', fromValue: 1, toValue: 0.92, timestamp: 2 },
    ];

    const result = pruneUnknown(list);
    expect(result.length).toBe(1);
    expect(result[0].categoryId).toBe('length');
  });

  it('removes entries with unknown units', () => {
    const list: RecentsEntry[] = [
      { categoryId: 'length', fromUnit: 'meter', toUnit: 'kilometer', fromValue: 1, toValue: 0.001, timestamp: 1 },
      { categoryId: 'length', fromUnit: 'meter', toUnit: 'furlong', fromValue: 1, toValue: 0.005, timestamp: 2 },
    ];

    const result = pruneUnknown(list);
    expect(result.length).toBe(1);
    expect(result[0].toUnit).toBe('kilometer');
  });
});

describe('deserialize', () => {
  it('deserializes valid JSON store', () => {
    const store: RecentsStore = {
      version: 1,
      recents: [
        {
          categoryId: 'length',
          fromUnit: 'meter',
          toUnit: 'kilometer',
          fromValue: 100,
          toValue: 0.1,
          timestamp: Date.now(),
        },
      ],
      metadata: { createdAt: Date.now() },
    };

    const json = JSON.stringify(store);
    const result = deserialize(json);

    expect(result.version).toBe(1);
    expect(result.recents.length).toBe(1);
  });

  it('returns fresh store for null', () => {
    const result = deserialize(null);

    expect(result.version).toBe(1);
    expect(result.recents).toEqual([]);
    expect(result.metadata.createdAt).toBeDefined();
  });

  it('returns fresh store for invalid JSON', () => {
    const result = deserialize('{ invalid json }');

    expect(result.version).toBe(1);
    expect(result.recents).toEqual([]);
  });

  it('returns fresh store for zod validation failure', () => {
    const invalid = JSON.stringify({
      version: 1,
      recents: [{ categoryId: 'invalid_cat', fromUnit: 'x', toUnit: 'y', fromValue: 1, toValue: 2, timestamp: 1 }],
      metadata: { createdAt: Date.now() },
    });

    const result = deserialize(invalid);

    expect(result.version).toBe(1);
    expect(result.recents).toEqual([]);
  });

  it('never throws', () => {
    expect(() => deserialize('completely broken')).not.toThrow();
    expect(() => deserialize('{ missing version }')).not.toThrow();
  });
});

describe('serialize', () => {
  it('serializes store to JSON', () => {
    const store: RecentsStore = {
      version: 1,
      recents: [],
      metadata: { createdAt: Date.now() },
    };

    const json = serialize(store);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(1);
    expect(parsed.recents).toEqual([]);
  });

  it('round-trip: serialize → deserialize = original', () => {
    const original: RecentsStore = {
      version: 1,
      recents: [
        {
          categoryId: 'temperature',
          fromUnit: 'celsius',
          toUnit: 'fahrenheit',
          fromValue: 0,
          toValue: 32,
          timestamp: 1234567890,
        },
      ],
      metadata: { createdAt: 1000000000 },
    };

    const json = serialize(original);
    const restored = deserialize(json);

    expect(restored.version).toBe(original.version);
    expect(restored.recents[0].categoryId).toBe(original.recents[0].categoryId);
    expect(restored.recents[0].fromValue).toBe(original.recents[0].fromValue);
  });
});
