/**
 * Pure policy for consent state management.
 * No react, no next, no DOM dependencies.
 */

export type ConsentValue = 'granted' | 'denied';

export const CONSENT_STORAGE_KEY = 'jurepi.consent.analytics';

/**
 * Parse raw consent string from storage.
 * Returns null if invalid or unset.
 */
export function parseConsent(raw: string | null): ConsentValue | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  if (raw === 'granted' || raw === 'denied') {
    return raw;
  }

  return null;
}

/**
 * Check if analytics is allowed based on consent state.
 * Only 'granted' returns true.
 */
export function isAnalyticsAllowed(c: ConsentValue | null): boolean {
  return c === 'granted';
}
