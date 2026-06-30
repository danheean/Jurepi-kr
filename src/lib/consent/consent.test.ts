import { describe, it, expect } from 'vitest';
import { parseConsent, isAnalyticsAllowed, CONSENT_STORAGE_KEY } from './consent';

describe('consent policy', () => {
  describe('parseConsent', () => {
    it('returns null when raw is null', () => {
      expect(parseConsent(null)).toBe(null);
    });

    it('returns null when raw is empty string', () => {
      expect(parseConsent('')).toBe(null);
    });

    it('returns "granted" when raw is "granted"', () => {
      expect(parseConsent('granted')).toBe('granted');
    });

    it('returns "denied" when raw is "denied"', () => {
      expect(parseConsent('denied')).toBe('denied');
    });

    it('returns null when raw is invalid value', () => {
      expect(parseConsent('maybe')).toBe(null);
      expect(parseConsent('unknown')).toBe(null);
    });

    it('returns null when raw has whitespace', () => {
      expect(parseConsent(' granted ')).toBe(null);
    });
  });

  describe('isAnalyticsAllowed', () => {
    it('returns true when consent is "granted"', () => {
      expect(isAnalyticsAllowed('granted')).toBe(true);
    });

    it('returns false when consent is "denied"', () => {
      expect(isAnalyticsAllowed('denied')).toBe(false);
    });

    it('returns false when consent is null', () => {
      expect(isAnalyticsAllowed(null)).toBe(false);
    });
  });

  describe('CONSENT_STORAGE_KEY', () => {
    it('is defined and non-empty', () => {
      expect(CONSENT_STORAGE_KEY).toBeDefined();
      expect(CONSENT_STORAGE_KEY.length).toBeGreaterThan(0);
    });
  });
});
