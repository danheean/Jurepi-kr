/**
 * Convert a canvas element to a PNG Blob.
 * Uses canvas.toBlob with PNG mime type.
 * Fallback: if toBlob is not supported, uses dataURL conversion.
 */
export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Try canvas.toBlob first (preferred, more efficient)
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // toBlob callback with null blob (rare error)
            reject(new Error('Canvas toBlob returned null'));
          }
        },
        'image/png',
      );
    } else {
      // Fallback: use dataURL
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const blob = dataUrlToBlob(dataUrl);
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    }
  });
}

/**
 * Convert a data URL to a Blob (fallback for old browsers).
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const header = parts[0];
  const data = parts[1];

  // Extract mime type from header (e.g., "data:image/png;base64" -> "image/png")
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

  // Decode base64
  const bstr = atob(data);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mimeType });
}
