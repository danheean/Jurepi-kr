import type { MergedTopic } from './schema';

export const RECENTS_MAX = 20;

/**
 * Toggle favorite: add if absent, remove if present. Preserve order.
 * Immutable: returns new array, never mutates input.
 */
export function toggleFavorite(slugs: string[], slug: string): string[] {
  const idx = slugs.indexOf(slug);
  if (idx >= 0) {
    return slugs.filter((_, i) => i !== idx);
  }
  return [...slugs, slug];
}

/**
 * Add to recents (most-recent-first), de-duplicate, truncate to max.
 * Immutable: returns new array.
 */
export function pushRecent(
  slugs: string[],
  slug: string,
  max: number = RECENTS_MAX
): string[] {
  // Move to front if exists, else prepend
  const filtered = slugs.filter((s) => s !== slug);
  const updated = [slug, ...filtered];
  return updated.slice(0, max);
}

/**
 * Remove slugs not in catalog (e.g., after topic removal).
 * Immutable: returns new array.
 */
export function pruneUnknown(
  slugs: string[],
  catalog: MergedTopic[]
): string[] {
  const known = new Set(catalog.map((t) => t.slug));
  return slugs.filter((s) => known.has(s));
}
