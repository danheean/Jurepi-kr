'use client';

import { useTranslations } from 'next-intl';
import type { UseLadderReturn } from './useLadder';

const ACCENT_COLORS = [
  'coral',
  'mint',
  'sky',
  'sun',
  'grape',
  'rose',
];

interface PlayerHeaderProps {
  ladder: UseLadderReturn;
}

export function PlayerHeader({ ladder }: PlayerHeaderProps) {
  const t = useTranslations('tools.ladder');

  if (ladder.state.phase === 'setup') return null;

  return (
    <div
      className="flex justify-center gap-2 flex-wrap mb-4 p-4"
      role="region"
      aria-label="Player selection"
    >
      {ladder.state.players.map((player, idx) => {
        const isRevealed = ladder.isRevealed(player.id);
        const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
        const canClick =
          ladder.canStartTrace() && ladder.state.phase !== 'done';

        return (
          <button
            key={player.id}
            data-testid="player-chip"
            onClick={() => {
              if (canClick && !isRevealed) {
                ladder.startTrace(player.id);
              }
            }}
            disabled={!canClick || isRevealed}
            aria-label={t('header.revealAria', {
              name: player.name || `${t('defaults.player', { n: idx + 1 })}`,
            })}
            className={`
              px-3 py-2 rounded-full font-button text-sm
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
              ${
                isRevealed
                  ? `bg-accent-${accentColor}-soft border-2 border-accent-${accentColor} text-text`
                  : `bg-accent-${accentColor}-soft text-text hover:shadow-card disabled:opacity-50`
              }
              ${canClick && !isRevealed ? 'cursor-pointer active:scale-95' : ''}
            `}
          >
            {player.name || `${t('defaults.player', { n: idx + 1 })}`}
            {isRevealed && ' ✓'}
          </button>
        );
      })}
    </div>
  );
}
