import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchIp, TIMEOUT_PER_PROVIDER_MS } from './fetch';
import { IpFetchError } from './schema';

// Mock fetch to avoid real network calls
const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllTimers();
});

describe('fetch.ts', () => {
  describe('TIMEOUT_PER_PROVIDER_MS', () => {
    it('should be 5000ms', () => {
      expect(TIMEOUT_PER_PROVIDER_MS).toBe(5000);
    });
  });

  describe('fetchIp', () => {
    it('should return IpResult when both ipify IPv4 and IPv6 succeed', async () => {
      const now = 1000000;
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ip: '203.0.113.45' }))
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ip: '2001:db8::1' }))
        );

      const result = await fetchIp({
        fetchFn: mockFetch,
        now: () => now,
      });

      expect(result.ipv4).toBe('203.0.113.45');
      expect(result.ipv6).toBe('2001:db8::1');
      expect(result.provider).toBe('api.ipify.org');
      expect(result.fetchedAt).toBe(now);
    });

    it('should return IpResult when only ipify IPv4 succeeds (IPv6 optional)', async () => {
      const now = 1000000;
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ip: '203.0.113.45' }))
        )
        .mockRejectedValueOnce(new Error('IPv6 unavailable'));

      const result = await fetchIp({
        fetchFn: mockFetch,
        now: () => now,
      });

      expect(result.ipv4).toBe('203.0.113.45');
      expect(result.ipv6).toBeUndefined();
      expect(result.provider).toBe('api.ipify.org');
    });

    it('should fail if ipify IPv4 fails (even if IPv6 succeeds)', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('IPv4 timeout'))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ip: '2001:db8::1' }))
        );

      try {
        await fetchIp({ fetchFn: mockFetch });
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IpFetchError);
      }
    });

    it('should fallback to ipwho.is when ipify fails', async () => {
      const now = 1000000;
      mockFetch
        .mockRejectedValueOnce(new Error('IPv4 timeout'))
        .mockRejectedValueOnce(new Error('IPv6 unavailable'))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              ip: '203.0.113.45',
              success: true,
              city: 'New York',
              isp: 'Example ISP',
            })
          )
        );

      const result = await fetchIp({
        fetchFn: mockFetch,
        now: () => now,
      });

      expect(result.ipv4).toBe('203.0.113.45');
      expect(result.city).toBe('New York');
      expect(result.isp).toBe('Example ISP');
      expect(result.provider).toBe('ipwho.is');
      expect(result.fetchedAt).toBe(now);
    });

    it('should throw RATE_LIMITED when receiving 429', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ip: '203.0.113.45' }), { status: 429 })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({}), { status: 429 })
        );

      try {
        await fetchIp({ fetchFn: mockFetch });
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IpFetchError);
        expect((error as IpFetchError).code).toBe('RATE_LIMITED');
      }
    });

    it('should detect timeout via AbortError', async () => {
      // Reject with AbortError to simulate timeout
      const abortErr = new Error('Aborted');
      abortErr.name = 'AbortError';

      mockFetch
        .mockRejectedValueOnce(abortErr)
        .mockRejectedValueOnce(abortErr)
        .mockRejectedValueOnce(abortErr);

      try {
        await fetchIp({ fetchFn: mockFetch });
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IpFetchError);
        expect((error as IpFetchError).code).toBe('TIMEOUT');
      }
    });

    it('should throw BLOCKED_BY_AD_BLOCKER on CORS error', async () => {
      const corsError = new TypeError('Failed to fetch');
      mockFetch
        .mockRejectedValueOnce(corsError)
        .mockRejectedValueOnce(corsError)
        .mockRejectedValueOnce(corsError);

      try {
        await fetchIp({ fetchFn: mockFetch });
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IpFetchError);
        expect((error as IpFetchError).code).toBe('BLOCKED_BY_AD_BLOCKER');
      }
    });

    it('should throw ALL_PROVIDERS_FAILED when ipwho.is response missing ipv4', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('IPv4 timeout'))
        .mockRejectedValueOnce(new Error('IPv6 unavailable'))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              ip: '2001:db8::1', // Only IPv6, no IPv4
              success: true,
            })
          )
        );

      try {
        await fetchIp({ fetchFn: mockFetch });
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IpFetchError);
        expect((error as IpFetchError).code).toBe('ALL_PROVIDERS_FAILED');
      }
    });

    it('should throw ALL_PROVIDERS_FAILED when both providers fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'));

      try {
        await fetchIp({ fetchFn: mockFetch });
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IpFetchError);
        expect((error as IpFetchError).code).toBe('ALL_PROVIDERS_FAILED');
      }
    });

    it('should handle ipwho.is returning IPv6 only (v4 required)', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              ip: '2001:0db8:85a3::8a2e:0370:7334',
              success: true,
            })
          )
        );

      try {
        await fetchIp({ fetchFn: mockFetch });
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IpFetchError);
        expect((error as IpFetchError).code).toBe('ALL_PROVIDERS_FAILED');
      }
    });

    it('should use injected now() for fetchedAt timestamp', async () => {
      const customNow = 9999999;
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ip: '203.0.113.45' }))
        )
        .mockRejectedValueOnce(new Error('IPv6 unavailable'));

      const result = await fetchIp({
        fetchFn: mockFetch,
        now: () => customNow,
      });
      expect(result.fetchedAt).toBe(customNow);
    });

    it('should use default fetch and now if deps not provided', async () => {
      // This test verifies the function can be called without deps
      const globalFetchBackup = global.fetch;
      global.fetch = mockFetch as any;

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ip: '203.0.113.45' }))
        )
        .mockRejectedValueOnce(new Error('IPv6 unavailable'));

      const result = await fetchIp();
      expect(result.ipv4).toBe('203.0.113.45');

      global.fetch = globalFetchBackup;
    });

    it('should use AbortController for timeout', async () => {
      let abortControllerUsed = false;

      mockFetch.mockImplementationOnce((url, init) => {
        // Verify that AbortController signal is passed
        if (init?.signal) {
          abortControllerUsed = true;
          // Simulate abort signal being triggered
          const abortErr = new Error('Aborted');
          abortErr.name = 'AbortError';
          throw abortErr;
        }
        return Promise.reject(new Error('No signal'));
      });

      try {
        await fetchIp({ fetchFn: mockFetch });
      } catch (error) {
        // Verify that abort signal was used
        expect(abortControllerUsed).toBe(true);
      }
    });
  });
});
