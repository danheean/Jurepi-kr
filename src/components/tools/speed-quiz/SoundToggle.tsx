'use client';

import { useTranslations } from 'next-intl';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  soundOn: boolean;
  onToggle: () => void;
}

/**
 * Speaker icon button to toggle sound on/off.
 */
export function SoundToggle({ soundOn, onToggle }: SoundToggleProps) {
  const t = useTranslations('tools.speed-quiz');

  return (
    <button
      onClick={onToggle}
      aria-pressed={soundOn}
      aria-label={soundOn ? t('sound.unmute') : t('sound.mute')}
      className="p-3 hover:bg-surface-muted rounded-lg transition-colors"
      data-testid="sound-toggle"
    >
      {soundOn ? (
        <Volume2 size={20} className="text-text" />
      ) : (
        <VolumeX size={20} className="text-text-secondary" />
      )}
    </button>
  );
}
