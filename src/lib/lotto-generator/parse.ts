export interface ParsedNumberList {
  /** In-range numbers, deduped, first-seen order. */
  valid: number[];
  /** Numeric tokens found outside [min, max], deduped, first-seen order. */
  rejected: number[];
}

/**
 * Parse a raw user string into valid numbers and out-of-range rejects.
 *
 * Splits on any run of non-digit characters (commas, spaces, etc.), so
 * "7, 13, 21", "7 13 21" and "7,13" all work. Non-numeric text (e.g. "abc")
 * is treated as a separator, not a reportable error — there's no number to
 * point at. Numeric tokens outside [min, max] go to `rejected` instead of
 * being silently dropped, so callers can tell the user what didn't make it.
 *
 * Pure function — no framework/DOM dependencies.
 */
export function parseNumberListWithRejects(raw: string, min: number, max: number): ParsedNumberList {
  const seenValid = new Set<number>();
  const seenRejected = new Set<number>();
  const valid: number[] = [];
  const rejected: number[] = [];

  for (const token of raw.split(/[^0-9]+/)) {
    if (token === '') continue;
    const n = Number.parseInt(token, 10);
    if (Number.isNaN(n)) continue;

    if (n < min || n > max) {
      if (!seenRejected.has(n)) {
        seenRejected.add(n);
        rejected.push(n);
      }
      continue;
    }

    if (seenValid.has(n)) continue;
    seenValid.add(n);
    valid.push(n);
  }

  return { valid, rejected };
}

/**
 * Parse a raw user string into a list of valid lottery numbers.
 *
 * Same tokenization as {@link parseNumberListWithRejects}; out-of-range
 * numbers are simply dropped rather than reported. Kept for callers that
 * don't need to surface rejections.
 */
export function parseNumberList(raw: string, min: number, max: number): number[] {
  return parseNumberListWithRejects(raw, min, max).valid;
}
