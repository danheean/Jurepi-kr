'use client';

import { useTranslations } from 'next-intl';
import type { DateKey } from '@/lib/age-calculator/date';
import { DateSelect } from './DateSelect';

interface Props {
  value: string | null;
  asOfDate: string;
  useAsOf: boolean;
  error: string | null;
  onChange: (dateKey: DateKey | null) => void;
  onAsOfDateChange: (dateKey: DateKey) => void;
  onUseAsOfChange: (use: boolean) => void;
  onClearError: () => void;
}

const ERROR_MESSAGE_KEY: Record<string, string> = {
  invalid: 'input.errorInvalidDate',
  future: 'input.errorFutureDate',
  'too-old': 'input.errorTooOld',
};

export function BirthdateInput({
  value,
  asOfDate,
  useAsOf,
  error,
  onChange,
  onAsOfDateChange,
  onUseAsOfChange,
  onClearError,
}: Props) {
  const t = useTranslations('tools.age-calculator');

  const handleBirthdateChange = (dateKey: DateKey | null) => {
    onChange(dateKey);
    if (error) {
      onClearError();
    }
  };

  return (
    <div className="space-y-6">
      {/* Birthdate — year / month / day dropdowns (elderly-friendly) */}
      <fieldset className="space-y-2">
        <legend className="font-semibold text-text text-sm">
          {t('input.birthdateLegend')}
        </legend>
        <DateSelect
          value={value}
          onChange={handleBirthdateChange}
          idPrefix="birthdate"
          ariaLabel={t('input.birthdateLegend')}
          invalid={!!error}
        />
        {error && (
          <div
            id="birthdate-error"
            className="text-danger-ink text-sm"
            role="alert"
            aria-live="polite"
          >
            {t(ERROR_MESSAGE_KEY[error] || 'input.errorInvalidDate')}
          </div>
        )}
      </fieldset>

      {/* As-of Date Toggle */}
      <div className="space-y-3">
        <button
          onClick={() => onUseAsOfChange(!useAsOf)}
          className={`inline-flex items-center gap-2 min-h-11 px-3 py-2 rounded-lg border font-medium text-sm transition-colors ${
            useAsOf
              ? 'bg-accent-mint/10 border-accent-mint/30 text-accent-mint-ink'
              : 'bg-surface-muted border-hairline text-text hover:border-text-secondary'
          }`}
          aria-pressed={useAsOf}
          aria-label={t('input.asOfLabel')}
        >
          <input
            type="checkbox"
            checked={useAsOf}
            onChange={(e) => onUseAsOfChange(e.target.checked)}
            className="sr-only"
          />
          <span>{t('input.asOfToggle')}</span>
        </button>

        {/* As-of Date (shown when toggle is on) — same dropdowns for consistency */}
        {useAsOf && (
          <div className="space-y-1 pl-4 border-l border-hairline">
            <span className="block font-semibold text-text text-sm">
              {t('input.asOfDate')}
            </span>
            <DateSelect
              value={asOfDate}
              onChange={(dateKey) => {
                if (dateKey) onAsOfDateChange(dateKey);
              }}
              idPrefix="as-of"
              ariaLabel={t('input.asOfDate')}
            />
            <p className="text-text-secondary text-xs">{t('input.asOfHelp')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
