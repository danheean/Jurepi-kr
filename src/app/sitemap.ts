import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getLiveTools } from '@/tools/registry';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;
  const liveTools = getLiveTools();

  const staticPages = [
    {
      paths: locales.map((locale) => `/${locale}`),
      priority: 1.0,
    },
    {
      paths: locales.map((locale) => `/${locale}/about`),
      priority: 0.5,
    },
    {
      paths: locales.map((locale) => `/${locale}/privacy`),
      priority: 0.5,
    },
    {
      paths: locales.map((locale) => `/${locale}/terms`),
      priority: 0.5,
    },
    {
      paths: locales.map((locale) => `/${locale}/contact`),
      priority: 0.5,
    },
  ];

  const entries: MetadataRoute.Sitemap = [];

  staticPages.forEach(({ paths, priority }) => {
    paths.forEach((path) => {
      entries.push({
        url: `${siteUrl}${path}`,
        lastModified: new Date(),
        priority,
        changeFrequency: 'weekly',
      } as any);
    });
  });

  liveTools.forEach((tool) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${siteUrl}/${locale}/tools/${tool.slug}`,
        lastModified: new Date(),
        priority: 0.8,
        changeFrequency: 'monthly',
      } as any);
    });
  });

  return entries;
}
