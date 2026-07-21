import { describe, it, expect } from 'vitest';
import { parseNumberList, parseNumberListWithRejects } from './parse';
import { LOTTO_MIN, LOTTO_MAX } from './schema';

const parse = (raw: string) => parseNumberList(raw, LOTTO_MIN, LOTTO_MAX);
const parseWithRejects = (raw: string) => parseNumberListWithRejects(raw, LOTTO_MIN, LOTTO_MAX);

describe('parseNumberList', () => {
  it('parses a single number', () => {
    expect(parse('7')).toEqual([7]);
  });

  it('parses comma-separated numbers', () => {
    expect(parse('7,13,21')).toEqual([7, 13, 21]);
  });

  it('tolerates spaces around commas', () => {
    expect(parse(' 7 , 13 , 21 ')).toEqual([7, 13, 21]);
  });

  it('accepts any non-digit run as a separator (spaces, commas mixed)', () => {
    expect(parse('7 13, 21')).toEqual([7, 13, 21]);
  });

  it('ignores empty tokens from trailing/leading/duplicate separators', () => {
    expect(parse(',7,,13,')).toEqual([7, 13]);
  });

  it('drops numbers outside the valid range', () => {
    expect(parse('0, 7, 45, 46, 100')).toEqual([7, 45]);
  });

  it('removes duplicates, preserving first-seen order', () => {
    expect(parse('13, 7, 13, 7')).toEqual([13, 7]);
  });

  it('returns an empty array for empty or non-numeric input', () => {
    expect(parse('')).toEqual([]);
    expect(parse('   ')).toEqual([]);
    expect(parse('abc')).toEqual([]);
  });

  it('keeps the inclusive boundaries', () => {
    expect(parse('1, 45')).toEqual([1, 45]);
  });
});

describe('parseNumberListWithRejects', () => {
  // Regression: the UI used to silently drop out-of-range/non-numeric input
  // with zero feedback. This variant reports what was rejected and why, so
  // the UI can tell the user instead of doing nothing.
  it('reports valid numbers with no rejects for clean input', () => {
    expect(parseWithRejects('7, 13, 21')).toEqual({ valid: [7, 13, 21], rejected: [] });
  });

  it('separates out-of-range numbers into rejected, preserving valid ones', () => {
    expect(parseWithRejects('0, 7, 45, 46, 100')).toEqual({ valid: [7, 45], rejected: [0, 46, 100] });
  });

  it('dedupes rejected numbers, preserving first-seen order', () => {
    expect(parseWithRejects('99, 7, 99')).toEqual({ valid: [7], rejected: [99] });
  });

  it('returns both empty for empty or purely non-numeric input', () => {
    expect(parseWithRejects('')).toEqual({ valid: [], rejected: [] });
    expect(parseWithRejects('abc')).toEqual({ valid: [], rejected: [] });
  });

  it('agrees with parseNumberList on the valid set', () => {
    const raw = '0, 7, 13, 46, 21';
    expect(parseWithRejects(raw).valid).toEqual(parse(raw));
  });
});
