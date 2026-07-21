'use client';

import { useTranslations } from 'next-intl';
import { MAX_LEN } from '@/lib/cheer';

interface CheerInputProps {
  text: string;
  onChange: (text: string) => void;
  onCommit?: (text: string) => void;
  recents: string[];
  onSelectRecent: (msg: string) => void;
}

/**
 * Text input field + recent message chips.
 */
export function CheerInput({
  text,
  onChange,
  onCommit,
  recents,
  onSelectRecent,
}: CheerInputProps) {
  const t = useTranslations('tools.cheer');

  return (
    <div className="flex flex-col gap-4">
      {/* Label + Input */}
      <div>
        <label
          htmlFor="cheer-input"
          className="block text-sm font-medium mb-2"
        >
          {t('input.label')}
        </label>
        <input
          id="cheer-input"
          type="text"
          maxLength={MAX_LEN}
          value={text}
          onChange={(e) => onChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCommit?.(e.currentTarget.value);
            }
          }}
          placeholder={t('input.placeholder')}
          className="
            w-full px-4 py-3 border border-hairline rounded-lg
            bg-surface text-text placeholder-text-muted
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
            text-base
          "
        />
      </div>

      {/* Clear Button */}
      {text.length > 0 && (
        <button
          onClick={() => onChange('')}
          className="
            self-start px-3 min-h-11 inline-flex items-center text-sm font-medium
            bg-surface-muted text-text rounded
            hover:bg-surface-sunken
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
            transition-colors
          "
        >
          {t('input.clear')}
        </button>
      )}

      {/* Recents Section */}
      {recents.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">
            {t('input.recentsLabel')}
          </div>
          <div className="flex flex-wrap gap-2">
            {recents.map((recent, idx) => (
              <button
                key={`${recent}-${idx}`}
                onClick={() => onSelectRecent(recent)}
                className="
                  px-3 min-h-11 inline-flex items-center text-sm
                  bg-surface-muted text-text rounded
                  hover:bg-surface-sunken
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                  transition-colors
                  max-w-full
                "
              >
                <span className="truncate max-w-[12rem]">{recent}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {recents.length === 0 && (
        <p className="text-sm text-text-muted">
          {t('input.noRecents')}
        </p>
      )}
    </div>
  );
}
