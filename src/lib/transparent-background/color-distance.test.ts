import { describe, it, expect } from 'vitest';
import { euclideanDistance } from './color-distance';

describe('euclideanDistance', () => {
  it('returns 0 for identical colors', () => {
    const dist = euclideanDistance({ r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 });
    expect(dist).toBe(0);
  });

  it('returns sqrt(3)*255 for max distance (white - black)', () => {
    const dist = euclideanDistance({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 });
    const expectedMax = Math.sqrt(3) * 255;
    expect(dist).toBeCloseTo(expectedMax, 1);
  });

  it('calculates distance for single-channel difference', () => {
    const dist = euclideanDistance({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 0 });
    expect(dist).toBe(255);
  });

  it('calculates distance for two-channel difference', () => {
    const dist = euclideanDistance({ r: 255, g: 255, b: 0 }, { r: 0, g: 0, b: 0 });
    const expectedDist = Math.sqrt(255 * 255 + 255 * 255);
    expect(dist).toBeCloseTo(expectedDist, 5);
  });

  it('is symmetric', () => {
    const dist1 = euclideanDistance({ r: 100, g: 50, b: 200 }, { r: 150, g: 100, b: 180 });
    const dist2 = euclideanDistance({ r: 150, g: 100, b: 180 }, { r: 100, g: 50, b: 200 });
    expect(dist1).toBeCloseTo(dist2, 5);
  });

  it('returns small distance for similar colors', () => {
    const dist = euclideanDistance({ r: 255, g: 255, b: 255 }, { r: 254, g: 254, b: 254 });
    expect(dist).toBeCloseTo(Math.sqrt(3), 5);
  });
});
