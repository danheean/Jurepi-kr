import { describe, it, expect } from 'vitest';
import { decodeSmart } from './encoder';
import { parseDataUrl } from './base64';

// 1x1 transparent PNG.
const PNG_1x1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('parseDataUrl', () => {
  it('splits a base64 data URL into mime + data', () => {
    const { mime, data } = parseDataUrl(`data:image/png;base64,${PNG_1x1}`);
    expect(mime).toBe('image/png');
    expect(data).toBe(PNG_1x1);
  });

  it('returns the input unchanged when there is no data URL prefix', () => {
    const { mime, data } = parseDataUrl('SGVsbG8=');
    expect(mime).toBeNull();
    expect(data).toBe('SGVsbG8=');
  });
});

describe('decodeSmart', () => {
  it('decodes plain text base64 to a text result', () => {
    const result = decodeSmart('SGVsbG8sIHdvcmxkIQ==', 'standard');
    expect(result).toMatchObject({ ok: true, kind: 'text', plaintext: 'Hello, world!' });
  });

  it('detects an image from raw PNG base64 (no data-URL prefix)', () => {
    const result = decodeSmart(PNG_1x1, 'standard');
    expect(result.ok).toBe(true);
    if (result.ok && result.kind === 'image') {
      expect(result.mimeType).toBe('image/png');
      expect(result.dataUri.startsWith('data:image/png;base64,')).toBe(true);
      expect(result.sizeBytes).toBeGreaterThan(0);
    } else {
      throw new Error('expected an image result');
    }
  });

  it('accepts a full image data-URL as input', () => {
    const result = decodeSmart(`data:image/png;base64,${PNG_1x1}`, 'standard');
    expect(result).toMatchObject({ ok: true, kind: 'image', mimeType: 'image/png' });
  });

  it('produces a browser-valid standard data URI even for URL-safe input', () => {
    const result = decodeSmart(PNG_1x1, 'urlSafe');
    expect(result.ok).toBe(true);
    if (result.ok && result.kind === 'image') {
      // Standard alphabet only in the body (no - or _).
      const body = result.dataUri.split(',')[1];
      expect(/[-_]/.test(body)).toBe(false);
    }
  });

  it('returns an invalidBase64 error for malformed input', () => {
    const result = decodeSmart('not valid base64 @@@', 'standard');
    expect(result).toMatchObject({ ok: false, error: { code: 'invalidBase64' } });
  });

  it('returns a notUtf8 error for non-image binary that is not valid UTF-8', () => {
    // "//79" decodes to bytes 0xFF 0xFE 0xFD — not an image, not valid UTF-8.
    const result = decodeSmart('//79', 'standard');
    expect(result).toMatchObject({ ok: false, error: { code: 'notUtf8' } });
  });

  it('returns an invalidBase64 error for empty input', () => {
    const result = decodeSmart('   ', 'standard');
    expect(result).toMatchObject({ ok: false, error: { code: 'invalidBase64' } });
  });
});
