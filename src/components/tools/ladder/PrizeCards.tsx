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

interface PrizeCardsProps {
  ladder: UseLadderReturn;
}

export function PrizeCards({ ladder }: PrizeCardsProps) {
  const t = useTranslations('tools.ladder');

  if (ladder.state.phase === 'setup') return null;

  return (
    <div
      className="flex justify-center gap-2 flex-wrap mb-6 p-4"
      role="region"
      aria-label="Prize cards"
    >
      {ladder.state.prizes.map((prize, idx) => {
        const isRevealed = ladder.isRevealed(ladder.state.players[idx].id);
        const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];

        return (
          <div
            key={prize.id}
            className={`
              w-14 h-14 rounded-md font-button text-center
              flex items-center justify-center
              transition-all duration-300
              ${
                isRevealed && !ladder.prefers_reduced_motion
                  ? 'perspective'
                  : ''
              }
              ${
                ladder.state.hideResults && !isRevealed
                  ? `bg-surface-muted text-text-muted`
                  : `bg-accent-${accentColor}-soft text-text`
              }
            `}
            style={{
              transform: isRevealed && !ladder.prefers_reduced_motion
                ? 'rotateY(0deg)'
                : 'rotateY(90deg)',
              transformStyle: 'preserve-3d',
              transition: 'transform 300ms ease-out',
            }}
          >
            {ladder.state.hideResults && !isRevealed ? (
              <span className="font-headline text-text-muted text-lg">?</span>
            ) : (
              prize.label || t('defaults.prizeOther')
            )}
          </div>
        );
      })}
    </div>
  );
}
