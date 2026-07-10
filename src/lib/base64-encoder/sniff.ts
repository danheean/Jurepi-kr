/**
 * Image magic-byte sniffing.
 * Identifies raster image formats from their signature bytes (no filename or
 * data-URI prefix required), plus a conservative SVG document check.
 *
 * Pure — no DOM/framework imports. Used by `decodeSmart` to decide whether a
 * decoded Base64 payload should be shown as an image rather than as text.
 */

/** MIME types this module can detect. */
export const SNIFFABLE_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/x-icon',
  'image/svg+xml',
] as const;

export type SniffableImageMimeType =
  (typeof SNIFFABLE_IMAGE_MIME_TYPES)[number];

/** True if `bytes` starts with the given signature. */
function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

// Raster signatures (byte offset 0 unless noted).
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];
const GIF = [0x47, 0x49, 0x46, 0x38]; // "GIF8" (covers GIF87a/GIF89a)
const BMP = [0x42, 0x4d]; // "BM"
const ICO = [0x00, 0x00, 0x01, 0x00]; // icon (not cursor 0x02)
const RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP = [0x57, 0x45, 0x42, 0x50]; // "WEBP" at offset 8

/** SVG must open (optionally after XML decl / comment / doctype) with `<svg`. */
const SVG_HEAD_RE =
  /^\s*(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)?(?:<!DOCTYPE[^>]*>\s*)?<svg[\s/>]/i;

function looksLikeWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  if (!startsWith(bytes, RIFF)) return false;
  for (let i = 0; i < WEBP.length; i++) {
    if (bytes[8 + i] !== WEBP[i]) return false;
  }
  return true;
}

function looksLikeSvg(bytes: Uint8Array): boolean {
  // Cheap gate: an SVG document has an early '<'. Avoid decoding binary blobs.
  const head = bytes.subarray(0, 1024);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(head);
  return SVG_HEAD_RE.test(text);
}

/**
 * Detect an image MIME type from the leading bytes of a payload.
 * @returns a MIME type string, or `null` if the bytes are not a known image.
 */
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (startsWith(bytes, PNG)) return 'image/png';
  if (startsWith(bytes, JPEG)) return 'image/jpeg';
  if (startsWith(bytes, GIF)) return 'image/gif';
  if (looksLikeWebp(bytes)) return 'image/webp';
  if (startsWith(bytes, BMP)) return 'image/bmp';
  if (startsWith(bytes, ICO)) return 'image/x-icon';
  if (looksLikeSvg(bytes)) return 'image/svg+xml';
  return null;
}
