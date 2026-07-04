import { IpResult } from './schema';

/**
 * Normalize ipwho.is response into IpResult shape.
 * Returns null if ip is missing or invalid.
 *
 * ipwho.is returns `ip` which can be either IPv4 or IPv6.
 * We classify based on presence of colons:
 * - Contains ':' → IPv6
 * - Otherwise → IPv4
 */
export function normalizeIpwho(
  raw: unknown
): Partial<Pick<IpResult, 'ipv4' | 'ipv6' | 'isp' | 'city'>> | null {
  // Guard: must be an object
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  // Guard: must have 'ip' field as non-empty string
  if (typeof obj.ip !== 'string' || obj.ip.length === 0) {
    return null;
  }

  const ip = obj.ip;

  // Classify IPv4 vs IPv6 by presence of colons
  const ipv4 = ip.includes(':') ? undefined : ip;
  const ipv6 = ip.includes(':') ? ip : undefined;

  // Extract optional fields
  const isp = typeof obj.isp === 'string' ? obj.isp : undefined;
  const city = typeof obj.city === 'string' ? obj.city : undefined;

  return {
    ipv4,
    ipv6,
    isp,
    city,
  };
}
