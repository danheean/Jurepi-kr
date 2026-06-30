'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Stepper } from '@/components/ui/Stepper';
import { TextInput } from '@/components/ui/TextInput';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { pickFruits } from '@/lib/name-suggestions';
import {
  winnerIndex,
  shuffledRanks,
  toRankEmoji,
} from '@/lib/result-suggestions';
import type { UseLadderReturn } from './useLadder';

const ACCENT_COLORS = [
  'coral',
  'mint',
  'sky',
  'sun',
  'grape',
  'rose',
];

interface LadderSetupProps {
  ladder: UseLadderReturn;
}

export function LadderSetup({ ladder }: LadderSetupProps) {
  const t = useTranslations('tools.ladder');
  const [autoNames, setAutoNames] = useState(false);

  // `ladder` is a fresh object every render (useReducer-backed hook), so depending
  // on it here would re-run this effect on every render and re-roll names forever.
  // Pull stable references and guard on a signature so we only fill when the mode is
  // newly enabled or the player count changes — never on unrelated re-renders.
  const playerCount = ladder.state.playerCount;
  const { setAllPlayerNames } = ladder;
  const lastFillSigRef = useRef<string | null>(null);

  useEffect(() => {
    if (!autoNames) {
      lastFillSigRef.current = null;
      return;
    }
    const sig = String(playerCount);
    if (lastFillSigRef.current === sig) return;
    lastFillSigRef.current = sig;
    const fruits = pickFruits(playerCount);
    setAllPlayerNames(fruits.map((f) => `${f.emoji} ${t(`fruits.${f.key}`)}`));
  }, [autoNames, playerCount, setAllPlayerNames, t]);

  const handleToggleAutoNames = () => {
    setAutoNames(!autoNames);
  };

  const handleRerollNames = () => {
    const fruits = pickFruits(ladder.state.playerCount);
    const names = fruits.map((f) => `${f.emoji} ${t(`fruits.${f.key}`)}`);
    ladder.setAllPlayerNames(names);
  };

  const handleResultWinner = () => {
    const winIdx = winnerIndex(ladder.state.playerCount);
    const labels = Array.from({ length: ladder.state.playerCount }, (_, i) =>
      i === winIdx ? t('defaults.prizeWin') : t('defaults.prizeOther')
    );
    ladder.setAllPrizeLabels(labels);
  };

  const handleResultRank = () => {
    const ranks = shuffledRanks(ladder.state.playerCount);
    const labels = ranks.map((rank) => toRankEmoji(rank));
    ladder.setAllPrizeLabels(labels);
  };

  const handleClearAll = () => {
    ladder.setAllPlayerNames([]);
    ladder.setAllPrizeLabels([]);
    setAutoNames(false);
  };

  return (
    <div className="w-full space-y-6">
      <div
        className="bg-surface rounded-xl shadow-card p-6 border border-hairline"
        data-testid="setup-card"
      >
        {/* Player count stepper */}
        <div className="mb-6">
          <Stepper
            value={ladder.state.playerCount}
            onValueChange={ladder.setCount}
            min={2}
            max={10}
            label={t('setup.countLabel')}
          />
        </div>

        {/* Two-column layout for desktop, stacked for mobile */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Players */}
          <div className="space-y-3">
            {/* Player column header with auto-names control */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-card-title text-text">
                {t('setup.playerPlaceholder')}
              </h3>
              <Toggle
                testId="auto-names-toggle"
                checked={autoNames}
                onChange={handleToggleAutoNames}
                label={t('setup.autoNames')}
              />
            </div>

            {/* Reroll button (only visible when autoNames is ON) */}
            {autoNames && (
              <div className="mb-2">
                <Button
                  data-testid="reroll-names-btn"
                  onClick={handleRerollNames}
                  variant="secondary"
                  size="sm"
                  className="w-full md:w-auto"
                  aria-label={t('setup.reroll')}
                >
                  🎲 {t('setup.reroll')}
                </Button>
              </div>
            )}

            {ladder.state.players.map((player, idx) => (
              <div key={player.id} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 bg-accent-${
                    ACCENT_COLORS[idx % ACCENT_COLORS.length]
                  }`}
                />
                <TextInput
                  testId="player-input"
                  placeholder={`${t('setup.playerPlaceholder')} ${idx + 1}`}
                  value={player.name}
                  onChange={(e) =>
                    ladder.setPlayerName(idx, e.target.value.slice(0, 12))
                  }
                  maxChars={12}
                  showCounter={player.name.length > 8}
                  className="flex-1"
                />
              </div>
            ))}
          </div>

          {/* Prizes */}
          <div className="space-y-3">
            {/* Prize column header with result buttons */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-card-title text-text">
                {t('setup.prizePlaceholder')}
              </h3>
            </div>

            <div className="flex gap-2">
              <Button
                data-testid="result-winner-btn"
                onClick={handleResultWinner}
                variant="secondary"
                size="sm"
                className="flex-1"
                aria-label={t('setup.resultWinner')}
              >
                {t('setup.resultWinner')}
              </Button>
              <Button
                data-testid="result-rank-btn"
                onClick={handleResultRank}
                variant="secondary"
                size="sm"
                className="flex-1"
                aria-label={t('setup.resultRank')}
              >
                {t('setup.resultRank')}
              </Button>
            </div>

            {ladder.state.prizes.map((prize, idx) => (
              <div key={prize.id} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 bg-accent-${
                    ACCENT_COLORS[idx % ACCENT_COLORS.length]
                  }`}
                />
                <TextInput
                  testId="prize-input"
                  placeholder={`${t('setup.prizePlaceholder')} ${idx + 1}`}
                  value={prize.label}
                  onChange={(e) =>
                    ladder.setPrizeLable(idx, e.target.value.slice(0, 12))
                  }
                  maxChars={12}
                  showCounter={prize.label.length > 8}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hide results toggle and clear-all button */}
        <div className="mb-6 py-4 border-t border-hairline space-y-3">
          <Toggle
            testId="hide-results-toggle"
            checked={ladder.state.hideResults}
            onChange={() => ladder.toggleHide()}
            label={t('setup.hideToggle')}
          />
          <Button
            data-testid="clear-all-btn"
            onClick={handleClearAll}
            variant="secondary"
            size="sm"
            className="w-full md:w-auto"
            aria-label={t('setup.clearAll')}
          >
            {t('setup.clearAll')}
          </Button>
        </div>

        {/* Build button */}
        <Button
          onClick={ladder.build}
          className="w-full md:w-auto"
          size="lg"
        >
          {t('setup.build')}
        </Button>
      </div>
    </div>
  );
}
