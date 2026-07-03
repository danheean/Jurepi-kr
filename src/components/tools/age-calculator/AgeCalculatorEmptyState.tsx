'use client';

import { useTranslations } from 'next-intl';
import { Cake } from 'lucide-react';

export function AgeCalculatorEmptyState() {
  const t = useTranslations('tools.age-calculator');

  return (
    <div className="w-full py-16 text-center space-y-4">
      <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-accent-mint-soft">
        <Cake className="w-8 h-8 text-accent-mint-ink" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-text">{t('emptyState.title')}</h2>
        <p className="mx-auto max-w-[20rem] text-sm text-text-secondary">{t('emptyState.body')}</p>
      </div>
    </div>
  );
}
