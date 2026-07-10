'use client';

import { useTranslations } from 'next-intl';
import { TIMEZONE_NAMES } from '@/lib/cron-parser';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const t = useTranslations('tools.cron-parser');

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t('timezoneLabel')}
      className="w-full px-4 py-2 rounded-lg border border-hairline bg-surface text-text font-sans text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
    >
      <option value="Local">{t('localTimezone', { defaultValue: 'Local' })}</option>
      {TIMEZONE_NAMES.filter((tz) => tz !== 'Local').map((tz) => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </select>
  );
}
