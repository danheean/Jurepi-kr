import type { RGB } from './schema';
import { CORNER_INSET_RATIO } from './schema';

/**
 * Sample pixels from the corners of an image and find the dominant color.
 * Samples from a border region inset by insetRatio from each edge.
 * Returns null if detection fails (all corners too different).
 */
export function detectBackgroundColor(imageData: ImageData, insetRatio: number = CORNER_INSET_RATIO): RGB | null {
  const { width, height, data } = imageData;

  if (width < 2 || height < 2) {
    return null;
  }

  const insetX = Math.ceil(width * insetRatio);
  const insetY = Math.ceil(height * insetRatio);

  // Sample from four corner regions
  const cornerPixels: RGB[] = [];

  // Top-left corner
  sampleCornerRegion(data, width, height, 0, 0, insetX, insetY, cornerPixels);

  // Top-right corner
  sampleCornerRegion(data, width, height, width - insetX, 0, insetX, insetY, cornerPixels);

  // Bottom-left corner
  sampleCornerRegion(data, width, height, 0, height - insetY, insetX, insetY, cornerPixels);

  // Bottom-right corner
  sampleCornerRegion(data, width, height, width - insetX, height - insetY, insetX, insetY, cornerPixels);

  if (cornerPixels.length === 0) {
    return null;
  }

  // Find dominant color using histogram
  const histogram = buildColorHistogram(cornerPixels);
  return findDominantColor(histogram);
}

/**
 * Sample pixels from a corner region (rectangle starting at x, y with given width/height).
 */
function sampleCornerRegion(
  data: Uint8ClampedArray,
  imageWidth: number,
  _imageHeight: number,
  x: number,
  y: number,
  w: number,
  h: number,
  output: RGB[],
): void {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const idx = (py * imageWidth + px) * 4;
      output.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      });
    }
  }
}

/**
 * Build a histogram of colors by aggregating each channel independently.
 * Returns frequency map: key = "R,G,B", value = count.
 */
function buildColorHistogram(pixels: RGB[]): Map<string, number> {
  const histogram = new Map<string, number>();

  for (const pixel of pixels) {
    const key = `${pixel.r},${pixel.g},${pixel.b}`;
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }

  return histogram;
}

/**
 * Find the most frequently occurring color in the histogram.
 */
function findDominantColor(histogram: Map<string, number>): RGB | null {
  let maxCount = 0;
  let dominantKey: string | null = null;

  for (const [key, count] of histogram) {
    if (count > maxCount) {
      maxCount = count;
      dominantKey = key;
    }
  }

  if (dominantKey === null) {
    return null;
  }

  const [r, g, b] = dominantKey.split(',').map((v) => parseInt(v, 10));
  return { r, g, b };
}
