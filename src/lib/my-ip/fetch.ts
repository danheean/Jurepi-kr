import {
  IpResult,
  IpFetchError,
  ipifyResponseSchema,
  ipwhoResponseSchema,
} from './schema';
import { normalizeIpwho } from './normalize';

export const TIMEOUT_PER_PROVIDER_MS = 5000;

export interface FetchIpDeps {
  fetchFn?: typeof fetch;
  now?: () => number;
}

/**
 * Fetch public IP address with multi-provider fallback chain.
 *
 * Chain:
 * 1. Try api.ipify.org (IPv4 + IPv6 in parallel, each 5s timeout)
 * 2. If IPv4 fails → try ipwho.is (5s timeout)
 * 3. If all fail → throw IpFetchError with code mapping
 *
 * Error mapping:
 * - 429 → RATE_LIMITED
 * - AbortError (timeout) → TIMEOUT
 * - TypeError (CORS/blocked) → BLOCKED_BY_AD_BLOCKER
 * - ipwho missing IPv4 → ALL_PROVIDERS_FAILED
 * - Other failures → ALL_PROVIDERS_FAILED
 */
export async function fetchIp(deps?: FetchIpDeps): Promise<IpResult> {
  const fetchFn = deps?.fetchFn ?? fetch;
  const now = deps?.now ?? (() => Date.now());

  // Step 1: Try ipify (IPv4 + IPv6 in parallel)
  let ipv4Result: Record<string, unknown> | null = null;
  let ipv6Result: Record<string, unknown> | null = null;
  let ipifyErr: unknown = null;

  try {
    const [ipv4, ipv6] = await Promise.allSettled([
      fetchWithTimeout(
        fetchFn,
        'https://api.ipify.org?format=json',
        TIMEOUT_PER_PROVIDER_MS
      ),
      fetchWithTimeout(
        fetchFn,
        'https://api6.ipify.org?format=json',
        TIMEOUT_PER_PROVIDER_MS
      ),
    ]);

    if (ipv4.status === 'fulfilled') {
      ipv4Result = ipv4.value;
    } else {
      ipifyErr = ipv4.reason;
    }

    if (ipv6.status === 'fulfilled') {
      ipv6Result = ipv6.value;
    }
  } catch (err) {
    ipifyErr = err;
  }

  // IPv4 is required; if it succeeded, return ipify result
  if (ipv4Result) {
    return {
      ipv4: (ipv4Result.ip as string) || '',
      ipv6: ipv6Result ? (ipv6Result.ip as string) : undefined,
      provider: 'api.ipify.org',
      fetchedAt: now(),
    };
  }

  // IPv4 failed, try ipwho fallback
  try {
    const ipwhoResult = await fetchWithTimeout(
      fetchFn,
      'https://ipwho.is/',
      TIMEOUT_PER_PROVIDER_MS
    );

    const normalized = normalizeIpwho(ipwhoResult);

    // ipwho must return IPv4
    if (!normalized || !normalized.ipv4) {
      throw mapFetchError(ipifyErr, null);
    }

    return {
      ipv4: normalized.ipv4,
      ipv6: normalized.ipv6,
      isp: normalized.isp,
      city: normalized.city,
      provider: 'ipwho.is',
      fetchedAt: now(),
    };
  } catch (ipwhoErr) {
    // Both providers failed
    throw mapFetchError(ipifyErr, ipwhoErr);
  }
}

/**
 * Fetch with timeout using AbortController.
 * Throws on network error, timeout, or HTTP 429.
 */
async function fetchWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  timeoutMs: number
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(url, { signal: controller.signal });

    // Check for rate limit first
    if (response.status === 429) {
      const err = new Error('RATE_LIMITED');
      (err as any).statusCode = 429;
      throw err;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    // Validate response shape
    if (url.includes('ipify')) {
      return ipifyResponseSchema.parse(json);
    } else {
      return ipwhoResponseSchema.parse(json);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Map fetch errors to FetchErrorCode.
 */
function mapFetchError(err1: unknown, err2: unknown): IpFetchError {
  // Check for rate limit
  if (
    (err1 instanceof Error && err1.message === 'RATE_LIMITED') ||
    (err2 instanceof Error && err2.message === 'RATE_LIMITED')
  ) {
    return new IpFetchError('RATE_LIMITED', 'Rate limit reached');
  }

  // Check for timeout (AbortError)
  if (
    (err1 instanceof Error && err1.name === 'AbortError') ||
    (err2 instanceof Error && err2.name === 'AbortError')
  ) {
    return new IpFetchError('TIMEOUT', 'Request timeout');
  }

  // Check for CORS/network TypeError (ad blocker, CORS error)
  if (
    (err1 instanceof TypeError && err1.message.includes('fetch')) ||
    (err2 instanceof TypeError && err2.message.includes('fetch'))
  ) {
    return new IpFetchError(
      'BLOCKED_BY_AD_BLOCKER',
      'Blocked by ad blocker or network error'
    );
  }

  // Default: all providers failed
  return new IpFetchError('ALL_PROVIDERS_FAILED', 'All providers failed');
}
