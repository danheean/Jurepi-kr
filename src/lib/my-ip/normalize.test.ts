import { describe, it, expect } from 'vitest';
import { normalizeIpwho } from './normalize';

describe('normalize.ts', () => {
  describe('normalizeIpwho', () => {
    it('should extract ipv4 from standard response', () => {
      const result = normalizeIpwho({
        ip: '203.0.113.45',
        success: true,
        city: 'New York',
        isp: 'Example ISP',
      });
      expect(result).toEqual({
        ipv4: '203.0.113.45',
        ipv6: undefined,
        city: 'New York',
        isp: 'Example ISP',
      });
    });

    it('should classify IPv4 address (no colons)', () => {
      const result = normalizeIpwho({
        ip: '203.0.113.45',
        success: true,
      });
      expect(result?.ipv4).toBe('203.0.113.45');
      expect(result?.ipv6).toBeUndefined();
    });

    it('should classify IPv6 address (with colons)', () => {
      const result = normalizeIpwho({
        ip: '2001:db8::1',
        success: true,
        city: 'London',
      });
      expect(result?.ipv4).toBeUndefined();
      expect(result?.ipv6).toBe('2001:db8::1');
      expect(result?.city).toBe('London');
    });

    it('should return null when ip field is missing', () => {
      expect(normalizeIpwho({ success: true })).toBeNull();
    });

    it('should return null when ip is not a string', () => {
      expect(normalizeIpwho({ ip: 123, success: true })).toBeNull();
      expect(normalizeIpwho({ ip: null, success: true })).toBeNull();
    });

    it('should return null when input is not an object', () => {
      expect(normalizeIpwho(null)).toBeNull();
      expect(normalizeIpwho(undefined)).toBeNull();
      expect(normalizeIpwho('string')).toBeNull();
      expect(normalizeIpwho(123)).toBeNull();
    });

    it('should handle missing optional fields gracefully', () => {
      const result = normalizeIpwho({
        ip: '203.0.113.45',
        success: true,
      });
      expect(result).toEqual({
        ipv4: '203.0.113.45',
        ipv6: undefined,
        city: undefined,
        isp: undefined,
      });
    });

    it('should include isp and city when present', () => {
      const result = normalizeIpwho({
        ip: '203.0.113.45',
        success: true,
        isp: 'ISP Name',
        city: 'City Name',
        country_code: 'XX',
      });
      expect(result?.isp).toBe('ISP Name');
      expect(result?.city).toBe('City Name');
    });

    it('should handle empty string ip', () => {
      expect(normalizeIpwho({ ip: '', success: true })).toBeNull();
    });

    it('should handle IPv6 with zones/scopes', () => {
      const result = normalizeIpwho({
        ip: 'fe80::1%eth0',
        success: true,
      });
      expect(result?.ipv6).toBe('fe80::1%eth0');
    });
  });
});
