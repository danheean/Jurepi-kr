import { useTranslations } from 'next-intl';

/**
 * SSR-safe reference article (server component, gate outside mounted) so the
 * guide is in the static HTML for search + AI-engine discovery. "What is this
 * tool?" leads as always-visible prose; the numbered steps, use cases, and tips
 * follow.
 */
export function CounterHowTo() {
  const t = useTranslations('tools.character-counter');

  const steps = (t.raw('howTo.steps') || []) as Array<{ step: number; text: string }>;

  return (
    <section
      aria-labelledby="counter-howto-heading"
      className="space-y-8 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2
        id="counter-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.title')}
      </h2>

      {/* What is this tool? — always-visible overview */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.whatIsTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.whatIsBody')}</p>
      </article>

      {/* Step-by-step */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-text">{t('howTo.stepsTitle')}</h3>
        {steps.map((item) => (
          <div key={item.step} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand text-on-brand flex items-center justify-center font-bold text-sm">
              {item.step}
            </div>
            <p className="text-text-secondary leading-relaxed flex items-center">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* When to use it */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.useCasesTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.useCasesBody')}</p>
      </article>

      {/* Tips */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.tipsTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.tipsBody')}</p>
      </article>
    </section>
  );
}
