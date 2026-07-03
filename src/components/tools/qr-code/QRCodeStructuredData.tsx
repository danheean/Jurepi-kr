'use client';

import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * QR Code Generator structured data (JSON-LD) component.
 * Injects SoftwareApplication JSON-LD for search engines and AI crawlers.
 * FAQPage JSON-LD is emitted by QRCodeFaq (single owner, matches every other tool).
 * Rendered at the route level (not wrapped in mounted gate) for full discoverability.
 */
export function QRCodeStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.qr-code');

  const toolUrl = absoluteToolUrl(locale, 'qr-code');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
    </>
  );
}
