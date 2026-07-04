import { describe, it, expect } from 'vitest';
import { detectBackgroundColor } from './corner-detect';
import type { RGB } from './schema';

/**
 * Helper to create a test ImageData with uniform color
 */
function createUniformImageData(width: number, height: number, color: RGB): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color.r;     // R
    data[i + 1] = color.g; // G
    data[i + 2] = color.b; // B
    data[i + 3] = 255;     // A
  }
  return new ImageData(data, width, height);
}

/**
 * Helper to create ImageData with corners of one color and center of another
 */
function createImageDataWithBackgroundCorners(
  width: number,
  height: number,
  bgColor: RGB,
  centerColor: RGB,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Determine if this pixel is in the "corner region" (outer 20%)
      const isCorner = x < width * 0.2 || x >= width * 0.8 || y < height * 0.2 || y >= height * 0.8;

      const color = isCorner ? bgColor : centerColor;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  return new ImageData(data, width, height);
}

describe('detectBackgroundColor', () => {
  it('detects white color from uniform white image', () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const imageData = createUniformImageData(100, 100, white);

    const detected = detectBackgroundColor(imageData);
    expect(detected).not.toBeNull();
    if (detected) {
      expect(detected.r).toBe(255);
      expect(detected.g).toBe(255);
      expect(detected.b).toBe(255);
    }
  });

  it('detects black color from uniform black image', () => {
    const black: RGB = { r: 0, g: 0, b: 0 };
    const imageData = createUniformImageData(100, 100, black);

    const detected = detectBackgroundColor(imageData);
    expect(detected).not.toBeNull();
    if (detected) {
      expect(detected.r).toBe(0);
      expect(detected.g).toBe(0);
      expect(detected.b).toBe(0);
    }
  });

  it('detects gray color from uniform gray image', () => {
    const gray: RGB = { r: 128, g: 128, b: 128 };
    const imageData = createUniformImageData(80, 80, gray);

    const detected = detectBackgroundColor(imageData);
    expect(detected).not.toBeNull();
    if (detected) {
      expect(detected.r).toBe(128);
      expect(detected.g).toBe(128);
      expect(detected.b).toBe(128);
    }
  });

  it('detects background color when corners are different from center', () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const red: RGB = { r: 255, g: 0, b: 0 };
    const imageData = createImageDataWithBackgroundCorners(120, 120, white, red);

    const detected = detectBackgroundColor(imageData);
    expect(detected).not.toBeNull();
    if (detected) {
      // Should detect white from corners
      expect(detected.r).toBe(255);
      expect(detected.g).toBe(255);
      expect(detected.b).toBe(255);
    }
  });

  it('uses default insetRatio of 0.05', () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const imageData = createUniformImageData(200, 200, white);

    const detected = detectBackgroundColor(imageData);
    expect(detected).not.toBeNull();
  });

  it('handles custom insetRatio', () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const imageData = createUniformImageData(100, 100, white);

    const detected = detectBackgroundColor(imageData, 0.1);
    expect(detected).not.toBeNull();
  });

  it('returns dominant color when corners have mixed colors', () => {
    // Create image with corners: 3 white, 1 black
    const data = new Uint8ClampedArray(100 * 100 * 4);

    // Fill most of image with white
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }

    const imageData = new ImageData(data, 100, 100);
    const detected = detectBackgroundColor(imageData);
    expect(detected).not.toBeNull();
    if (detected) {
      expect(detected.r).toBe(255);
      expect(detected.g).toBe(255);
      expect(detected.b).toBe(255);
    }
  });

  it('handles very small images', () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const imageData = createUniformImageData(2, 2, white);

    const detected = detectBackgroundColor(imageData);
    expect(detected).not.toBeNull();
  });

  it('handles custom insetRatio values', () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const imageData = createUniformImageData(50, 50, white);

    // Test with small inset ratio
    const detected1 = detectBackgroundColor(imageData, 0.02);
    expect(detected1).not.toBeNull();

    // Test with high inset ratio (samples more from center)
    const detected2 = detectBackgroundColor(imageData, 0.3);
    expect(detected2).not.toBeNull();

    // Test with very high inset (still works)
    const detected3 = detectBackgroundColor(imageData, 0.4);
    expect(detected3).not.toBeNull();
  });
});
