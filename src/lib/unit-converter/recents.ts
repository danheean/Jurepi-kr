/**
 * Recents history — immutable localStorage operations
 */

import { RecentsEntry, RecentsStore, RECENTS_MAX, STORE_VERSION } from './types';
import { RecentsStoreSchema } from './schema';
import { UNITS_BY_CATEGORY } from './constants';

/**
 * Add a new entry to the recents list (immutable).
 * Performs MRU deduplication: if an entry with the same (categoryId, fromUnit, toUnit) exists,
 * it is removed before prepending the new entry.
 *
 * @param list — current RecentsEntry[]
 * @param entry — new entry to add (without timestamp)
 * @param maxEntries — max size (default RECENTS_MAX=20)
 * @returns new list with entry prepended, duplicates removed, trimmed to max
 */
export function addRecent(
  list: RecentsEntry[],
  entry: Omit<RecentsEntry, 'timestamp'>,
  maxEntries: number = RECENTS_MAX
): RecentsEntry[] {
  const entryWithTs: RecentsEntry = { ...entry, timestamp: Date.now() };

  // Remove any existing entry with the same category + from/to (MRU deduplication)
  const filtered = list.filter(
    (r) =>
      !(r.categoryId === entry.categoryId && r.fromUnit === entry.fromUnit && r.toUnit === entry.toUnit)
  );

  // Prepend new entry, trim to max
  return [entryWithTs, ...filtered].slice(0, maxEntries);
}

/**
 * Remove entries with unknown units (category evolution safeguard).
 * If a category or unit disappears in a future update, this pruning ensures
 * orphaned recents don't cause errors.
 *
 * @param list — current RecentsEntry[]
 * @returns new list with invalid entries removed
 */
export function pruneUnknown(list: RecentsEntry[]): RecentsEntry[] {
  return list.filter((entry) => {
    const unitsInCategory = UNITS_BY_CATEGORY[entry.categoryId];
    if (!unitsInCategory) return false;
    return entry.fromUnit in unitsInCategory && entry.toUnit in unitsInCategory;
  });
}

/**
 * Deserialize localStorage blob to RecentsStore (safe).
 * On any error (JSON parse, zod validation), returns a fresh empty store.
 * Never throws.
 *
 * @param blob — JSON string from localStorage (or null if missing)
 * @returns RecentsStore if valid, else fresh { version: 1, recents: [], metadata: { createdAt: now } }
 */
export function deserialize(blob: string | null): RecentsStore {
  if (!blob) {
    return { version: STORE_VERSION, recents: [], metadata: { createdAt: Date.now() } };
  }

  try {
    const parsed = JSON.parse(blob);
    const validated = RecentsStoreSchema.parse(parsed);
    return validated;
  } catch (e) {
    // Zod validation or JSON parse error → start fresh, silent
    return { version: STORE_VERSION, recents: [], metadata: { createdAt: Date.now() } };
  }
}

/**
 * Serialize RecentsStore to JSON string.
 * @param store — RecentsStore to serialize
 * @returns JSON string
 */
export function serialize(store: RecentsStore): string {
  return JSON.stringify(store);
}
