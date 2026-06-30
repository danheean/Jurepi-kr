/**
 * Browser utility to rasterize SVG to PNG and trigger download.
 * Client-side only; guards against non-browser environments.
 */

export async function downloadResultImage(
  svgString: string,
  filename: string
): Promise<void> {
  // Guard against non-browser environments
  if (typeof document === 'undefined') {
    throw new Error('downloadResultImage requires browser environment');
  }

  try {
    // Create data URL from SVG string
    const dataUrl =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

    // Create an image element and wait for it to load
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        resolve();
      };
      img.onerror = () => {
        reject(new Error('Failed to load SVG image'));
      };
      img.src = dataUrl;
    });

    // Parse SVG dimensions from string or use natural dimensions
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    // Fallback to parsing SVG if naturalDimensions are 0
    if (!width || !height) {
      const svgMatch = svgString.match(/width="(\d+)"/);
      const heightMatch = svgString.match(/height="(\d+)"/);
      width = svgMatch ? parseInt(svgMatch[1], 10) : 600;
      height = heightMatch ? parseInt(heightMatch[1], 10) : 400;
    }

    // Create canvas and draw image onto it
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw image onto canvas
    ctx.drawImage(img, 0, 0);

    // Convert canvas to blob and trigger download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create blob from canvas');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Unknown error during image download');
  }
}
