import { useTranslations } from 'next-intl';
import { BookOpen } from 'lucide-react';

export function HowtoIntro() {
  const t = useTranslations('tools.howto');

  return (
    <div className="space-y-4">
      {/* Category chip reuses the card-badge vocabulary (color = meaning) instead
          of the all-caps tracked eyebrow. */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-sky-soft px-3 py-1 text-xs font-medium text-accent-sky-ink">
        <BookOpen className="w-3.5 h-3.5" />
        {t('intro.eyebrow')}
      </div>
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">
          {t('intro.title')}
        </h1>
        <p className="text-lg text-text-secondary">
          {t('intro.lead')}
        </p>
      </div>
    </div>
  );
}
