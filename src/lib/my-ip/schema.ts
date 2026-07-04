import { z } from 'zod';

export const FETCH_ERROR_CODES = [
  'ALL_PROVIDERS_FAILED',
  'BLOCKED_BY_AD_BLOCKER',
  'NETWORK_ERROR',
  'TIMEOUT',
  'RATE_LIMITED',
] as const;

export type FetchErrorCode = (typeof FETCH_ERROR_CODES)[number];

/**
 * Error class for IP fetch failures.
 * Carries an error code for mapping to localized UI messages.
 */
export class IpFetchError extends Error {
  constructor(
    public code: FetchErrorCode,
    message?: string
  ) {
    super(message || code);
    this.name = 'IpFetchError';
  }
}

/**
 * api.ipify.org response schema: { ip: "..." }
 */
export const ipifyResponseSchema = z.object({
  ip: z.string(),
});

/**
 * ipwho.is response schema: { ip: "...", success: true, city?: "...", isp?: "...", ... }
 */
export const ipwhoResponseSchema = z.object({
  ip: z.string(),
  success: z.literal(true),
  country_code: z.string().optional(),
  city: z.string().optional(),
  isp: z.string().optional(),
});

/**
 * IpResult: the domain model returned by fetchIp().
 * INVARIANT: ipv4 is always present on success.
 */
export const ipResultSchema = z.object({
  ipv4: z.string(),
  ipv6: z.string().optional(),
  isp: z.string().optional(),
  city: z.string().optional(),
  provider: z.enum(['api.ipify.org', 'ipwho.is']),
  fetchedAt: z.number(),
});

export type IpResult = z.infer<typeof ipResultSchema>;
