'use client';

import { useLocale } from 'next-intl';
import type { MergedTopic } from '@/lib/bookmarks/schema';
import {
  softwareApplicationJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  absoluteToolUrl,
} from '@/lib/seo';

interface BookmarksStructuredDataProps {
  catalog: MergedTopic[];
}

export function BookmarksStructuredData({ catalog }: BookmarksStructuredDataProps) {
  const locale = useLocale() as 'ko' | 'en';

  // SoftwareApplication LD+JSON
  const appJsonLd = softwareApplicationJsonLd({
    name: locale === 'ko' ? '즐겨찾기' : 'Bookmarks',
    description:
      locale === 'ko'
        ? '하네스·프런트엔드·디자인·개발 등 각 분야의 신뢰할 수 있는 큐레이션 링크 모음'
        : 'Curated bookmarks and resources across engineering, frontend, design, and development',
    url: absoluteToolUrl(locale, 'bookmarks'),
  });

  // FAQPage LD+JSON
  const faqJsonLd = faqPageJsonLd([
    {
      q: locale === 'ko'
        ? '즐겨찾기 주제를 추가할 수 있나요?'
        : 'Can I add bookmark topics?',
      a: locale === 'ko'
        ? '아니요. 주제는 에디터가 직접 작성하고 관리합니다.'
        : 'No. Topics are authored and managed by our editors.',
    },
  ]);

  // ItemList LD+JSON for each topic (topics as items, links as sub-items)
  const itemListJsonLds = catalog.map((topic) => {
    const localeData = locale === 'ko' ? topic.ko : topic.en;
    return itemListJsonLd({
      name: localeData.title,
      url: absoluteToolUrl(locale, 'bookmarks'),
      items: localeData.sections.flatMap((section, sectionIdx) =>
        section.links.map((link, linkIdx) => ({
          position: sectionIdx * 100 + linkIdx,
          name: link.label,
          description: link.description || '',
          url: link.url,
        }))
      ),
    });
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        suppressHydrationWarning
      />
      {itemListJsonLds.map((jsonLd, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
        />
      ))}
    </>
  );
}
