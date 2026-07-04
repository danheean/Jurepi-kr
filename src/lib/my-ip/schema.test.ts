import { describe, it, expect } from 'vitest';
import {
  FETCH_ERROR_CODES,
  IpFetchError,
  ipifyResponseSchema,
  ipwhoResponseSchema,
  ipResultSchema,
} from './schema';

describe('schema.ts', () => {
  describe('FETCH_ERROR_CODES', () => {
    it('should contain all required error codes', () => {
      expect(FETCH_ERROR_CODES).toEqual([
        'ALL_PROVIDERS_FAILED',
        'BLOCKED_BY_AD_BLOCKER',
        'NETWORK_ERROR',
        'TIMEOUT',
        'RATE_LIMITED',
      ]);
    });
  });

  describe('IpFetchError', () => {
    it('should be an Error instance', () => {
      const err = new IpFetchError('TIMEOUT', 'Request timeout');
      expect(err).toBeInstanceOf(Error);
      expect(err.code).toBe('TIMEOUT');
      expect(err.message).toBe('Request timeout');
    });

    it('should work with optional message', () => {
      const err = new IpFetchError('ALL_PROVIDERS_FAILED');
      expect(err.code).toBe('ALL_PROVIDERS_FAILED');
    });
  });

  describe('ipifyResponseSchema', () => {
    it('should validate correct ipify response', () => {
      const result = ipifyResponseSchema.parse({ ip: '203.0.113.45' });
      expect(result).toEqual({ ip: '203.0.113.45' });
    });

    it('should reject missing ip field', () => {
      expect(() => ipifyResponseSchema.parse({})).toThrow();
    });

    it('should reject non-string ip', () => {
      expect(() => ipifyResponseSchema.parse({ ip: 123 })).toThrow();
    });

    it('should reject extra fields gracefully (strip)', () => {
      const result = ipifyResponseSchema.parse({ ip: '203.0.113.45', extra: 'field' });
      expect(result).toEqual({ ip: '203.0.113.45' });
    });
  });

  describe('ipwhoResponseSchema', () => {
    it('should validate full ipwho response', () => {
      const result = ipwhoResponseSchema.parse({
        ip: '203.0.113.45',
        success: true,
        country_code: 'US',
        city: 'New York',
        isp: 'Example ISP',
      });
      expect(result).toEqual({
        ip: '203.0.113.45',
        success: true,
        country_code: 'US',
        city: 'New York',
        isp: 'Example ISP',
      });
    });

    it('should validate ipwho response with IPv6', () => {
      const result = ipwhoResponseSchema.parse({
        ip: '2001:db8::1',
        success: true,
      });
      expect(result.ip).toBe('2001:db8::1');
      expect(result.success).toBe(true);
    });

    it('should require success and ip fields', () => {
      expect(() =>
        ipwhoResponseSchema.parse({ success: true })
      ).toThrow();
      expect(() =>
        ipwhoResponseSchema.parse({ ip: '203.0.113.45' })
      ).toThrow();
    });

    it('should allow missing optional fields', () => {
      const result = ipwhoResponseSchema.parse({
        ip: '203.0.113.45',
        success: true,
      });
      expect(result.isp).toBeUndefined();
      expect(result.city).toBeUndefined();
    });

    it('should reject success: false', () => {
      expect(() =>
        ipwhoResponseSchema.parse({
          ip: '203.0.113.45',
          success: false,
        })
      ).toThrow();
    });
  });

  describe('ipResultSchema', () => {
    it('should validate complete IpResult', () => {
      const result = ipResultSchema.parse({
        ipv4: '203.0.113.45',
        ipv6: '2001:db8::1',
        isp: 'Example ISP',
        city: 'New York',
        provider: 'api.ipify.org',
        fetchedAt: 1234567890,
      });
      expect(result.ipv4).toBe('203.0.113.45');
      expect(result.ipv6).toBe('2001:db8::1');
    });

    it('should require ipv4, provider, fetchedAt', () => {
      expect(() =>
        ipResultSchema.parse({
          ipv6: '2001:db8::1',
          provider: 'api.ipify.org',
          fetchedAt: 1234567890,
        })
      ).toThrow();
    });

    it('should allow minimal IpResult (ipv4 only)', () => {
      const result = ipResultSchema.parse({
        ipv4: '203.0.113.45',
        provider: 'ipwho.is',
        fetchedAt: 1234567890,
      });
      expect(result.ipv4).toBe('203.0.113.45');
      expect(result.ipv6).toBeUndefined();
      expect(result.isp).toBeUndefined();
      expect(result.city).toBeUndefined();
    });

    it('should validate provider enum', () => {
      expect(() =>
        ipResultSchema.parse({
          ipv4: '203.0.113.45',
          provider: 'unknown.provider',
          fetchedAt: 1234567890,
        })
      ).toThrow();
    });

    it('should require fetchedAt as number', () => {
      expect(() =>
        ipResultSchema.parse({
          ipv4: '203.0.113.45',
          provider: 'api.ipify.org',
          fetchedAt: '1234567890',
        })
      ).toThrow();
    });
  });
});
