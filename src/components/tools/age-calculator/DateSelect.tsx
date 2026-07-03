'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { daysInMonth, today } from '@/lib/age-calculator/date';
import type { DateKey } from '@/lib/age-calculator/date';

const AGE_MAX_YEARS = 150;
const pad = (n: number): string => String(n).padStart(2, '0');

interface Parts {
  y: string;
  m: string;
  d: string;
}

/** Split a DateKey into unpadded numeric-string parts ("2000-03-01" → 2000/3/1). */
function split(value: string | null): Parts {
  if (!value) return { y: '', m: '', d: '' };
  const [y, m, d] = value.split('-');
  return { y: y || '', m: m ? String(Number(m)) : '', d: d ? String(Number(d)) : '' };
}

/** Compose parts into a zero-padded DateKey, or null while incomplete. Clamps
 *  the day to the month (e.g. Jan 31 → Feb 28). */
function compose(p: Parts): DateKey | null {
  if (p.y && p.m && p.d) {
    const y = Number(p.y);
    const m = Number(p.m);
    const d = Math.min(Number(p.d), daysInMonth(y, m));
    return `${y}-${pad(m)}-${pad(d)}` as DateKey;
  }
  return null;
}

interface Props {
  /** Committed value as a DateKey ("YYYY-MM-DD"), or null when incomplete. */
  value: string | null;
  onChange: (dateKey: DateKey | null) => void;
  /** Unique prefix for the three <select> ids. */
  idPrefix: string;
  minYear?: number;
  maxYear?: number;
  ariaLabel?: string;
  invalid?: boolean;
}

/**
 * Year / Month / Day dropdowns — elderly-friendly replacement for the native
 * date picker (no calendar hunting for a far-past birth year; native <select>
 * renders as a wheel picker on mobile). The in-progress selection lives in local
 * state so a partial pick isn't lost while `value` is still null; the parent
 * `value` is adopted only when it changes externally (e.g. picking a recent).
 */
export function DateSelect({ value, onChange, idPrefix, minYear, maxYear, ariaLabel, invalid }: Props) {
  const t = useTranslations('tools.age-calculator');
  const [parts, setParts] = useState<Parts>(() => split(value));

  // Adopt an externally-set value (recent/person select, clear) without
  // clobbering an in-progress selection that the parent hasn't committed yet.
  useEffect(() => {
    const composed = compose(parts);
    if ((value ?? null) !== composed) {
      setParts(split(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const currentYear = parseInt(today().slice(0, 4), 10);
  const hi = maxYear ?? currentYear;
  const lo = minYear ?? currentYear - AGE_MAX_YEARS;

  const years: number[] = [];
  for (let y = hi; y >= lo; y--) years.push(y);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayMax = parts.y && parts.m ? daysInMonth(Number(parts.y), Number(parts.m)) : 31;
  const days = Array.from({ length: dayMax }, (_, i) => i + 1);

  const update = (raw: Parts) => {
    let next = raw;
    // Keep the stored day in range so the day <select> never holds an option
    // that no longer exists (e.g. 31 after switching to February).
    if (next.y && next.m && next.d) {
      const maxD = daysInMonth(Number(next.y), Number(next.m));
      if (Number(next.d) > maxD) next = { ...next, d: String(maxD) };
    }
    setParts(next);
    onChange(compose(next));
  };

  const selectCls = `min-h-11 flex-1 min-w-0 basis-24 px-3 py-2 rounded-lg border bg-surface text-text transition-colors ${
    invalid ? 'border-danger' : 'border-hairline hover:border-hairline-strong'
  }`;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      <select
        id={`${idPrefix}-year`}
        value={parts.y}
        onChange={(e) => update({ ...parts, y: e.target.value })}
        aria-label={t('input.selectYear')}
        className={selectCls}
      >
        <option value="">{t('input.selectYear')}</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
            {t('input.unitYear')}
          </option>
        ))}
      </select>

      <select
        id={`${idPrefix}-month`}
        value={parts.m}
        onChange={(e) => update({ ...parts, m: e.target.value })}
        aria-label={t('input.selectMonth')}
        className={selectCls}
      >
        <option value="">{t('input.selectMonth')}</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
            {t('input.unitMonth')}
          </option>
        ))}
      </select>

      <select
        id={`${idPrefix}-day`}
        value={parts.d}
        onChange={(e) => update({ ...parts, d: e.target.value })}
        aria-label={t('input.selectDay')}
        className={selectCls}
      >
        <option value="">{t('input.selectDay')}</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
            {t('input.unitDay')}
          </option>
        ))}
      </select>
    </div>
  );
}
