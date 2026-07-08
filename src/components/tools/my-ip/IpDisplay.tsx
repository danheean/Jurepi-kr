'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Copy, RotateCw } from 'lucide-react';
import type { IpResult } from '@/lib/my-ip/schema';
import { copyText } from './copy-button';

interface IpDisplayProps {
  data: IpResult;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function IpDisplay({ data, onRefresh, isLoading = false }: IpDisplayProps) {
  const t = useTranslations('tools.my-ip');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyText(data.ipv4);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Format with the APP locale, not the system locale — bare
  // toLocaleTimeString() leaks the OS language across ko/en pages.
  const fetchedAtTime = new Intl.DateTimeFormat(locale, {
    timeStyle: 'medium',
  }).format(new Date(data.fetchedAt));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-[600px] bg-surface rounded-2xl border border-hairline p-8 shadow-card">
        {/* IP Display */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <p className="text-xs font-semibold tracking-widest text-brand-ink uppercase">
            {t('display.ipv4Label')}
          </p>
          {/* max-w-full + break-all let the chip shrink below the IP's
              min-content width — otherwise the card overflows at 320px. */}
          <div className="flex items-center gap-3 px-4 py-3 bg-accent-rose/10 rounded-lg max-w-full">
            <code className="font-mono text-xl tracking-normal sm:text-3xl sm:tracking-wider md:text-4xl text-text font-semibold break-all">
              {data.ipv4}
            </code>
          </div>

          {/* IPv6 if present */}
          {data.ipv6 && (
            <div className="mt-4 w-full">
              <p className="text-xs font-semibold text-text-muted mb-2">
                {t('display.ipv6Label')}
              </p>
              <code className="text-sm font-mono text-text-secondary break-all">
                {data.ipv6}
              </code>
            </div>
          )}
        </div>

        {/* Geo info if present */}
        {(data.isp || data.city) && (
          <div className="border-t border-hairline pt-4 mb-4 text-center">
            {data.isp && (
              <p className="text-sm text-text-muted">
                <span className="font-semibold">{t('display.ispLabel')}:</span> {data.isp}
              </p>
            )}
            {data.city && (
              <p className="text-sm text-text-muted mt-1">
                <span className="font-semibold">{t('display.cityLabel')}:</span> {data.city}
              </p>
            )}
            {(data.isp || data.city) && (
              <p className="text-xs text-text-muted mt-1">
                {t('display.approximateNote', { provider: data.provider })}
              </p>
            )}
          </div>
        )}

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={isLoading}
          aria-label={t('display.copyAria')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand text-on-brand font-semibold rounded-lg hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] mb-4"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? t('display.copied') : t('display.copy')}</span>
        </button>

        {/* Metadata */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-text-muted">
            {t('display.provider', { provider: data.provider })}
          </p>
          <p className="text-xs text-text-muted">{fetchedAtTime}</p>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        aria-label={t('display.refresh')}
        className="flex items-center justify-center gap-2 px-4 py-2 text-brand-ink font-semibold border border-brand-ink rounded-lg hover:bg-brand-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[120px]"
      >
        <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{t('display.refresh')}</span>
      </button>
    </div>
  );
}
