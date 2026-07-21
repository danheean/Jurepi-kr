'use client';

import { useTranslations } from 'next-intl';
import { CheerSettings, isLowContrast, SWATCH_COLORS } from '@/lib/cheer';
import { Maximize2, Zap } from 'lucide-react';

interface CheerControlsProps {
  settings: CheerSettings;
  onSettingsChange: (updates: Partial<CheerSettings>) => void;
  isWakeLockSupported: boolean;
  isWakeLocked: boolean;
  onEnterFullscreen: () => void;
  onToggleWakeLock: () => Promise<void>;
}

type Effect = 'static' | 'scroll' | 'flash' | 'neon';
type Speed = 'slow' | 'medium' | 'fast';
type Size = 'S' | 'M' | 'L' | 'XL';
type ColorId = 'white' | 'black' | 'coral' | 'sun' | 'sky' | 'grape' | 'rose';

const EFFECTS: Effect[] = ['static', 'scroll', 'flash', 'neon'];
const SPEEDS: Speed[] = ['slow', 'medium', 'fast'];
const SIZES: Size[] = ['S', 'M', 'L', 'XL'];
const COLORS: ColorId[] = ['white', 'black', 'coral', 'sun', 'sky', 'grape', 'rose'];

// Swatch backgrounds come from the shared token map (single source of truth), so
// the color you pick is exactly the color the banner renders. Do not hard-code
// hex here — it drifts from tokens.css (e.g. grape is honey #e0912b, not purple).

/**
 * Effect, speed, color, size, fullscreen, keep-awake controls.
 */
export function CheerControls({
  settings,
  onSettingsChange,
  isWakeLockSupported,
  isWakeLocked,
  onEnterFullscreen,
  onToggleWakeLock,
}: CheerControlsProps) {
  const t = useTranslations('tools.cheer');

  const lowContrast = isLowContrast(settings.textColor, settings.bgColor);
  const speedDisabled = settings.effect === 'static' || settings.effect === 'neon';

  return (
    <div className="flex flex-col gap-6">
      {/* Effect Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('controls.effectLabel')}
        </label>
        <div role="group" aria-label={t('controls.effectLabel')} className="flex gap-2 flex-wrap">
          {EFFECTS.map((effect) => (
            <button
              key={effect}
              onClick={() => onSettingsChange({ effect })}
              aria-pressed={settings.effect === effect}
              className={`
                px-3 min-h-11 inline-flex items-center justify-center text-sm font-medium rounded
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                transition-colors
                ${
                  settings.effect === effect
                    ? 'bg-brand text-on-brand'
                    : 'bg-surface-muted text-text hover:bg-surface-sunken'
                }
              `}
            >
              {t(`controls.effect.${effect}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Speed Selector */}
      {!speedDisabled && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('controls.speedLabel')}
          </label>
          <div role="group" aria-label={t('controls.speedLabel')} className="flex gap-2 flex-wrap">
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                onClick={() => onSettingsChange({ speed })}
                aria-pressed={settings.speed === speed}
                className={`
                  px-3 min-h-11 inline-flex items-center justify-center text-sm font-medium rounded
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                  transition-colors
                  ${
                    settings.speed === speed
                      ? 'bg-brand text-on-brand'
                      : 'bg-surface-muted text-text hover:bg-surface-sunken'
                  }
                `}
              >
                {t(`controls.speed.${speed}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Color Swatches */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('controls.textColorLabel')}
        </label>
        <div role="group" aria-label={t('controls.textColorLabel')} className="flex gap-2 flex-wrap">
          {COLORS.map((color) => {
            const name = `${t('controls.textColorLabel')} · ${t(`controls.colors.${color}`)}`;
            return (
              <button
                key={color}
                onClick={() => onSettingsChange({ textColor: color })}
                aria-pressed={settings.textColor === color}
                aria-label={name}
                title={t(`controls.colors.${color}`)}
                className={`
                  w-11 h-11 rounded-full border-2
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                  transition-all
                  ${
                    settings.textColor === color
                      ? 'border-brand ring-2 ring-brand ring-offset-2'
                      : 'border-hairline hover:border-brand'
                  }
                `}
                style={{ backgroundColor: SWATCH_COLORS[color] }}
              />
            );
          })}
        </div>
      </div>

      {/* Background Color Swatches */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('controls.bgColorLabel')}
        </label>
        <div role="group" aria-label={t('controls.bgColorLabel')} className="flex gap-2 flex-wrap">
          {COLORS.map((color) => {
            const name = `${t('controls.bgColorLabel')} · ${t(`controls.colors.${color}`)}`;
            return (
              <button
                key={color}
                onClick={() => onSettingsChange({ bgColor: color })}
                aria-pressed={settings.bgColor === color}
                aria-label={name}
                title={t(`controls.colors.${color}`)}
                className={`
                  w-11 h-11 rounded-full border-2
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                  transition-all
                  ${
                    settings.bgColor === color
                      ? 'border-brand ring-2 ring-brand ring-offset-2'
                      : 'border-hairline hover:border-brand'
                  }
                `}
                style={{ backgroundColor: SWATCH_COLORS[color] }}
              />
            );
          })}
        </div>
      </div>

      {/* Low Contrast Warning — announced to AT (the banner can become invisible,
          so a purely visual warning would be missed by non-sighted users). */}
      {lowContrast && (
        <div role="status" className="px-3 py-2 bg-danger/10 text-danger-ink rounded text-sm">
          ⚠️ {t('controls.lowContrastWarning')}
        </div>
      )}

      {/* Size Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('controls.sizeLabel')}
        </label>
        <div role="group" aria-label={t('controls.sizeLabel')} className="flex gap-2 flex-wrap">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onSettingsChange({ size })}
              aria-pressed={settings.size === size}
              className={`
                px-3 min-h-11 inline-flex items-center justify-center text-sm font-medium rounded
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                transition-colors
                ${
                  settings.size === size
                    ? 'bg-brand text-on-brand'
                    : 'bg-surface-muted text-text hover:bg-surface-sunken'
                }
              `}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen Button — immersive overlay works everywhere (incl. iOS) */}
      <button
        onClick={onEnterFullscreen}
        className="
          px-4 min-h-11 font-medium rounded
          bg-brand text-on-brand
          hover:bg-brand-strong
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
          transition-colors
          flex items-center gap-2 justify-center
        "
      >
        <Maximize2 size={18} />
        {t('controls.fullscreenLabel')}
      </button>

      {/* Keep-awake Toggle */}
      {isWakeLockSupported && (
        <button
          onClick={onToggleWakeLock}
          aria-pressed={isWakeLocked}
          className={`
            px-4 min-h-11 font-medium rounded
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
            transition-colors
            flex items-center gap-2 justify-center
            ${
              isWakeLocked
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted text-text hover:bg-surface-sunken'
            }
          `}
        >
          <Zap size={18} />
          {t('controls.keepAwakeLabel')}
        </button>
      )}
    </div>
  );
}
