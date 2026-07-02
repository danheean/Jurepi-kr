import type { MergedTopic } from './schema';

/**
 * Typed access to the generated bookmarks catalog.
 * The catalog is dynamically imported from the code-split data module.
 *
 * NOTE: This module is initialized with an empty catalog for test safety.
 * At runtime, the real catalog is loaded dynamically by useBookmarksCatalog hook.
 */

let _catalog: MergedTopic[] = [];

/**
 * Initialize catalog (called by the runtime hook after dynamic import).
 * Public for testing; typically called once at hook mount.
 */
export function initCatalog(topics: MergedTopic[]): void {
  _catalog = topics;
}

/**
 * Return all topics (immutable reference).
 */
export function allTopics(): MergedTopic[] {
  return _catalog;
}

/**
 * Find topic by slug.
 */
export function byId(slug: string): MergedTopic | null {
  return _catalog.find((t) => t.slug === slug) || null;
}

/**
 * Get all live topic slugs (in catalog order).
 */
export function topics(): string[] {
  return _catalog.map((t) => t.slug);
}

/**
 * Validate all slugs are unique.
 * Returns array of errors; empty = all valid.
 */
export function validateUniqueSlug(catalog: MergedTopic[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  catalog.forEach((topic) => {
    if (seen.has(topic.slug)) {
      errors.push(`Duplicate slug "${topic.slug}"`);
    } else {
      seen.add(topic.slug);
    }
  });

  return errors;
}

/**
 * Validate all topics have both ko and en locales.
 * Returns array of errors; empty = all valid.
 */
export function validateLocaleCompleteness(catalog: MergedTopic[]): string[] {
  const errors: string[] = [];

  catalog.forEach((topic) => {
    if (!topic.ko.title || !topic.ko.description || topic.ko.sections.length === 0) {
      errors.push(`${topic.slug}: KO missing title/description/sections`);
    }
    if (!topic.en.title || !topic.en.description || topic.en.sections.length === 0) {
      errors.push(`${topic.slug}: EN missing title/description/sections`);
    }
  });

  return errors;
}

/**
 * Validate all topics have the minimum link count.
 * Returns array of errors; empty = all valid.
 */
export function validateLinkCounts(catalog: MergedTopic[], minLinks: number = 3): string[] {
  const errors: string[] = [];

  catalog.forEach((topic) => {
    const koLinkCount = topic.ko.sections.reduce((acc, sec) => acc + sec.links.length, 0);
    const enLinkCount = topic.en.sections.reduce((acc, sec) => acc + sec.links.length, 0);

    if (koLinkCount < minLinks) {
      errors.push(
        `${topic.slug} (KO): has ${koLinkCount} links, need ≥${minLinks}`
      );
    }
    if (enLinkCount < minLinks) {
      errors.push(
        `${topic.slug} (EN): has ${enLinkCount} links, need ≥${minLinks}`
      );
    }
  });

  return errors;
}
