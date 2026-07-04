import { useTranslations } from 'next-intl';

/**
 * UnitConverterHowTo: Long-form "How do unit conversions work?" (server-render, gate outside mounted).
 */
export function UnitConverterHowTo() {
  const t = useTranslations('tools.unit-converter');
  const howToItems = t.raw('howTo.items') as string[];

  return (
    <section className="space-y-6 py-12">
      <h2 className="text-2xl font-bold text-text">{t('howTo.title')}</h2>
      <div className="space-y-4 text-text-secondary">
        {howToItems.map((item, idx) => (
          <p key={idx} className="leading-relaxed">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}
