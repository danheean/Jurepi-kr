import { useTranslations } from 'next-intl';

/**
 * SSR long-form guide (gate outside — search/AI engine discoverability).
 * HowTo content rendered as prose sections.
 */
export function CheerHowTo() {
  const t = useTranslations('tools.cheer');

  return (
    <section
      aria-labelledby="cheer-howto-heading"
      className="my-12 space-y-6 border-t border-hairline pt-8"
    >
      <h2
        id="cheer-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.heading')}
      </h2>

      {/* What is this tool? — always-visible overview */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.whatTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.whatBody')}</p>
      </article>

      {/* How to use it */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.howTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.howBody')}</p>
      </article>

      {/* When to use it */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">
          {t('howTo.useCasesTitle')}
        </h3>
        <p className="text-text-secondary leading-relaxed">
          {t('howTo.useCasesBody')}
        </p>
      </article>

      {/* Tips */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.tipsTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.tipsBody')}</p>
      </article>
    </section>
  );
}
