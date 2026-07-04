import { describe, it, expect } from 'vitest';
import { convert, validateUnit } from './time';

describe('time converter', () => {
  it('converts 1 second to 1000 milliseconds', () => {
    expect(convert(1, 'second', 'millisecond')).toBe(1000);
  });

  it('converts 1 minute to 60 seconds', () => {
    expect(convert(1, 'minute', 'second')).toBe(60);
  });

  it('converts 1 hour to 60 minutes', () => {
    expect(convert(1, 'hour', 'minute')).toBe(60);
  });

  it('converts 1 hour to 3600 seconds', () => {
    expect(convert(1, 'hour', 'second')).toBe(3600);
  });

  it('converts 1 day to 86400 seconds', () => {
    expect(convert(1, 'day', 'second')).toBe(86400);
  });

  it('converts 1 day to 24 hours', () => {
    expect(convert(1, 'day', 'hour')).toBe(24);
  });

  it('handles zero input', () => {
    expect(convert(0, 'second', 'minute')).toBe(0);
  });

  it('round-trip: second → day → second = original', () => {
    const original = 1e6;
    const days = convert(original, 'second', 'day');
    const back = convert(days, 'day', 'second');
    expect(Math.abs(original - back)).toBeLessThan(1e-6);
  });

  it('throws on unknown unit', () => {
    expect(() => convert(1, 'second', 'week')).toThrow();
  });

  it('validateUnit returns true for valid units', () => {
    expect(validateUnit('millisecond')).toBe(true);
    expect(validateUnit('second')).toBe(true);
    expect(validateUnit('minute')).toBe(true);
    expect(validateUnit('hour')).toBe(true);
    expect(validateUnit('day')).toBe(true);
  });

  it('validateUnit returns false for invalid units', () => {
    expect(validateUnit('week')).toBe(false);
  });
});
