'use client';

import { useTranslations } from 'next-intl';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import type { UrlEncoderError, UrlEncoderErrorCode } from '@/lib/url-encoder/schema';

interface Props {
  result: string | null;
  error?: UrlEncoderError | null;
  onCopy: () => Promise<boolean>;
  isLoading?: boolean;
}

// Stable error codes → localized i18n keys (message + details).
const ERROR_MESSAGE_KEY: Record<UrlEncoderErrorCode, string> = {
  malformedSequence: 'errors.malformedSequence',
  charsetMismatch: 'errors.charsetMismatch',
  unencodableChar: 'errors.unencodableChar',
  encodingFailed: 'errors.encodingFailed',
};

const ERROR_DETAILS_KEY: Record<UrlEncoderErrorCode, string> = {
  malformedSequence: 'errors.malformedDetails',
  charsetMismatch: 'errors.charsetMismatchDetails',
  unencodableChar: 'errors.unencodableCharDetails',
  encodingFailed: 'errors.encodingFailedDetails',
};

export function ResultOutput({ result, error, onCopy, isLoading }: Props) {
  const t = useTranslations('tools.url-encoder');
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'fail'>('idle');

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setCopyState('success');
      setTimeout(() => setCopyState('idle'), 1600);
    } else {
      setCopyState('fail');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  if (error) {
    const localizedMessage = error.code
      ? t(ERROR_MESSAGE_KEY[error.code], error.params ?? {})
      : error.message;
    const localizedDetails = error.code ? t(ERROR_DETAILS_KEY[error.code]) : error.details;

    return (
      <div
        className="rounded-lg bg-danger/10 border border-danger/30 p-4 space-y-2"
        role="alert"
        aria-live="assertive"
      >
        <p className="font-semibold text-danger-ink text-sm">{localizedMessage}</p>
        <p className="text-xs text-text-secondary">{localizedDetails}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {result ? (
        <>
          <div
            className="bg-surface-muted border border-hairline rounded-lg p-4 min-h-24 overflow-auto font-mono text-sm text-text break-all"
            aria-label={t('output.aria')}
            role="region"
          >
            {result}
          </div>
          <button
            onClick={handleCopy}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium text-sm transition-colors ${
              copyState === 'success'
                ? 'bg-success text-on-success'
                : 'bg-brand text-on-brand hover:bg-brand-strong'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={t('output.copyButton')}
          >
            <Copy className="w-4 h-4" strokeWidth={1.75} />
            {copyState === 'success' ? t('output.copied') : t('output.copyButton')}
          </button>
        </>
      ) : (
        <div
          className="bg-surface-muted border border-hairline rounded-lg p-8 text-center text-text-secondary text-sm"
          aria-live="polite"
        >
          {isLoading ? t('output.processing') : t('output.empty')}
        </div>
      )}
    </div>
  );
}
