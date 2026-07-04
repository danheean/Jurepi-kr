import { useTranslations } from 'next-intl';

/**
 * UnitConverterIntro: Eyebrow + H1 + lead text (server-render, gate outside mounted).
 */
export function UnitConverterIntro() {
  const t = useTranslations('tools.unit-converter');

  return (
    <section className="space-y-4 pb-8 border-b border-hairline">
      <div className="text-xs font-bold tracking-widest text-brand-ink uppercase">
        {t('eyebrow')}
      </div>
      <h1 className="text-4xl font-bold text-text">{t('title')}</h1>
      <p className="text-lg text-text-secondary leading-relaxed">{t('lead')}</p>
    </section>
  );
}
