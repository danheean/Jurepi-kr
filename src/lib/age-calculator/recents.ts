import { DateKey } from './date';

/**
 * Add a recent dateKey to the front of the list.
 * De-duplicate (remove if already present), then prepend.
 * Truncate to max.
 */
export function pushRecent(list: string[], dateKey: DateKey, max: number = 10): string[] {
  const cleaned = list.filter((item) => item !== dateKey);
  return [dateKey, ...cleaned].slice(0, max);
}

/**
 * Prune unknown/invalid entries (e.g., after validation fails).
 * Validates that each entry is a valid DateKey (YYYY-MM-DD format) with reasonable month/day.
 * Fail-gracefully: if list is empty or undefined, return [].
 */
export function pruneUnknown(list: unknown[]): string[] {
  if (!Array.isArray(list)) {
    return [];
  }

  const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;

  return list.filter((item): item is string => {
    if (typeof item !== 'string' || item.length === 0 || !dateKeyRegex.test(item)) {
      return false;
    }

    // Validate month (01-12) and day (01-31)
    const [y, m, d] = item.split('-').map(Number);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      return false;
    }

    return true;
  });
}

/**
 * Serialize recents to JSON.
 */
export function serializeRecents(recents: string[]): string {
  return JSON.stringify(recents);
}

/**
 * Deserialize recents from JSON.
 * Fail-gracefully: invalid JSON or invalid entries → start fresh.
 */
export function deserializeRecents(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return pruneUnknown(parsed);
  } catch {
    return [];
  }
}
