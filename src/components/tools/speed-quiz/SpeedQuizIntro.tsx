import { useTranslations, useLocale } from 'next-intl';

/**
 * SSR-safe intro section (eyebrow + H1 + lead).
 * Uses isomorphic `useTranslations` so it server-renders into the static HTML
 * for AI crawlers and search engines.
 */
export function SpeedQuizIntro() {
  const t = useTranslations('tools.speed-quiz');
  const locale = useLocale();

  return (
    <header className="space-y-4 mb-8">
      <p className="text-xs font-bold tracking-wider text-accent-sun uppercase">
        {t('intro.eyebrow')}
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-text leading-tight">
        {t('intro.title')}
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed">
        {t('intro.lead')}
      </p>
    </header>
  );
}
