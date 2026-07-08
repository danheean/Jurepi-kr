import { useTranslations, useLocale } from 'next-intl';

/**
 * SSR-safe intro (H1 + lead). Uses the isomorphic `useTranslations` so it
 * server-renders into the static HTML (crawlable by search + AI engines).
 */
export function MyIpIntro() {
  const t = useTranslations('tools.my-ip');
  const locale = useLocale();

  return (
    <header className="space-y-4 mb-8">
      <p className="text-xs font-bold tracking-widest text-brand-ink uppercase">
        {locale === 'ko' ? '개발 도구' : 'Developer Tool'}
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-text leading-tight">
        {t('title')}
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed">{t('lead')}</p>
    </header>
  );
}
