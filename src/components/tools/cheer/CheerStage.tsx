'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { CheerSettings } from '@/lib/cheer';
import { CheerDisplay } from './CheerDisplay';

interface CheerStageProps {
  settings: CheerSettings;
  onClose: () => void;
  enterFullscreen: (element: HTMLElement) => Promise<void>;
  isFullscreenSupported: boolean;
}

/**
 * Immersive full-viewport presentation overlay.
 *
 * Fills the real viewport (dvw/dvh) so it adapts to the device orientation with
 * NO manual rotation — turn the phone and the banner just reflows to fill.
 * On devices that support the Fullscreen API it also enters real fullscreen
 * (hides the browser chrome); on iOS Safari (no element fullscreen) the fixed
 * overlay alone still covers the whole screen.
 */
export function CheerStage({
  settings,
  onClose,
  enterFullscreen,
  isFullscreenSupported,
}: CheerStageProps) {
  const t = useTranslations('tools.cheer');
  const overlayRef = useRef<HTMLDivElement>(null);
  // Latest onClose without re-running the mount effect
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Enter native fullscreen once mounted (best-effort) + lock body scroll.
  useEffect(() => {
    const el = overlayRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (isFullscreenSupported && el) {
      void enterFullscreen(el);
    }

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreenSupported, enterFullscreen]);

  // Esc key (non-fullscreen path) + native fullscreen exit → close.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    const handleFsChange = () => {
      // User exited native fullscreen (Esc / gesture) while overlay is open.
      if (!document.fullscreenElement) onCloseRef.current();
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      data-testid="cheer-stage"
      className="fixed left-0 top-0 z-[100] flex h-[100dvh] w-[100dvw] items-center justify-center bg-black"
    >
      <CheerDisplay settings={settings} variant="stage" />
      <button
        type="button"
        onClick={() => onCloseRef.current()}
        aria-label={t('stage.close')}
        className="
          absolute right-4 top-4 z-10
          flex h-11 w-11 items-center justify-center rounded-full
          bg-black/50 text-white backdrop-blur-sm
          hover:bg-black/70
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
          transition-colors
        "
      >
        <X size={22} />
      </button>
    </div>
  );
}
