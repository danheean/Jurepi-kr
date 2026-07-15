import { describe, expect, it } from 'vitest';
import { lunarNextBirthdayCountdown } from './lunar-next-birthday';
import { daysUntilCountdown } from './age';

/**
 * Golden values cross-checked against the real `korean-lunar-calendar` engine
 * (KASI-backed). Verified via `node -e` before locking in:
 *   lunar 2026-06-09 (non-leap) → solar 2026-07-22
 *   lunar 2027-06-09 (non-leap) → solar 2027-07-12
 *   lunar 2025-06-09 leap       → solar 2025-08-02  (regular → 2025-07-03)
 * The default (real) engine is used so this asserts the actual production path.
 */
describe('lunarNextBirthdayCountdown', () => {
  it('counts to THIS lunar year when it is still ahead (음력 6/9, asOf 2026-07-15 → 7)', async () => {
    const asOf = new Date(2026, 6, 15); // 2026-07-15, before 2026-07-22
    const countdown = await lunarNextBirthdayCountdown(6, 9, false, asOf);
    expect(countdown).toBe(7);
  });

  it('does NOT use the birth-year solar month/day (regression: was 4, correct is 7)', async () => {
    // Birth lunar 1972-06-09 → solar 1972-07-19; the buggy path counted to
    // 2026-07-19 (=4 days). The lunar recurrence is 2026-07-22 (=7 days).
    const asOf = new Date(2026, 6, 15);
    const countdown = await lunarNextBirthdayCountdown(6, 9, false, asOf);
    expect(countdown).not.toBe(4);
    expect(countdown).toBe(7);
  });

  it('rolls to NEXT lunar year once this year has passed (asOf 2026-07-25 → 2027-07-12)', async () => {
    const asOf = new Date(2026, 6, 25); // after this year's 2026-07-22
    const countdown = await lunarNextBirthdayCountdown(6, 9, false, asOf);
    expect(countdown).toBe(daysUntilCountdown(new Date(2027, 6, 12), asOf));
    expect(countdown).toBe(352);
  });

  it('on the exact lunar birthday, counts to next year (mirrors solar behavior)', async () => {
    const asOf = new Date(2026, 6, 22); // exactly this year's lunar birthday
    const countdown = await lunarNextBirthdayCountdown(6, 9, false, asOf);
    expect(countdown).toBe(daysUntilCountdown(new Date(2027, 6, 12), asOf));
  });

  it('clamps into [1, 366]', async () => {
    const asOf = new Date(2026, 6, 15);
    const countdown = await lunarNextBirthdayCountdown(6, 9, false, asOf);
    expect(countdown).toBeGreaterThanOrEqual(1);
    expect(countdown).toBeLessThanOrEqual(366);
  });

  it('falls back to the regular month when the leap month is absent that year', async () => {
    // 2026 has no leap 6th month → recur on regular 6/9 = 2026-07-22.
    const asOf = new Date(2026, 6, 15);
    const countdown = await lunarNextBirthdayCountdown(6, 9, true, asOf);
    expect(countdown).toBe(7);
  });

  it('returns null when the recurrence is out of the engine range (asOf near upper bound)', async () => {
    // asOf in 2050: this year's date may exist but next year (2051) is out of
    // range; when this year has already passed the result must degrade to null.
    const asOf = new Date(2050, 11, 31); // 2050-12-31, past any 2050 lunar 6/9
    const countdown = await lunarNextBirthdayCountdown(6, 9, false, asOf);
    expect(countdown).toBeNull();
  });
});
