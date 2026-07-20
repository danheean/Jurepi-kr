'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PRESET_PHRASES, getPresetsByCategory, type PresetPhrase } from '@/lib/cheer';

interface CheerPresetsProps {
  onApply: (presetId: string) => void;
}

type Situation = 'concert' | 'sports' | 'birthday' | 'event';

const SITUATIONS: Situation[] = ['concert', 'sports', 'birthday', 'event'];

/**
 * Situation tabs + preset phrase chips.
 */
export function CheerPresets({ onApply }: CheerPresetsProps) {
  const t = useTranslations('tools.cheer');
  const [activeTab, setActiveTab] = useState<Situation>('concert');

  const activePresets = getPresetsByCategory(activeTab);

  return (
    <div className="flex flex-col gap-4">
      {/* Situation Tabs (roving tabindex) */}
      <div className="flex gap-2 border-b border-hairline">
        {SITUATIONS.map((situation, idx) => (
          <button
            key={situation}
            onClick={() => setActiveTab(situation)}
            className={`
              px-4 py-2 font-medium text-sm
              border-b-2 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-t
              ${
                activeTab === situation
                  ? 'border-brand text-brand'
                  : 'border-transparent text-text-muted hover:text-text'
              }
            `}
            aria-selected={activeTab === situation}
            tabIndex={activeTab === situation ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const idx = SITUATIONS.indexOf(activeTab);
                const next =
                  e.key === 'ArrowLeft'
                    ? SITUATIONS[(idx - 1 + SITUATIONS.length) % SITUATIONS.length]
                    : SITUATIONS[(idx + 1) % SITUATIONS.length];
                setActiveTab(next);
              }
            }}
          >
            {t(`presets.tabs.${situation}`)}
          </button>
        ))}
      </div>

      {/* Preset Chips */}
      <div className="flex flex-wrap gap-2">
        {activePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() =>
              onApply(t(`presets.phrases.${preset.situation}.${preset.id}`))
            }
            className="
              px-3 py-1.5 text-sm font-medium
              bg-brand text-on-brand rounded-full
              hover:bg-brand-strong
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
              transition-colors
            "
          >
            {t(`presets.phrases.${preset.situation}.${preset.id}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
