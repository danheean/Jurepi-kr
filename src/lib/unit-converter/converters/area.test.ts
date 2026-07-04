import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './area';

describe('area converter', () => {
  it('converts 1 m² to 10000 cm²', () => {
    expect(convert(1, 'square_meter', 'square_centimeter')).toBe(10000);
  });

  it('converts 1 m² to ~10.764 ft²', () => {
    expect(convert(1, 'square_meter', 'square_foot')).toBeCloseTo(10.764, 3);
  });

  it('converts 1 ft² to ~0.092903 m²', () => {
    expect(convert(1, 'square_foot', 'square_meter')).toBeCloseTo(0.092903, 6);
  });

  it('handles zero input', () => {
    expect(convert(0, 'square_meter', 'square_foot')).toBe(0);
  });

  it('round-trip: m² → ft² → m² = original', () => {
    const original = 100;
    const ft2 = convert(original, 'square_meter', 'square_foot');
    const back = convert(ft2, 'square_foot', 'square_meter');
    expect(Math.abs(original - back)).toBeLessThan(1e-10);
  });

  it('throws on unknown unit', () => {
    expect(() => convert(1, 'square_meter', 'square_mile_unknown')).toThrow();
  });

  it('validateUnit returns true for valid units', () => {
    expect(validateUnit('square_meter')).toBe(true);
    expect(validateUnit('square_foot')).toBe(true);
  });

  it('validateUnit returns false for invalid units', () => {
    expect(validateUnit('hectare')).toBe(false);
  });
});
