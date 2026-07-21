'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';
import { BallDisplay } from './BallDisplay';
import { formatGamesPlaintext } from '@/lib/lotto-generator/format';
import { NUMBERS_PER_GAME } from '@/lib/lotto-generator/schema';
import type { Game } from '@/lib/lotto-generator/schema';
import type { AnimationPhase } from './useLottoGenerator';

interface GameListProps {
  games: Game[];
  animationPhase: AnimationPhase;
}

export function GameList({ games, animationPhase }: GameListProps) {
  const t = useTranslations('tools.lotto-generator');
  const [copied, setCopied] = useState(false);

  const handleCopyAll = useCallback(async () => {
    if (games.length === 0) return;

    const plaintext = formatGamesPlaintext(games, (i) =>
      t('results.gameLabel', { count: i + 1 })
    );

    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback to textarea copy
      const textarea = document.createElement('textarea');
      textarea.value = plaintext;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [games, t]);

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">{t('results.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('results.title')}</h2>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors"
          aria-label={copied ? t('buttons.copied') : t('buttons.copyAll')}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm">{t('buttons.copied')}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm">{t('buttons.copyAll')}</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {games.map((game, gameIdx) => (
          <div key={gameIdx} className="p-4 rounded-lg bg-surface-sunken border border-hairline">
            <h3 className="text-sm font-medium mb-3 text-text">
              {t('results.gameLabel', { count: gameIdx + 1 })}
            </h3>
            {/* Official format: 추첨번호 (6 balls) + 보너스번호 (1 ball) */}
            <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-2">
                  {game.numbers.map((num, ballIdx) => (
                    <BallDisplay
                      key={`${gameIdx}-${ballIdx}`}
                      number={num}
                      index={ballIdx}
                      isAnimating={animationPhase !== 'idle' && animationPhase !== 'done'}
                      animationPhase={animationPhase}
                      label={t('results.numberAria', { n: num })}
                    />
                  ))}
                </div>
                <span className="text-center text-xs font-medium text-text-muted">
                  {t('results.mainLabel')}
                </span>
              </div>

              <span
                aria-hidden="true"
                className="flex h-11 items-center text-xl font-bold text-text-muted"
              >
                +
              </span>

              <div className="flex flex-col items-center gap-1.5">
                <BallDisplay
                  number={game.bonus}
                  index={NUMBERS_PER_GAME}
                  isAnimating={animationPhase !== 'idle' && animationPhase !== 'done'}
                  animationPhase={animationPhase}
                  label={t('results.bonusAria', { n: game.bonus })}
                />
                <span className="text-center text-xs font-medium text-text-muted">
                  {t('results.bonusLabel')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
