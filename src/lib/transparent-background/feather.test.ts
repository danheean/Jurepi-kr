import { describe, it, expect } from 'vitest';
import { featherAlphaValues } from './feather';

describe('featherAlphaValues', () => {
  it('applies linear alpha interpolation in feather zone', () => {
    const pixels = new Uint8ClampedArray(20); // 5 pixels * 4 bytes each
    pixels[3] = 255;  // pixel 0: alpha = 255
    pixels[7] = 200;  // pixel 1: alpha = 200
    pixels[11] = 180; // pixel 2: alpha = 180
    pixels[15] = 150; // pixel 3: alpha = 150
    pixels[19] = 128; // pixel 4: alpha = 128

    const indices = [3, 7, 11, 15, 19]; // alpha indices
    const distances = [30, 35, 40, 45, 50]; // distances for each pixel
    const tolerance = 50;
    const featherWidth = 20;

    featherAlphaValues(pixels, indices, tolerance, featherWidth, distances);

    // Feather zone is [30, 50]
    // pixel 0 (distance 30): at boundary, blend = 1 - (30-30)/20 = 1, alpha = 255 * 1 = 255
    expect(pixels[3]).toBe(255);

    // pixel 1 (distance 35): blend = 1 - (35-30)/20 = 0.75, alpha = 200 * 0.75 = 150
    expect(pixels[7]).toBe(150);

    // pixel 2 (distance 40): blend = 1 - (40-30)/20 = 0.5, alpha = 180 * 0.5 = 90
    expect(pixels[11]).toBe(90);

    // pixel 3 (distance 45): blend = 1 - (45-30)/20 = 0.25, alpha = 150 * 0.25 = 38 (rounded)
    expect(pixels[15]).toBe(38);

    // pixel 4 (distance 50): at edge, blend = 1 - (50-30)/20 = 0, alpha = 128 * 0 = 0
    expect(pixels[19]).toBe(0);
  });

  it('does not modify pixels outside feather zone', () => {
    const pixels = new Uint8ClampedArray(8);
    pixels[3] = 255; // pixel 0
    pixels[7] = 128; // pixel 1

    const indices = [3, 7];
    const distances = [10, 60]; // both outside zone [30, 50]
    const tolerance = 50;
    const featherWidth = 20;

    featherAlphaValues(pixels, indices, tolerance, featherWidth, distances);

    // Both should be unchanged
    expect(pixels[3]).toBe(255);
    expect(pixels[7]).toBe(128);
  });

  it('handles pixels outside feather zone completely', () => {
    const pixels = new Uint8ClampedArray(8);
    pixels[3] = 200;  // pixel 0
    pixels[7] = 150;  // pixel 1

    const indices = [3, 7];
    const distances = [10, 55]; // both outside zone [30, 50]
    const tolerance = 50;
    const featherWidth = 20;

    // Both pixels are outside [30, 50]
    featherAlphaValues(pixels, indices, tolerance, featherWidth, distances);

    // Both should be unchanged
    expect(pixels[3]).toBe(200);
    expect(pixels[7]).toBe(150);
  });

  it('handles empty indices array', () => {
    const pixels = new Uint8ClampedArray(4);
    pixels[3] = 255;

    const indices: number[] = [];
    const distances: number[] = [];
    const tolerance = 50;
    const featherWidth = 20;

    featherAlphaValues(pixels, indices, tolerance, featherWidth, distances);

    // Should be unchanged
    expect(pixels[3]).toBe(255);
  });
});
