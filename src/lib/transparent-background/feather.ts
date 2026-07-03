/**
 * Feather edge alpha values for a set of pixels.
 * Used for anti-aliasing removal boundaries.
 *
 * Note: Feathering logic is primarily handled in transparency.ts.
 * This file provides a utility for reference and potential future enhancements.
 */

/**
 * Apply linear alpha interpolation to pixels in the feather zone.
 * For pixels between (tolerance - featherWidth) and tolerance distance,
 * blend alpha linearly: alpha = 1 - (distance - (tolerance - featherWidth)) / featherWidth.
 *
 * @param pixels - Uint8ClampedArray of RGBA data
 * @param indices - Array of alpha channel indices (byte indices of alpha values)
 * @param tolerance - Tolerance distance threshold
 * @param featherWidth - Width of feather zone
 * @param distances - Array of color distances for each pixel (same length as indices)
 *
 * This is an in-place operation for batch processing if needed.
 */
export function featherAlphaValues(
  pixels: Uint8ClampedArray,
  indices: number[],
  tolerance: number,
  featherWidth: number,
  distances: number[],
): void {
  const featherStart = tolerance - featherWidth;

  for (let i = 0; i < indices.length; i++) {
    const alphaIdx = indices[i];
    const distance = distances[i];

    if (distance >= featherStart && distance <= tolerance) {
      const blend = 1 - (distance - featherStart) / featherWidth;
      const oldAlpha = pixels[alphaIdx];
      pixels[alphaIdx] = Math.round(oldAlpha * blend);
    }
  }
}
