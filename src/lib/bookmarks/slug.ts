import type { BookmarkFileFront } from './schema';

/**
 * Slugify a string: lowercase, remove diacritics, replace spaces/special with hyphens.
 * Used for deriving slug from filename.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except hyphens
    .replace(/\s+/g, '-') // Space → hyphen
    .replace(/-+/g, '-') // Collapse hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

/**
 * Resolve slug: use frontmatter slug if present, else derive from filename.
 * Korean file canonical: "harness-engineering.md" + "harness-engineering_en.md"
 * Examples:
 *   resolveSlug({title: "하네스", ...}, "harness-engineering.md") → "harness-engineering"
 *   resolveSlug({title: "...", slug: "custom-id", ...}, "harness-engineering.md") → "custom-id"
 */
export function resolveSlug(front: BookmarkFileFront, filename: string): string {
  if (front.slug) {
    return front.slug;
  }
  // Derive: "harness-engineering.md" or "harness-engineering_en.md" → "harness-engineering"
  const base = filename.replace(/(_en)?\.md$/, '');
  return slugify(base);
}
