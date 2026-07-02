import { useTranslations } from 'next-intl';

/**
 * SSR-safe FAQ section with FAQPage JSON-LD.
 * Uses `useTranslations` so the questions, answers, and structured data
 * all land in the static prerendered HTML for search + AI answer engines.
 */
export function SpeedQuizFaq() {
  const t = useTranslations('tools.speed-quiz');

  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <section
      aria-labelledby="speed-quiz-faq-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h2 id="speed-quiz-faq-heading" className="font-display text-3xl font-bold text-text">
        {t('faq.title')}
      </h2>
      <div className="space-y-4">
        {faqItems.map((item, idx) => (
          <details
            key={idx}
            className="border border-hairline rounded-lg p-4 hover:bg-surface-muted transition"
          >
            <summary className="font-semibold text-text cursor-pointer">
              {item.q}
            </summary>
            <p className="mt-3 text-text-secondary leading-relaxed whitespace-pre-wrap">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
