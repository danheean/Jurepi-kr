import { describe, it, expect } from 'vitest';
import {
  toneSpec,
  SOUND_TICK_HZ,
  SOUND_CHIME_HZ,
  SOUND_BUZZ_HZ,
} from './sound';

describe('sound — pure tone spec builders', () => {
  describe('toneSpec', () => {
    it('returns tick spec with correct frequency', () => {
      const spec = toneSpec('tick');
      expect(spec.freqHz).toBe(SOUND_TICK_HZ);
      expect(spec.freqHz).toBe(800);
    });

    it('returns chime spec with correct frequency', () => {
      const spec = toneSpec('chime');
      expect(spec.freqHz).toBe(SOUND_CHIME_HZ);
      expect(spec.freqHz).toBe(1200);
    });

    it('returns buzz spec with correct frequency', () => {
      const spec = toneSpec('buzz');
      expect(spec.freqHz).toBe(SOUND_BUZZ_HZ);
      expect(spec.freqHz).toBe(200);
    });

    it('tick spec has reasonable duration', () => {
      const spec = toneSpec('tick');
      expect(spec.durationMs).toBeGreaterThan(0);
      expect(spec.durationMs).toBeLessThan(500);
    });

    it('chime spec has reasonable duration', () => {
      const spec = toneSpec('chime');
      expect(spec.durationMs).toBeGreaterThan(0);
      expect(spec.durationMs).toBeLessThan(500);
    });

    it('buzz spec has reasonable duration', () => {
      const spec = toneSpec('buzz');
      expect(spec.durationMs).toBeGreaterThan(0);
      expect(spec.durationMs).toBeLessThan(500);
    });

    it('has type field', () => {
      const tickSpec = toneSpec('tick');
      const chimeSpec = toneSpec('chime');
      const buzzSpec = toneSpec('buzz');

      expect(tickSpec.type).toBeDefined();
      expect(chimeSpec.type).toBeDefined();
      expect(buzzSpec.type).toBeDefined();
    });

    it('tick is shorter than chime', () => {
      const tickSpec = toneSpec('tick');
      const chimeSpec = toneSpec('chime');
      expect(tickSpec.durationMs).toBeLessThan(chimeSpec.durationMs);
    });

    it('returns same spec for same kind', () => {
      const spec1 = toneSpec('tick');
      const spec2 = toneSpec('tick');
      expect(spec1.freqHz).toBe(spec2.freqHz);
      expect(spec1.durationMs).toBe(spec2.durationMs);
      expect(spec1.type).toBe(spec2.type);
    });

    it('different kinds return different specs', () => {
      const tick = toneSpec('tick');
      const chime = toneSpec('chime');
      const buzz = toneSpec('buzz');

      const specs = [tick, chime, buzz];
      const freqs = specs.map((s) => s.freqHz);
      expect(new Set(freqs).size).toBe(3); // All different
    });

    it('spec has all required fields', () => {
      const spec = toneSpec('tick');
      expect(spec).toHaveProperty('freqHz');
      expect(spec).toHaveProperty('durationMs');
      expect(spec).toHaveProperty('type');
    });

    it('freqHz is positive integer', () => {
      ['tick', 'chime', 'buzz'].forEach((kind) => {
        const spec = toneSpec(kind as any);
        expect(spec.freqHz).toBeGreaterThan(0);
        expect(Number.isInteger(spec.freqHz)).toBe(true);
      });
    });

    it('durationMs is positive integer', () => {
      ['tick', 'chime', 'buzz'].forEach((kind) => {
        const spec = toneSpec(kind as any);
        expect(spec.durationMs).toBeGreaterThan(0);
        expect(Number.isInteger(spec.durationMs)).toBe(true);
      });
    });

    it('type is string', () => {
      ['tick', 'chime', 'buzz'].forEach((kind) => {
        const spec = toneSpec(kind as any);
        expect(typeof spec.type).toBe('string');
      });
    });
  });

  describe('sound constants', () => {
    it('SOUND_TICK_HZ defined', () => {
      expect(SOUND_TICK_HZ).toBe(800);
    });

    it('SOUND_CHIME_HZ defined', () => {
      expect(SOUND_CHIME_HZ).toBe(1200);
    });

    it('SOUND_BUZZ_HZ defined', () => {
      expect(SOUND_BUZZ_HZ).toBe(200);
    });
  });
});
