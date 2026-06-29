'use client';

import { useTranslations } from 'next-intl';

export function LadderHowTo() {
  const t = useTranslations('tools.ladder');

  return (
    <section className="my-12 space-y-8">
      <h2 className="font-headline text-text">{t('howTo.heading')}</h2>

      <article className="space-y-4">
        <h3 className="font-card-title text-text">
          {t('howTo.whatIsTitle')}
        </h3>
        <p className="font-body text-text-secondary leading-relaxed whitespace-pre-wrap">
          {t('howTo.whatIsBody')}
        </p>
      </article>

      <article className="space-y-4">
        <h3 className="font-card-title text-text">
          {t('howTo.howToTitle')}
        </h3>
        <p className="font-body text-text-secondary leading-relaxed whitespace-pre-wrap">
          {t('howTo.howToBody')}
        </p>
      </article>
    </section>
  );
}
