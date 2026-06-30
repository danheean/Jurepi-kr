'use client';

import { useTranslations } from 'next-intl';

export function LadderIntro() {
  const t = useTranslations('tools.ladder');

  return (
    <section className="mb-8">
      <h1 className="font-display font-bold text-display-lg text-text mb-4">
        {t('title')}
      </h1>
      <p className="text-body-lg text-text-secondary max-w-2xl">
        {t('lead')}
      </p>
    </section>
  );
}
