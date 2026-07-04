import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './volume';

describe('volume converter', () => {
  it('converts 1 liter to 1000 milliliters', () => {
    expect(convert(1, 'liter', 'milliliter')).toBeCloseTo(1000, 10);
  });

  it('converts 1 liter to ~0.264172 US gallons', () => {
    expect(convert(1, 'liter', 'gallon')).toBeCloseTo(0.264172, 6);
  });

  it('converts 1 gallon to ~3.78541 liters', () => {
    expect(convert(1, 'gallon', 'liter')).toBeCloseTo(3.78541, 5);
  });

  it('handles zero input', () => {
    expect(convert(0, 'liter', 'gallon')).toBe(0);
  });

  it('round-trip: liter → gallon → liter = original', () => {
    const original = 50;
    const gal = convert(original, 'liter', 'gallon');
    const back = convert(gal, 'gallon', 'liter');
    expect(Math.abs(original - back)).toBeLessThan(1e-10);
  });

  it('throws on unknown unit', () => {
    expect(() => convert(1, 'liter', 'pint')).toThrow();
  });

  it('validateUnit returns true for valid units', () => {
    expect(validateUnit('liter')).toBe(true);
    expect(validateUnit('milliliter')).toBe(true);
    expect(validateUnit('cubic_foot')).toBe(true);
  });

  it('validateUnit returns false for invalid units', () => {
    expect(validateUnit('pint')).toBe(false);
  });
});
