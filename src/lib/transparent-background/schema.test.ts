import { describe, it, expect } from 'vitest';
import {
  DOWNSCALE_THRESHOLD_PX,
  CORNER_INSET_RATIO,
  TOLERANCE_MAX_DISTANCE,
  FEATHER_MAX_PX,
  CHUNK_SIZE,
  STORE_KEY,
  STORE_VERSION,
  rgbSchema,
  removalOptionsSchema,
  transparentBgStoreSchema,
} from './schema';

describe('schema.ts', () => {
  describe('constants', () => {
    it('exports DOWNSCALE_THRESHOLD_PX', () => {
      expect(DOWNSCALE_THRESHOLD_PX).toBe(4096);
    });

    it('exports CORNER_INSET_RATIO', () => {
      expect(CORNER_INSET_RATIO).toBe(0.05);
    });

    it('exports TOLERANCE_MAX_DISTANCE', () => {
      expect(TOLERANCE_MAX_DISTANCE).toBe(85);
    });

    it('exports FEATHER_MAX_PX', () => {
      expect(FEATHER_MAX_PX).toBe(20);
    });

    it('exports CHUNK_SIZE', () => {
      expect(CHUNK_SIZE).toBe(65536);
    });

    it('exports STORE_KEY', () => {
      expect(STORE_KEY).toBe('jurepi-transparent-background');
    });

    it('exports STORE_VERSION', () => {
      expect(STORE_VERSION).toBe(1);
    });
  });

  describe('rgbSchema', () => {
    it('accepts valid RGB', () => {
      const result = rgbSchema.safeParse({ r: 255, g: 128, b: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ r: 255, g: 128, b: 0 });
      }
    });

    it('rejects out-of-range values', () => {
      const result = rgbSchema.safeParse({ r: 256, g: 128, b: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer values', () => {
      const result = rgbSchema.safeParse({ r: 255.5, g: 128, b: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe('removalOptionsSchema', () => {
    it('accepts valid removal options', () => {
      const result = removalOptionsSchema.safeParse({
        bgColor: { r: 255, g: 255, b: 255 },
        tolerance: 50,
        feather: 2,
        mode: 'flood-fill',
      });
      expect(result.success).toBe(true);
    });

    it('accepts global mode', () => {
      const result = removalOptionsSchema.safeParse({
        bgColor: { r: 255, g: 255, b: 255 },
        tolerance: 50,
        feather: 2,
        mode: 'global',
      });
      expect(result.success).toBe(true);
    });

    it('rejects tolerance > 100', () => {
      const result = removalOptionsSchema.safeParse({
        bgColor: { r: 255, g: 255, b: 255 },
        tolerance: 101,
        feather: 2,
        mode: 'flood-fill',
      });
      expect(result.success).toBe(false);
    });

    it('rejects feather > FEATHER_MAX_PX', () => {
      const result = removalOptionsSchema.safeParse({
        bgColor: { r: 255, g: 255, b: 255 },
        tolerance: 50,
        feather: 21,
        mode: 'flood-fill',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('transparentBgStoreSchema', () => {
    it('accepts valid store data', () => {
      const result = transparentBgStoreSchema.safeParse({
        tolerance: 60,
        feather: 5,
        mode: 'global',
        lastBgColor: { r: 200, g: 200, b: 200 },
      });
      expect(result.success).toBe(true);
    });

    it('provides default values', () => {
      const result = transparentBgStoreSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tolerance).toBe(50);
        expect(result.data.feather).toBe(2);
        expect(result.data.mode).toBe('flood-fill');
      }
    });

    it('accepts store without lastBgColor', () => {
      const result = transparentBgStoreSchema.safeParse({
        tolerance: 40,
        feather: 1,
        mode: 'flood-fill',
      });
      expect(result.success).toBe(true);
    });
  });
});
