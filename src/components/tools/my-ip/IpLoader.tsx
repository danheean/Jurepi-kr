'use client';

import { useTranslations } from 'next-intl';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function IpLoader() {
  const t = useTranslations('tools.my-ip');
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="flex flex-col items-center gap-4"
      role="status"
      aria-live="polite"
      aria-label={t('loader.fetching')}
    >
      {!prefersReducedMotion && (
        <div className="w-48 h-16 bg-surface-muted rounded-lg animate-pulse" />
      )}
      <p className="text-text-secondary text-sm font-medium">{t('loader.fetching')}</p>
    </div>
  );
}
