import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './speed';

describe('speed converter', () => {
  it('converts 1 m/s to 3.6 km/h', () => {
    expect(convert(1, 'meter_per_second', 'kilometer_per_hour')).toBeCloseTo(3.6, 10);
  });

  it('converts 1 m/s to ~2.23694 mi/h', () => {
    expect(convert(1, 'meter_per_second', 'mile_per_hour')).toBeCloseTo(2.23694, 5);
  });

  it('converts 100 km/h to ~27.7778 m/s', () => {
    expect(convert(100, 'kilometer_per_hour', 'meter_per_second')).toBeCloseTo(27.7778, 4);
  });

  it('handles zero input', () => {
    expect(convert(0, 'meter_per_second', 'kilometer_per_hour')).toBe(0);
  });

  it('round-trip: m/s → km/h → m/s = original', () => {
    const original = 50;
    const kmh = convert(original, 'meter_per_second', 'kilometer_per_hour');
    const back = convert(kmh, 'kilometer_per_hour', 'meter_per_second');
    expect(Math.abs(original - back)).toBeLessThan(1e-10);
  });

  it('throws on unknown unit', () => {
    expect(() => convert(1, 'meter_per_second', 'meters_per_second')).toThrow();
  });

  it('validateUnit returns true for valid units', () => {
    expect(validateUnit('meter_per_second')).toBe(true);
    expect(validateUnit('kilometer_per_hour')).toBe(true);
    expect(validateUnit('knot')).toBe(true);
  });

  it('validateUnit returns false for invalid units', () => {
    expect(validateUnit('meters_per_second')).toBe(false);
  });
});
