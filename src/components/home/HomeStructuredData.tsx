import { getTranslations } from 'next-intl/server';
import { absoluteSiteUrl, organizationJsonLd, webSiteJsonLd } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

/**
 * Site-wide structured data (Organization + WebSite), rendered once on the
 * homepage at the route level (outside any mounted gate) so crawlers and AI
 * answer engines see the publisher entity in the prerendered HTML.
 *
 * URLs are derived from the canonical site URL (never hardcoded) so they match
 * the homepage `<link rel="canonical">`. Operator stays pseudonymous.
 */
export async function HomeStructuredData({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const homeUrl = absoluteSiteUrl(locale);

  // External profiles that represent the same publisher entity.
  const sameAs = [
    'https://github.com/danheean/Jurepi-kr',
    ...(blogUrl ? [blogUrl] : []),
  ];

  const organization = organizationJsonLd({
    name: 'Jurepi',
    description: t('meta.description'),
    url: homeUrl,
    logoUrl: `${siteUrl}/apple-touch-icon.png`,
    contactUrl: `${homeUrl}/contact`,
    sameAs,
  });

  const website = webSiteJsonLd({
    name: 'Jurepi',
    description: t('meta.description'),
    url: homeUrl,
    inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
