'use client';

import { useTranslations } from 'next-intl';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CheerSettings, SIZE_SCALE } from '@/lib/cheer';

interface CheerDisplayProps {
  settings: CheerSettings;
  /**
   * 'inline' → aspect-video preview card in the page grid.
   * 'stage'  → fills its parent (the immersive overlay) 100%, no rounding.
   */
  variant?: 'inline' | 'stage';
}

/**
 * Large banner display with live effect rendering.
 * Respects reduced-motion for scroll/flash effects.
 * Orientation is never rotated here — the immersive overlay simply fills the
 * viewport (dvw/dvh) and adapts to the real device orientation.
 */
export function CheerDisplay({ settings, variant = 'inline' }: CheerDisplayProps) {
  const t = useTranslations('tools.cheer');
  const prefersReducedMotion = useReducedMotion();

  const isEmpty = !settings.text.trim();
  const displayText = isEmpty ? t('display.placeholder') : settings.text;

  // Map color swatch IDs to CSS classes
  const textColorClass = {
    white: 'text-white',
    black: 'text-black',
    coral: 'text-accent-coral',
    sun: 'text-accent-sun',
    sky: 'text-accent-sky',
    grape: 'text-accent-grape',
    rose: 'text-accent-rose',
  }[settings.textColor] || 'text-white';

  const bgColorClass = {
    white: 'bg-white',
    black: 'bg-black',
    coral: 'bg-accent-coral',
    sun: 'bg-accent-sun',
    sky: 'bg-accent-sky',
    grape: 'bg-accent-grape',
    rose: 'bg-accent-rose',
  }[settings.bgColor] || 'bg-black';

  // Font size scale (responsive clamp)
  const sizeClass = {
    S: "text-[clamp(2rem,10vw,4rem)]",
    M: "text-[clamp(3rem,14vw,6rem)]",
    L: "text-[clamp(4rem,20vw,9rem)]",
    XL: "text-[clamp(5rem,28vw,14rem)]",
  }[settings.size] || "text-[clamp(4rem,20vw,9rem)]";

  // Effect-specific rendering
  let effectContent: React.ReactNode;

  if (isEmpty) {
    // Empty state: muted, static hint (never a giant scrolling placeholder)
    effectContent = (
      <div className="flex items-center justify-center w-full h-full px-6 text-center text-lg sm:text-2xl font-display opacity-50 break-words">
        {displayText}
      </div>
    );
  } else if (prefersReducedMotion || settings.effect === 'static') {
    // Static banner (no animation)
    effectContent = (
      <div className={`flex items-center justify-center w-full h-full ${sizeClass} font-bold font-display break-words`}>
        {displayText}
      </div>
    );
  } else if (settings.effect === 'scroll') {
    // Scrolling marquee (transform-only animation)
    effectContent = (
      <div className="w-full min-w-0 h-full overflow-hidden flex items-center">
        <style>{`
          @keyframes cheer-scroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .cheer-scroll {
            animation: cheer-scroll ${settings.speed === 'slow' ? '12s' : settings.speed === 'medium' ? '8s' : '4s'} linear infinite;
            white-space: nowrap;
            display: inline-block;
            padding-right: 100%;
          }
        `}</style>
        <span className={`cheer-scroll ${sizeClass} font-bold font-display`}>
          {displayText}
        </span>
      </div>
    );
  } else if (settings.effect === 'flash') {
    // Flashing effect (opacity animation)
    effectContent = (
      <div className="w-full min-w-0 h-full overflow-hidden flex items-center justify-center">
        <style>{`
          @keyframes cheer-flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.15; }
          }
          .cheer-flash {
            animation: cheer-flash ${settings.speed === 'slow' ? '1.2s' : settings.speed === 'medium' ? '700ms' : '350ms'} infinite;
          }
        `}</style>
        <div className={`cheer-flash ${sizeClass} font-bold font-display break-words text-center px-4`}>
          {displayText}
        </div>
      </div>
    );
  } else if (settings.effect === 'neon') {
    // Neon glow effect (text-shadow, no motion)
    const glowColor = {
      white: 'rgba(255, 255, 255, 0.8)',
      black: 'rgba(0, 0, 0, 0.3)',
      coral: 'rgba(251, 113, 133, 0.6)',
      sun: 'rgba(245, 166, 35, 0.6)',
      sky: 'rgba(59, 130, 246, 0.6)',
      grape: 'rgba(224, 145, 43, 0.6)',
      rose: 'rgba(251, 113, 133, 0.6)',
    }[settings.textColor] || 'rgba(255, 255, 255, 0.8)';

    effectContent = (
      <div
        className={`flex items-center justify-center w-full h-full ${sizeClass} font-bold font-display break-words px-4`}
        style={{
          textShadow: `
            0 0 10px ${glowColor},
            0 0 20px ${glowColor},
            0 0 30px ${glowColor},
            0 0 40px ${glowColor}
          `,
        }}
      >
        {displayText}
      </div>
    );
  }

  const shapeClass =
    variant === 'stage'
      ? 'w-full h-full rounded-none'
      : 'w-full min-w-0 aspect-video rounded-lg';

  return (
    <div
      role="img"
      aria-label={t('display.ariaLabel', { text: displayText })}
      className={`
        ${shapeClass} overflow-hidden
        flex items-center justify-center
        ${bgColorClass} ${textColorClass}
      `}
    >
      {effectContent}
    </div>
  );
}
