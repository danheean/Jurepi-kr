import { describe, expect, it } from 'vitest';
import { recommendedOrder } from './order';
import type { Place } from './schema';

// Minimal Place factory — only the fields recommendedOrder reads (id, curator).
const place = (id: string, curator: Place['curator']): Place =>
  ({
    id,
    curator,
    name: id,
    lat: 37.5,
    lng: 127,
    category: 'korean',
    address: 'x',
    description: 'x',
    personalNote: 'x',
  }) as Place;

describe('recommendedOrder', () => {
  it('returns [] for empty input', () => {
    expect(recommendedOrder([])).toEqual([]);
  });

  it('interleaves curators round-robin so each curator leads the top', () => {
    // Authoring (flat) order: one curator dominates the front.
    const input = [
      place('honey-a#0', 'honey'),
      place('honey-a#1', 'honey'),
      place('honey-b#0', 'honey'),
      place('dragon#0', 'dragon'),
      place('nuclear#0', 'nuclear'),
      place('nuclear#1', 'nuclear'),
    ];
    const out = recommendedOrder(input).map((p) => p.id);
    // Curator order = CURATOR_ENUM [nuclear, dragon, honey]; nth of each in turn.
    expect(out).toEqual([
      'nuclear#0', // round 0: nuclear, dragon, honey
      'dragon#0',
      'honey-a#0',
      'nuclear#1', // round 1: nuclear (dragon drained), honey
      'honey-a#1',
      'honey-b#0', // round 2: honey only
    ]);
  });

  it("top of the list has one place per present curator (each curator's lead)", () => {
    const input = [
      place('honey#0', 'honey'),
      place('honey#1', 'honey'),
      place('dragon#0', 'dragon'),
      place('nuclear#0', 'nuclear'),
    ];
    const top3 = recommendedOrder(input).slice(0, 3).map((p) => p.curator);
    expect(new Set(top3)).toEqual(new Set(['nuclear', 'dragon', 'honey']));
  });

  it('preserves within-curator authoring order', () => {
    const input = [
      place('honey#0', 'honey'),
      place('honey#1', 'honey'),
      place('honey#2', 'honey'),
    ];
    // Single curator → round-robin is a no-op; order unchanged.
    expect(recommendedOrder(input).map((p) => p.id)).toEqual(['honey#0', 'honey#1', 'honey#2']);
  });

  it('is immutable (does not mutate input) and preserves length', () => {
    const input = [place('nuclear#0', 'nuclear'), place('honey#0', 'honey')];
    const snapshot = input.map((p) => p.id);
    const out = recommendedOrder(input);
    expect(out).not.toBe(input);
    expect(input.map((p) => p.id)).toEqual(snapshot);
    expect(out).toHaveLength(input.length);
  });

  it('places without a curator sort into a trailing group', () => {
    const input = [place('none#0', undefined), place('nuclear#0', 'nuclear')];
    const out = recommendedOrder(input).map((p) => p.id);
    expect(out[0]).toBe('nuclear#0');
    expect(out).toContain('none#0');
    expect(out).toHaveLength(2);
  });
});
