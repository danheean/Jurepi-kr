'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus } from 'lucide-react';
import { GAME_COUNT_MIN, GAME_COUNT_MAX, LOTTO_MIN, LOTTO_MAX } from '@/lib/lotto-generator/schema';
import { isDrawFeasible, feasibilityError } from '@/lib/lotto-generator/validate';
import { parseNumberListWithRejects } from '@/lib/lotto-generator/parse';

interface SettingsPanelProps {
  gameCount: number;
  onGameCountChange: (count: number) => void;
  fixedNumbers: number[];
  onAddFixed: (n: number) => void;
  onRemoveFixed: (n: number) => void;
  excludedNumbers: number[];
  onAddExcluded: (n: number) => void;
  onRemoveExcluded: (n: number) => void;
  onGenerateDisabledChange?: (disabled: boolean) => void;
}

export function SettingsPanel({
  gameCount,
  onGameCountChange,
  fixedNumbers,
  onAddFixed,
  onRemoveFixed,
  excludedNumbers,
  onAddExcluded,
  onRemoveExcluded,
  onGenerateDisabledChange,
}: SettingsPanelProps) {
  const t = useTranslations('tools.lotto-generator');
  const [fixedInput, setFixedInput] = useState('');
  const [excludedInput, setExcludedInput] = useState('');
  const [fixedConflict, setFixedConflict] = useState<number[]>([]);
  const [excludedConflict, setExcludedConflict] = useState<number[]>([]);
  const [fixedOutOfRange, setFixedOutOfRange] = useState<number[]>([]);
  const [excludedOutOfRange, setExcludedOutOfRange] = useState<number[]>([]);
  const [fixedNoValidNumbers, setFixedNoValidNumbers] = useState(false);
  const [excludedNoValidNumbers, setExcludedNoValidNumbers] = useState(false);

  const isInfeasible = !isDrawFeasible(fixedNumbers.length, excludedNumbers.length);
  const errorMessage = feasibilityError(fixedNumbers.length, excludedNumbers.length);

  // Notify parent of feasibility
  useEffect(() => {
    onGenerateDisabledChange?.(isInfeasible);
  }, [isInfeasible, onGenerateDisabledChange]);

  // Accept one or many comma-separated numbers (e.g. "7, 13, 21"). Numbers
  // are rejected (and why is surfaced) rather than silently dropped: a
  // number already on the opposite list can't be both "always include" and
  // "never include" (*Conflict), a number outside 1–45 doesn't exist
  // (*OutOfRange), and input with no parseable number at all gets a
  // generic hint (*NoValidNumbers).
  const handleAddFixed = () => {
    if (fixedInput.trim() === '') return;
    const { valid, rejected } = parseNumberListWithRejects(fixedInput, LOTTO_MIN, LOTTO_MAX);
    const conflicts = valid.filter((n) => excludedNumbers.includes(n));
    valid.filter((n) => !excludedNumbers.includes(n)).forEach((n) => onAddFixed(n));
    setFixedConflict(conflicts);
    setFixedOutOfRange(rejected);
    setFixedNoValidNumbers(valid.length === 0 && rejected.length === 0);
    setFixedInput('');
  };

  const handleAddExcluded = () => {
    if (excludedInput.trim() === '') return;
    const { valid, rejected } = parseNumberListWithRejects(excludedInput, LOTTO_MIN, LOTTO_MAX);
    const conflicts = valid.filter((n) => fixedNumbers.includes(n));
    valid.filter((n) => !fixedNumbers.includes(n)).forEach((n) => onAddExcluded(n));
    setExcludedConflict(conflicts);
    setExcludedOutOfRange(rejected);
    setExcludedNoValidNumbers(valid.length === 0 && rejected.length === 0);
    setExcludedInput('');
  };

  return (
    <div className="space-y-6 p-4 rounded-lg bg-surface-sunken border border-hairline">
      {/* Game Count */}
      <div>
        <label id="game-count-label" className="block text-sm font-medium mb-2">
          {t('settings.gameCount.label')}
        </label>
        <p className="text-xs text-text-muted mb-3">{t('settings.gameCount.help')}</p>
        <div role="group" aria-labelledby="game-count-label" className="flex flex-wrap gap-2">
          {Array.from({ length: GAME_COUNT_MAX - GAME_COUNT_MIN + 1 }, (_, i) => GAME_COUNT_MIN + i).map(
            (n) => {
              const isSelected = n === gameCount;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onGameCountChange(n)}
                  aria-pressed={isSelected}
                  aria-label={t('settings.gameCount.option', { n })}
                  className={`min-h-[44px] min-w-[44px] px-3 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    isSelected
                      ? 'bg-brand text-on-brand'
                      : 'bg-surface-muted border border-hairline hover:bg-surface-sunken'
                  }`}
                >
                  {n}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Fixed Numbers */}
      <div>
        <label htmlFor="lotto-fixed-input" className="block text-sm font-medium mb-2">
          {t('settings.fixedNumbers.label')}
        </label>
        <p className="text-xs text-text-muted mb-3">{t('settings.fixedNumbers.help')}</p>
        <div className="flex gap-2 mb-3">
          <input
            id="lotto-fixed-input"
            type="text"
            placeholder={t('settings.fixedNumbers.placeholder')}
            value={fixedInput}
            onChange={(e) => setFixedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.stopPropagation(); // don't also trigger the global "Enter to generate"
                handleAddFixed();
              }
            }}
            className="flex-1 px-3 py-2 rounded border border-hairline focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
          <button
            onClick={handleAddFixed}
            disabled={fixedNumbers.length >= 5}
            className="px-3 py-2 rounded bg-brand text-on-brand hover:bg-brand/90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-focus-ring flex items-center gap-1"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">{t('settings.fixedNumbers.add')}</span>
            {/* Both Add buttons render the same visible text — this suffix
                lets assistive tech tell them apart (e.g. a screen reader's
                buttons list), while the visible label stays in the
                accessible name (WCAG 2.5.3 Label in Name). */}
            <span className="sr-only"> {t('settings.fixedNumbers.addAria')}</span>
          </button>
        </div>
        {fixedConflict.length > 0 && (
          <p className="text-xs text-danger-ink mb-3" role="alert">
            {t('settings.conflict', { numbers: fixedConflict.join(', ') })}
          </p>
        )}
        {fixedOutOfRange.length > 0 && (
          <p className="text-xs text-danger-ink mb-3" role="alert">
            {t('settings.outOfRange', { numbers: fixedOutOfRange.join(', ') })}
          </p>
        )}
        {fixedNoValidNumbers && (
          <p className="text-xs text-danger-ink mb-3" role="alert">
            {t('settings.noValidNumbers')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {fixedNumbers.map((n) => (
            <div
              key={n}
              className="px-3 py-1 rounded-full bg-brand/10 text-brand text-sm flex items-center gap-2"
            >
              {n}
              <button
                onClick={() => onRemoveFixed(n)}
                className="hover:text-brand/70 focus-visible:ring-1 focus-visible:ring-focus-ring rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Excluded Numbers */}
      <div>
        <label htmlFor="lotto-excluded-input" className="block text-sm font-medium mb-2">
          {t('settings.excludedNumbers.label')}
        </label>
        <p className="text-xs text-text-muted mb-3">{t('settings.excludedNumbers.help')}</p>
        <div className="flex gap-2 mb-3">
          <input
            id="lotto-excluded-input"
            type="text"
            placeholder={t('settings.excludedNumbers.placeholder')}
            value={excludedInput}
            onChange={(e) => setExcludedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.stopPropagation(); // don't also trigger the global "Enter to generate"
                handleAddExcluded();
              }
            }}
            className="flex-1 px-3 py-2 rounded border border-hairline focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
          <button
            onClick={handleAddExcluded}
            disabled={excludedNumbers.length >= 39}
            className="px-3 py-2 rounded bg-brand text-on-brand hover:bg-brand/90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-focus-ring flex items-center gap-1"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">{t('settings.excludedNumbers.add')}</span>
            <span className="sr-only"> {t('settings.excludedNumbers.addAria')}</span>
          </button>
        </div>
        {excludedConflict.length > 0 && (
          <p className="text-xs text-danger-ink mb-3" role="alert">
            {t('settings.conflict', { numbers: excludedConflict.join(', ') })}
          </p>
        )}
        {excludedOutOfRange.length > 0 && (
          <p className="text-xs text-danger-ink mb-3" role="alert">
            {t('settings.outOfRange', { numbers: excludedOutOfRange.join(', ') })}
          </p>
        )}
        {excludedNoValidNumbers && (
          <p className="text-xs text-danger-ink mb-3" role="alert">
            {t('settings.noValidNumbers')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {excludedNumbers.map((n) => (
            <div
              key={n}
              className="px-3 py-1 rounded-full bg-danger/10 text-danger-ink text-sm flex items-center gap-2"
            >
              {n}
              <button
                onClick={() => onRemoveExcluded(n)}
                className="hover:text-danger-ink/70 focus-visible:ring-1 focus-visible:ring-focus-ring rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feasibility Warning */}
      {isInfeasible && errorMessage && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger-ink text-sm">
          {t(errorMessage)}
        </div>
      )}
    </div>
  );
}
