'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { selectMapping } from '@/lib/ladder-reducer';
import { buildResultSvgString, ACCENT_HEX } from '@/lib/result-image';
import { downloadResultImage } from './downloadResultImage';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Toast } from '@/components/ui/Toast';
import type { UseLadderReturn } from './useLadder';

const ACCENT_COLORS = [
  'coral',
  'mint',
  'sky',
  'sun',
  'grape',
  'rose',
];

interface ResultPanelProps {
  ladder: UseLadderReturn;
}

export function ResultPanel({ ladder }: ResultPanelProps) {
  const t = useTranslations('tools.ladder');
  const [showToast, setShowToast] = useState(false);

  // Action panel (reveal-all / reshuffle / reset) is available as soon as a ladder
  // is built — and stays available after "다시 섞기" clears reveals. Only setup hides it.
  if (ladder.state.phase === 'setup') return null;

  // Download is gated so hidden results can't leak before any reveal.
  const canDownload =
    ladder.state.revealed.length > 0 || !ladder.state.hideResults;

  const mapping = selectMapping(ladder.state);

  const handleDownload = async () => {
    try {
      // Build rows for SVG
      const rows = ladder.state.players.map((player, idx) => {
        const prizeId = mapping[player.id];
        const prize = ladder.state.prizes.find((p) => p.id === prizeId);
        return {
          name: player.name || t('defaults.player', { n: idx + 1 }),
          label: prize?.label || t('defaults.prizeOther'),
          accentHex: ACCENT_HEX[idx % ACCENT_HEX.length],
        };
      });

      // Build SVG and download
      const svgString = buildResultSvgString({
        playerCount: ladder.state.playerCount,
        rungs: ladder.state.rungs,
        rows,
        title: t('panel.summaryTitle'),
      });

      await downloadResultImage(svgString, 'jurepi-ladder-result.png');
      setShowToast(true);
    } catch (error) {
      // Log error but don't crash; user can retry
      console.error('Download failed:', error);
    }
  };

  const handleRevealAll = () => {
    if (ladder.state.phase !== 'done') {
      ladder.revealAll();
    }
  };

  return (
    <div className="space-y-4 p-4" role="region" aria-live="polite">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="secondary"
          onClick={handleRevealAll}
          disabled={ladder.state.phase === 'done'}
        >
          {t('panel.revealAll')}
        </Button>

        <Button variant="secondary" onClick={ladder.reshuffle}>
          {t('panel.reshuffle')}
        </Button>

        <Button variant="secondary" onClick={ladder.reset}>
          {t('panel.reset')}
        </Button>

        {canDownload && (
          <Button
            variant="secondary"
            onClick={handleDownload}
            data-testid="download-btn"
            aria-label={t('panel.download')}
          >
            {t('panel.download')}
          </Button>
        )}
      </div>

      {/* Sound toggle */}
      <div className="py-2">
        <Toggle
          checked={ladder.state.soundOn}
          onChange={ladder.toggleSound}
          label={ladder.state.soundOn ? t('panel.soundOn') : t('panel.soundOff')}
        />
      </div>

      {/* Summary (phase = done) */}
      {ladder.state.phase === 'done' && (
        <div className="bg-surface-muted rounded-lg p-4" data-testid="result-summary">
          <h3 className="font-card-title text-text mb-3">
            {t('panel.summaryTitle')}
          </h3>
          <div className="space-y-2">
            {ladder.state.players.map((player, idx) => {
              const prizeId = mapping[player.id];
              const prize = ladder.state.prizes.find(
                (p) => p.id === prizeId
              );
              const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];

              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2 font-body text-text"
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-accent-${accentColor}`}
                  />
                  <span className="flex-1">
                    {player.name || t('defaults.player', { n: idx + 1 })}
                  </span>
                  <span className="text-text-secondary">→</span>
                  <span className="font-button">
                    {prize?.label || t('defaults.prizeOther')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Toast
        message={t('panel.downloaded')}
        type="success"
        duration={2000}
        open={showToast}
        onDismiss={() => setShowToast(false)}
      />
    </div>
  );
}
