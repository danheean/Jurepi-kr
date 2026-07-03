import type { RecentEntry, RecentsStore } from './schema';
import { parseRecentsStore } from './schema';

// User-selectable (solar/lunar input) year range. Matches the dropdowns and
// conversion validation.
const TABLE_YEAR_MIN = 1901;
const TABLE_YEAR_MAX = 2050;

/**
 * Format a date object to YYYY-MM-DD string.
 */
function formatDate(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Parse a YYYY-MM-DD string to {year, month, day}.
 * Returns null if the format is invalid.
 */
function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, yStr, mStr, dStr] = match;
  return {
    year: Number(yStr),
    month: Number(mStr),
    day: Number(dStr),
  };
}

/**
 * Validate a date string's format and month/day ranges (YYYY-MM-DD, 1-12, 1-31).
 */
function isDateWellFormed(dateStr: string): boolean {
  const parsed = parseDate(dateStr);
  if (!parsed) return false;
  if (parsed.month < 1 || parsed.month > 12) return false;
  if (parsed.day < 1 || parsed.day > 31) return false;
  return true;
}

/**
 * Check if a SOLAR date string is well-formed AND within the selectable input
 * range [1901, 2050]. The solar date is the canonical key of a recent entry, so
 * out-of-range solar dates (e.g. left over from an older, wider range) are pruned.
 */
function isSolarDateInRange(dateStr: string): boolean {
  const parsed = parseDate(dateStr);
  if (!parsed || !isDateWellFormed(dateStr)) return false;
  return parsed.year >= TABLE_YEAR_MIN && parsed.year <= TABLE_YEAR_MAX;
}

/**
 * Add or update a recent conversion entry.
 * De-duplicates by solar date (if the same solar→lunar pair was already recorded),
 * moves it to the front, and truncates to max 10 entries.
 * Returns a new array (immutable).
 */
export function pushRecent(
  entries: RecentEntry[],
  solarDate: string,
  lunarDate: string,
  max: number = 10
): RecentEntry[] {
  // Remove duplicate (same solar date)
  const cleaned = entries.filter((e) => e.solarDate !== solarDate);
  // Prepend the new/updated entry with current timestamp
  const updated: RecentEntry[] = [
    { solarDate, lunarDate, ts: Date.now() },
    ...cleaned,
  ];
  return updated.slice(0, max);
}

/**
 * Prune entries that are invalid or out of range.
 * Returns a new array with only valid entries.
 * Validates:
 * - Date format (YYYY-MM-DD)
 * - Solar date within the selectable range (1901–2050); the lunar date is a
 *   derived display value that may fall one year below (solar January maps to
 *   the previous lunar year), so only its format is validated.
 * - Timestamp is a positive number
 */
export function pruneUnknown(entries: unknown[]): RecentEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.filter((item): item is RecentEntry => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const e = item as any;

    // Validate types
    if (typeof e.solarDate !== 'string' || typeof e.lunarDate !== 'string' || typeof e.ts !== 'number') {
      return false;
    }

    // Validate format
    if (!parseDate(e.solarDate) || !parseDate(e.lunarDate)) {
      return false;
    }

    // Validate range: solar date within the selectable range, lunar date
    // format-only (it may be one year below the solar year at the boundary).
    if (!isSolarDateInRange(e.solarDate) || !isDateWellFormed(e.lunarDate)) {
      return false;
    }

    // Validate timestamp
    if (e.ts <= 0 || !Number.isInteger(e.ts)) {
      return false;
    }

    return true;
  });
}

/**
 * Load recents from localStorage (or a raw JSON object).
 * Parses the RecentsStore schema and prunes invalid entries.
 * Fail-gracefully: invalid JSON or corrupted data → fresh empty store.
 */
export function loadRecents(raw: unknown): RecentEntry[] {
  const store = parseRecentsStore(raw);
  return pruneUnknown(store.entries);
}

/**
 * Serialize recents to a RecentsStore for localStorage.
 */
export function serializeRecents(entries: RecentEntry[]): RecentsStore {
  return {
    version: 1,
    entries: pruneUnknown(entries),
  };
}

/**
 * Deserialize recents from a JSON string.
 * Fail-gracefully: invalid JSON or corrupted data → fresh empty array.
 */
export function deserializeRecents(json: string): RecentEntry[] {
  try {
    const parsed = JSON.parse(json);
    return loadRecents(parsed);
  } catch {
    return [];
  }
}

/**
 * Helper: format a date for display in YYYY-MM-DD format.
 * Exported for convenience in UI/hooks.
 */
export function formatSolarDate(year: number, month: number, day: number): string {
  return formatDate(year, month, day);
}

/**
 * Helper: format a lunar date for display in YYYY-MM-DD format.
 * Exported for convenience in UI/hooks.
 */
export function formatLunarDate(year: number, month: number, day: number): string {
  return formatDate(year, month, day);
}
