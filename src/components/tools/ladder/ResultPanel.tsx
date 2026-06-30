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

interface ResultPanelProps {
  ladder: UseLadderReturn;
}

export function ResultPanel({ ladder }: ResultPanelProps) {
  const t = useTranslations('tools.ladder');
  const [showToast, setShowToast] = useState(false);

  // Action panel (reveal-all / reshuffle / reset) is available as soon as a ladder
  // is built — and stays available after "다시 섞기" clears reveals. Only setup hides it.
  if (ladder.state.phase === 'setup') return null;

  // Download is available only in "done" phase (all results revealed).
  const canDownload = ladder.state.phase === 'done';

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

      // Build player names in starting order
      const playerNames = ladder.state.players.map((p, idx) =>
        p.name || t('defaults.player', { n: idx + 1 })
      );

      // Build prize labels in slot order
      const prizeLabels = Array.from(
        { length: ladder.state.playerCount },
        (_, col) => {
          const idx = ladder.state.prizeOrder[col] ?? col;
          const pr = ladder.state.prizes[idx];
          return pr?.label || t('defaults.prizeOther');
        }
      );

      // Build SVG and download
      const svgString = buildResultSvgString({
        playerCount: ladder.state.playerCount,
        rungs: ladder.state.rungs,
        rows,
        playerNames,
        prizeLabels,
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
          <h3 className="text-card-title text-text mb-3">
            {t('panel.summaryTitle')}
          </h3>
          <div className="space-y-2">
            {ladder.state.players.map((player, idx) => {
              const prizeId = mapping[player.id];
              const prize = ladder.state.prizes.find(
                (p) => p.id === prizeId
              );

              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2 font-body text-text"
                >
                  <span className="flex-1">
                    {player.name || t('defaults.player', { n: idx + 1 })}
                  </span>
                  <span className="text-text-secondary">→</span>
                  <span className="text-button">
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
