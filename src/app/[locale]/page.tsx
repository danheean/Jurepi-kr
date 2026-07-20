import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { tools } from '@/tools/registry';
import { Hero } from '@/components/home/Hero';
import { HomePitchSection } from '@/components/home/HomePitchSection';
import { HomeStructuredData } from '@/components/home/HomeStructuredData';
import { ToolExplorer } from '@/components/home/ToolExplorer';
import { ShareButtons } from '@/components/share';
import { toSearchableTools } from '@/lib/searchable-tools';
import { buildPageMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  // Empty path → canonical `${siteUrl}/${locale}` with ko/en hreflang alternates.
  return buildPageMetadata({
    locale,
    path: '',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();

  // Resolve registry entries to localized, searchable tools (server-side) so
  // the full grid — and every tool link — is in the static HTML.
  const searchableTools = toSearchableTools(tools, t);

  return (
    <>
      {/* Site-wide Organization + WebSite JSON-LD in the prerendered HTML. */}
      <HomeStructuredData locale={locale} />
      <Hero />
      {/* Editorial prose (what Jurepi is, privacy, why free, categories) so the
          landing page carries real content, not just a tool grid. */}
      <HomePitchSection locale={locale} />
      {/* SNS share — inline, anchored to the container edge (not a floating cluster);
          shares the hub itself, same affordance as tool pages. */}
      <div className="mx-auto max-w-container px-6 md:px-8 lg:px-12 pb-6 md:pb-8">
        <ShareButtons orientation="horizontal" />
      </div>
      <ToolExplorer initialTools={searchableTools} />
    </>
  );
}
