import type { RGB } from './schema';

/**
 * Calculate Euclidean distance between two RGB colors in RGB space.
 * Range: 0 (identical) to ~442.5 (white-black).
 */
export function euclideanDistance(color1: RGB, color2: RGB): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
