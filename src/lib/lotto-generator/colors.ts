export interface BallColor {
  /** Ball background color (hex). */
  background: string;
  /** Number text color (hex), chosen for contrast on the band. */
  color: string;
}

/**
 * Map a lotto number (1–45) to its official Korean lottery (동행복권) ball color.
 *
 * These are the real dhlottery ball-band colors (read from the live result
 * page's stylesheet: .num-0n/.num-1n/.num-2n/.num-3n/.num-4n), so a generated
 * ball looks like the numbers on the official result page. Applied as inline
 * `background-color` (not design-system tokens) because they are an external
 * brand palette, not part of the site's accent system.
 *
 * Blue/red/gray are the exact official values — all already clear WCAG AA
 * (4.5:1) with a white numeral. Gold and green are deepened from the official
 * values (2.59:1 and 3.45:1 on white — both fail AA) to the same hue, just
 * dark enough to clear 4.5:1; everything else about the band is unchanged.
 *
 *   1–10  gold   (deepened — white numeral)
 *  11–20  blue   (official — white numeral)
 *  21–30  red    (official — white numeral)
 *  31–40  gray   (official — white numeral)
 *  41–45  green  (deepened — white numeral)
 *
 * @param number - 1–45
 * @returns BallColor with background + text hex
 */
export function ballColor(number: number): BallColor {
  if (number >= 1 && number <= 10) {
    return { background: '#9e6500', color: '#ffffff' };
  }
  if (number >= 11 && number <= 20) {
    return { background: '#0063cc', color: '#ffffff' };
  }
  if (number >= 21 && number <= 30) {
    return { background: '#d8314f', color: '#ffffff' };
  }
  if (number >= 31 && number <= 40) {
    return { background: '#6e7382', color: '#ffffff' };
  }
  if (number >= 41 && number <= 45) {
    return { background: '#258439', color: '#ffffff' };
  }
  // Fallback (out of range — should not happen): brand violet.
  return { background: '#6c5ce7', color: '#ffffff' };
}
