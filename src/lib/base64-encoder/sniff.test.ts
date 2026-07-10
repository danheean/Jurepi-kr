import { describe, it, expect } from 'vitest';
import { sniffImageMime } from './sniff';

/** Build a Uint8Array from a signature plus optional trailing padding. */
function bytesFrom(signature: number[], pad = 8): Uint8Array {
  return new Uint8Array([...signature, ...new Array(pad).fill(0)]);
}

describe('sniffImageMime — raster signatures', () => {
  it('detects PNG', () => {
    expect(sniffImageMime(bytesFrom([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'image/png',
    );
  });

  it('detects JPEG', () => {
    expect(sniffImageMime(bytesFrom([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
  });

  it('detects GIF87a and GIF89a', () => {
    expect(sniffImageMime(bytesFrom([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]))).toBe('image/gif');
    expect(sniffImageMime(bytesFrom([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe('image/gif');
  });

  it('detects WebP (RIFF....WEBP)', () => {
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(sniffImageMime(webp)).toBe('image/webp');
  });

  it('does not treat a non-WEBP RIFF (e.g. WAV) as an image', () => {
    const wav = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x41, 0x56, 0x45, // WAVE
    ]);
    expect(sniffImageMime(wav)).toBeNull();
  });

  it('detects BMP', () => {
    expect(sniffImageMime(bytesFrom([0x42, 0x4d]))).toBe('image/bmp');
  });

  it('detects ICO but not a cursor', () => {
    expect(sniffImageMime(bytesFrom([0x00, 0x00, 0x01, 0x00]))).toBe('image/x-icon');
    expect(sniffImageMime(bytesFrom([0x00, 0x00, 0x02, 0x00]))).toBeNull();
  });
});

describe('sniffImageMime — SVG', () => {
  const enc = new TextEncoder();

  it('detects a bare <svg> document', () => {
    expect(sniffImageMime(enc.encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe(
      'image/svg+xml',
    );
  });

  it('detects an SVG preceded by an XML declaration', () => {
    expect(
      sniffImageMime(enc.encode('<?xml version="1.0"?>\n<svg width="1" height="1"/>')),
    ).toBe('image/svg+xml');
  });

  it('does not treat arbitrary XML mentioning svg as SVG', () => {
    expect(sniffImageMime(enc.encode('<note>see svg later</note>'))).toBeNull();
  });
});

describe('sniffImageMime — negatives', () => {
  it('returns null for plain UTF-8 text', () => {
    expect(sniffImageMime(new TextEncoder().encode('Hello, world!'))).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(sniffImageMime(new Uint8Array([]))).toBeNull();
  });

  it('returns null for a signature that is too short to match', () => {
    // First two PNG bytes only — not enough to confirm PNG.
    expect(sniffImageMime(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});
