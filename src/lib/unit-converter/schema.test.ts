/**
 * Zod schema validation tests
 */

import { describe, it, expect } from 'vitest';
import { RecentsStoreSchema, RecentsEntrySchema } from './schema';

describe('RecentsStoreSchema validation', () => {
  it('validates a valid store', () => {
    const store = {
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
      metadata: {
        createdAt: Date.now(),
      },
    };

    const result = RecentsStoreSchema.safeParse(store);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.recents.length).toBe(1);
    }
  });

  it('validates empty recents array', () => {
    const store = {
      version: 1,
      recents: [],
      metadata: {
        createdAt: Date.now(),
      },
    };

    const result = RecentsStoreSchema.safeParse(store);
    expect(result.success).toBe(true);
  });

  it('validates all category types', () => {
    const categories = ['length', 'mass', 'temperature', 'area', 'volume', 'speed', 'digital_storage', 'time'];

    for (const catId of categories) {
      const entry = {
        categoryId: catId,
        fromUnit: 'from',
        toUnit: 'to',
        fromValue: 1,
        toValue: 2,
        timestamp: Date.now(),
      };

      const result = RecentsEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const entry = {
      categoryId: 'invalid_category',
      fromUnit: 'from',
      toUnit: 'to',
      fromValue: 1,
      toValue: 2,
      timestamp: Date.now(),
    };

    const result = RecentsEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it('rejects missing version', () => {
    const store = {
      recents: [],
      metadata: { createdAt: Date.now() },
    };

    const result = RecentsStoreSchema.safeParse(store);
    expect(result.success).toBe(false);
  });

  it('rejects missing metadata', () => {
    const store = {
      version: 1,
      recents: [],
    };

    const result = RecentsStoreSchema.safeParse(store);
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric values', () => {
    const entry = {
      categoryId: 'length',
      fromUnit: 'meter',
      toUnit: 'kilometer',
      fromValue: 'not a number',
      toValue: 2,
      timestamp: Date.now(),
    };

    const result = RecentsEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric timestamp', () => {
    const entry = {
      categoryId: 'length',
      fromUnit: 'meter',
      toUnit: 'kilometer',
      fromValue: 1,
      toValue: 2,
      timestamp: 'not a timestamp',
    };

    const result = RecentsEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });
});
