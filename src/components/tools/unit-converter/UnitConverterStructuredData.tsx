import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * UnitConverterStructuredData: SoftwareApplication JSON-LD schema.
 * Server-side rendering for SEO.
 * FAQPage is owned by UnitConverterFaq component (no duplication here).
 */
export function UnitConverterStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.unit-converter');

  const toolUrl = absoluteToolUrl(locale, 'unit-converter');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
    />
  );
}
