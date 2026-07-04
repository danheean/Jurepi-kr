import type { RGB } from './schema';
import { TOLERANCE_MAX_DISTANCE, FEATHER_MAX_PX } from './schema';
import { euclideanDistance } from './color-distance';

/**
 * Apply transparency to an image by removing pixels matching the background color.
 * Creates a new ImageData; the input is not mutated.
 *
 * @param imageData - Source image data
 * @param bgColor - Background color to remove
 * @param tolerance - 0–100 slider value; maps to RGB distance 0–85
 * @param feather - 0–20 pixels for edge softening
 * @param mode - 'flood-fill' (only connected region) or 'global' (all matching colors)
 * @returns New ImageData with alpha modified
 */
export function applyTransparency(
  imageData: ImageData,
  bgColor: RGB,
  tolerance: number,
  feather: number,
  mode: 'flood-fill' | 'global',
): ImageData {
  // Map tolerance (0–100) to max distance (0–85)
  const maxDistance = TOLERANCE_MAX_DISTANCE * (tolerance / 100);

  // Create a copy of the image data
  const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

  if (mode === 'flood-fill') {
    // Mark connected regions from corners for removal
    markFloodFillRegion(result, bgColor, maxDistance, feather);
  } else {
    // Mark all matching colors globally
    markGlobalMatching(result, bgColor, maxDistance, feather);
  }

  return result;
}

/**
 * Mark connected regions starting from the four corners for removal.
 * Uses BFS to find all connected pixels matching the background color (within tolerance).
 */
function markFloodFillRegion(
  imageData: ImageData,
  bgColor: RGB,
  maxDistance: number,
  feather: number,
): void {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);

  // Seeds: four corners (top-left, top-right, bottom-left, bottom-right)
  const seeds = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  // BFS from each corner
  const queue: [number, number][] = [];

  for (const [sx, sy] of seeds) {
    const idx = sy * width + sx;
    if (visited[idx]) continue;

    const pixelColor = getPixelColor(data, width, sx, sy);
    if (euclideanDistance(pixelColor, bgColor) <= maxDistance) {
      queue.push([sx, sy]);
      visited[idx] = 1;
    }
  }

  // BFS
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;

    // Process neighbors (4-connected)
    const neighbors: [number, number][] = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const nIdx = ny * width + nx;
      if (visited[nIdx]) continue;

      const nColor = getPixelColor(data, width, nx, ny);
      const distance = euclideanDistance(nColor, bgColor);

      if (distance <= maxDistance) {
        visited[nIdx] = 1;
        queue.push([nx, ny]);
      }
    }
  }

  // Apply transparency to visited pixels
  applyTransparencyMask(imageData, visited, bgColor, maxDistance, feather);
}

/**
 * Mark all pixels matching the background color for removal.
 */
function markGlobalMatching(
  imageData: ImageData,
  bgColor: RGB,
  maxDistance: number,
  feather: number,
): void {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = getPixelColor(data, width, x, y);
      if (euclideanDistance(color, bgColor) <= maxDistance) {
        visited[y * width + x] = 1;
      }
    }
  }

  applyTransparencyMask(imageData, visited, bgColor, maxDistance, feather);
}

/**
 * Apply alpha changes to marked pixels, with optional feathering.
 */
function applyTransparencyMask(
  imageData: ImageData,
  visited: Uint8Array,
  bgColor: RGB,
  maxDistance: number,
  feather: number,
): void {
  const { width, height, data } = imageData;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const distance = euclideanDistance(
        { r: data[idx], g: data[idx + 1], b: data[idx + 2] },
        bgColor,
      );

      // Determine alpha multiplier for this pixel
      let alphaMultiplier = 1; // Default: keep pixel

      if (visited[y * width + x]) {
        // Pixel is marked for removal
        if (feather > 0 && distance >= maxDistance - feather && distance <= maxDistance) {
          // Feather zone: blend alpha linearly
          const featherRange = feather;
          const distFromBoundary = distance - (maxDistance - featherRange);
          alphaMultiplier = 1 - distFromBoundary / featherRange;
        } else {
          // Full removal
          alphaMultiplier = 0;
        }
      } else if (feather > 0 && distance >= maxDistance - feather && distance <= maxDistance) {
        // Pixel is NOT marked, but in feather zone (can happen at edges due to discrete pixelation)
        const featherRange = feather;
        const distFromBoundary = distance - (maxDistance - featherRange);
        alphaMultiplier = 1 - distFromBoundary / featherRange;
      }

      // Apply alpha change, preserving existing alpha
      const oldAlpha = data[idx + 3];
      data[idx + 3] = Math.round(oldAlpha * alphaMultiplier);
    }
  }
}

/**
 * Get RGB color of a pixel at (x, y).
 */
function getPixelColor(data: Uint8ClampedArray, width: number, x: number, y: number): RGB {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
  };
}
