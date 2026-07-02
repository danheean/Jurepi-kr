import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * Age Calculator structured data (JSON-LD) component.
 * Injects SoftwareApplication and HowTo JSON-LD for search engines and AI crawlers.
 * Rendered at the route level (not wrapped in mounted gate) for full discoverability.
 */
export function AgeCalculatorStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.age-calculator');

  const toolUrl = absoluteToolUrl(locale, 'age-calculator');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  // Build HowTo schema with steps from the howTo sections
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    url: toolUrl,
    step: [
      {
        '@type': 'HowToStep',
        name: t('howTo.whatIsTitle'),
        text: t('howTo.whatIsBody'),
      },
      {
        '@type': 'HowToStep',
        name: t('howTo.howToTitle'),
        text: t('howTo.howToBody'),
      },
      {
        '@type': 'HowToStep',
        name: t('howTo.featuresTitle'),
        text: t('howTo.featuresBody'),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    </>
  );
}
