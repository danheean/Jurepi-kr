import { useTranslations } from 'next-intl';

/**
 * SSR-safe long-form guide (answer-first). Uses `useTranslations` so it
 * server-renders into the static HTML for search + AI-engine discoverability.
 * Answer-first structure: first sentence directly answers "how to remove backgrounds".
 */
export function TransparentBgHowTo() {
  const t = useTranslations('tools.transparent-background');

  const steps = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

  return (
    <section
      aria-labelledby="transparent-bg-howto-heading"
      className="space-y-8 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2
        id="transparent-bg-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.title')}
      </h2>

      {/* Step-by-step guide */}
      <div className="space-y-6">
        {steps.map((key, idx) => (
          <div key={key} className="space-y-2">
            <h3 className="text-xl font-semibold text-text">
              {idx + 1}. {t(`howTo.${key}`)}
            </h3>
            <p className="text-text-secondary leading-relaxed">{t(`howTo.${key}Body`)}</p>
          </div>
        ))}
      </div>

      {/* When to use section */}
      <div className="space-y-3 mt-8 p-4 rounded-lg bg-surface-muted border border-hairline">
        <p className="text-text-secondary leading-relaxed italic">{t('howTo.whenToUse')}</p>
      </div>
    </section>
  );
}
