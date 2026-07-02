import {
  RankingFileFrontSchema,
  type RankingFileFront,
  type MergedRanking,
} from './schema';
import { resolveSlug } from './slug';

/**
 * Merge ko + en pair following canonical rule:
 * - Structural fields (field, asOfDate, sourceUrl) from KO canonical
 * - EN inherits if absent; must match if present (error if conflict)
 * - sourceNote is per-locale (ko.sourceNote, en.sourceNote) — can differ
 * - Locale items (title, items[]) independent per locale
 *
 * INVARIANT: every merged record has both ko+en with ≥3 items each.
 */
export function mergePair(
  koFront: RankingFileFront,
  enFront: RankingFileFront,
  koFilename: string = 'unknown.md'
): MergedRanking {
  const slug = resolveSlug(koFront, koFilename);
  // Canonical fields are required on the merged record. Callers (validatePair /
  // the generator) guarantee presence; guard here to narrow the optional
  // frontmatter types and fail loudly if a caller bypasses validation.
  if (!koFront.field || !koFront.asOfDate || !koFront.sourceNote) {
    throw new Error(
      `mergePair: KO field/asOfDate/sourceNote are required (${koFilename})`
    );
  }
  if (!enFront.sourceNote) {
    throw new Error(
      `mergePair: EN sourceNote is required (or inherit from KO) (${koFilename})`
    );
  }
  const field = koFront.field;
  const asOfDate = koFront.asOfDate;
  const sourceUrl = koFront.sourceUrl;

  return {
    slug,
    field,
    asOfDate,
    sourceUrl,
    ko: {
      title: koFront.title,
      sourceNote: koFront.sourceNote,
      items: koFront.items,
    },
    en: {
      title: enFront.title,
      sourceNote: enFront.sourceNote,
      items: enFront.items,
    },
  };
}

/**
 * Validate ko+en pair and return merged record + errors.
 * Errors are non-blocking (collect all before failing).
 * EN sourceNote can differ from KO (or be omitted to inherit KO).
 * Returns { ranking: MergedRanking | null, errors: string[] }.
 */
export function validatePair(
  koFilename: string,
  koFront: unknown,
  enFront: unknown
): { ranking: MergedRanking | null; errors: string[] } {
  const errors: string[] = [];

  // Parse frontmatter
  const koResult = RankingFileFrontSchema.safeParse(koFront);
  const enResult = RankingFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { ranking: null, errors };
  }

  const ko = koResult.data!;
  const en = enResult.data!;

  // Validate KO has all required canonical fields
  if (!ko.field) {
    errors.push(`${koFilename}: KO field is required`);
  }
  if (!ko.asOfDate) {
    errors.push(`${koFilename}: KO asOfDate is required`);
  }
  if (!ko.sourceNote) {
    errors.push(`${koFilename}: KO sourceNote is required`);
  }

  if (errors.length > 0) {
    return { ranking: null, errors };
  }

  // Canonical rule check: EN field/asOfDate/sourceUrl must not override KO if present
  if (en.field && en.field !== ko.field) {
    errors.push(
      `${koFilename}: EN field must match KO (KO="${ko.field}", EN="${en.field}")`
    );
  }
  if (en.asOfDate && en.asOfDate !== ko.asOfDate) {
    errors.push(
      `${koFilename}: EN asOfDate must match KO (KO="${ko.asOfDate}", EN="${en.asOfDate}")`
    );
  }
  if (en.sourceUrl && en.sourceUrl !== ko.sourceUrl) {
    errors.push(`${koFilename}: EN sourceUrl must match KO`);
  }

  // EN sourceNote can differ from KO (localized), or inherit if omitted
  const enSourceNote = en.sourceNote ?? ko.sourceNote;
  if (!enSourceNote) {
    errors.push(`${koFilename}: EN sourceNote is required (or inherit from KO)`);
    return { ranking: null, errors };
  }

  // Merge with inherited EN sourceNote
  const enWithSourceNote = { ...en, sourceNote: enSourceNote };
  const ranking = mergePair(ko, enWithSourceNote as RankingFileFront, koFilename);

  return { ranking: errors.length === 0 ? ranking : null, errors };
}
