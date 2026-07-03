import { useEffect, useState } from 'react';
import type { RGB } from '@/lib/transparent-background';

interface EyedropperCursorProps {
  isActive: boolean;
  imageCanvas?: HTMLCanvasElement;
  onColorSampled: (rgb: RGB) => void;
  onCancel: () => void;
}

export function EyedropperCursor({
  isActive,
  imageCanvas,
  onColorSampled,
  onCancel,
}: EyedropperCursorProps) {
  const [hoveredColor, setHoveredColor] = useState<RGB | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isActive || !imageCanvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = imageCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x < rect.width && y >= 0 && y < rect.height) {
        setMousePos({ x, y });

        const ctx = imageCanvas.getContext('2d');
        if (ctx) {
          // Scale coordinates to canvas resolution
          const scaleX = imageCanvas.width / rect.width;
          const scaleY = imageCanvas.height / rect.height;
          const canvasX = Math.floor(x * scaleX);
          const canvasY = Math.floor(y * scaleY);

          const imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
          const data = imageData.data;
          setHoveredColor({
            r: data[0],
            g: data[1],
            b: data[2],
          });
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (hoveredColor) {
        onColorSampled(hoveredColor);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isActive, imageCanvas, hoveredColor, onColorSampled, onCancel]);

  if (!isActive || !mousePos || !hoveredColor) {
    return null;
  }

  return (
    <>
      {/* Global crosshair cursor */}
      <div
        className="pointer-events-none fixed z-50"
        style={{
          cursor: 'crosshair',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
        }}
      />

      {/* Color preview circle at cursor */}
      <div
        className="pointer-events-none fixed z-50 rounded-full border-2 border-white shadow-lg"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          width: '24px',
          height: '24px',
          backgroundColor: `rgb(${hoveredColor.r}, ${hoveredColor.g}, ${hoveredColor.b})`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  );
}
