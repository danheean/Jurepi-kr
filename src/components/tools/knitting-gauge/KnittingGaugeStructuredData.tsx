import { useLocale, useTranslations } from 'next-intl'
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo'

/**
 * KnittingGaugeStructuredData: SoftwareApplication JSON-LD schema.
 * Server-side rendering for SEO.
 * FAQPage is owned by KnittingGaugeFaq component (no duplication here).
 */
export function KnittingGaugeStructuredData() {
  const locale = (useLocale() || 'en') as 'ko' | 'en'
  const t = useTranslations('tools.knitting-gauge')

  const toolUrl = absoluteToolUrl(locale, 'knitting-gauge')
  const title = t('title')
  const description = t('description')

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  })

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
    />
  )
}
