'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

export function LadderFaq() {
  const t = useTranslations('tools.ladder');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const faqItems = t.raw('faq.items') as Array<{
    q: string;
    a: string;
  }>;

  const jsonLd = faqPageJsonLd(faqItems);

  return (
    <section className="my-12 space-y-6">
      <h2 className="font-display text-headline text-text">{t('faq.heading')}</h2>

      <div className="space-y-3">
        {faqItems.map((item, idx) => (
          <details
            key={idx}
            className="group border border-hairline rounded-lg p-4 hover:shadow-card transition-shadow"
            open={expandedIdx === idx}
            onToggle={() =>
              setExpandedIdx(expandedIdx === idx ? null : idx)
            }
          >
            <summary className="text-card-title text-text cursor-pointer list-none">
              {item.q}
            </summary>
            <p className="mt-3 font-body text-text-secondary leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      {/* JSON-LD for FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
