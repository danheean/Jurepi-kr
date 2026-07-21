'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { HistoryEntry } from '@/lib/lotto-generator/schema';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
}

/**
 * Locale-aware relative time via Intl.RelativeTimeFormat — not hand-rolled
 * ko/en string branching, which also always used plural English ("1
 * minutes ago") regardless of count.
 */
function formatTimestamp(isoString: string, locale: string): string {
  const diffMs = new Date(isoString).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const diffSeconds = diffMs / 1000;
  const diffMinutes = diffMs / 60000;
  const diffHours = diffMs / 3600000;
  const diffDays = diffMs / 86400000;

  if (Math.abs(diffSeconds) < 60) return rtf.format(0, 'second');
  if (Math.abs(diffMinutes) < 60) return rtf.format(Math.round(diffMinutes), 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(Math.round(diffHours), 'hour');
  return rtf.format(Math.round(diffDays), 'day');
}

export function HistoryPanel({ history, onRestore, onClear }: HistoryPanelProps) {
  const t = useTranslations('tools.lotto-generator');
  const locale = useLocale();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-surface-sunken border border-hairline text-center">
        <p className="text-text-muted text-sm">{t('history.empty')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-surface-sunken border border-hairline space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{t('history.title')}</h3>
        <button
          onClick={onClear}
          className="px-3 py-1 text-sm rounded bg-danger/10 text-danger hover:bg-danger/20 focus-visible:ring-2 focus-visible:ring-focus-ring flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('buttons.clearHistory')}</span>
        </button>
      </div>

      <div className="space-y-2">
        {history.map((entry, idx) => (
          <div key={idx} className="border border-hairline rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              aria-expanded={expanded === idx}
              aria-controls={`lotto-history-panel-${idx}`}
              className="w-full px-3 py-2 bg-surface-sunken hover:bg-surface-sunken/80 focus-visible:ring-2 focus-visible:ring-focus-ring flex items-center justify-between"
            >
              <div className="text-left text-sm">
                <div className="font-medium">
                  {t('history.gameCountLabel', { n: entry.gameCount })}
                </div>
                <div className="text-xs text-text-muted">
                  {formatTimestamp(entry.timestamp, locale)}
                </div>
              </div>
              <span className="sr-only">
                {expanded === idx ? t('history.collapseLabel') : t('history.expandLabel')}
              </span>
              {expanded === idx ? (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {expanded === idx && (
              <div
                id={`lotto-history-panel-${idx}`}
                className="p-3 space-y-2 bg-surface border-t border-hairline"
              >
                <div className="text-xs text-text-muted">
                  {entry.fixedNumbers.length > 0 && (
                    <p>
                      {t('history.fixedLabel', { numbers: entry.fixedNumbers.join(', ') })}
                    </p>
                  )}
                  {entry.excludedNumbers.length > 0 && (
                    <p>
                      {t('history.excludedLabel', { numbers: entry.excludedNumbers.join(', ') })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRestore(entry)}
                  className="w-full px-3 py-2 text-sm rounded bg-brand text-on-brand hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {t('history.restore')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
