'use client';

import { useTranslations } from 'next-intl';
import { Stepper } from '@/components/ui/Stepper';
import { TextInput } from '@/components/ui/TextInput';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
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

  return (
    <div className="w-full space-y-6">
      <div className="bg-surface rounded-xl shadow-card p-6 border border-hairline" data-testid="setup-card">
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
            <h3 className="font-card-title text-text">
              {t('setup.playerPlaceholder')}
            </h3>
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
            <h3 className="font-card-title text-text">
              {t('setup.prizePlaceholder')}
            </h3>
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

        {/* Hide results toggle */}
        <div className="mb-6 py-4 border-t border-hairline">
          <Toggle
            testId="hide-results-toggle"
            checked={ladder.state.hideResults}
            onChange={() => ladder.toggleHide()}
            label={t('setup.hideToggle')}
          />
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
