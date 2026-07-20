'use client';

import { useLocale } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * SoftwareApplication JSON-LD for Cheer.
 * FAQPage JSON-LD is owned by CheerFaq component.
 */
export function CheerStructuredData() {
  const locale = useLocale();
  const toolUrl = absoluteToolUrl(locale, 'cheer');

  const schema = softwareApplicationJsonLd({
    name: locale === 'ko' ? '모두의 응원' : "Everyone's Cheer",
    description:
      locale === 'ko'
        ? '응원 문구를 크게 띄워 콘서트·경기장에서 눈에 띄게 응원하세요.'
        : "Show your cheer message big — wave it like an LED banner at concerts and games.",
    url: toolUrl,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
