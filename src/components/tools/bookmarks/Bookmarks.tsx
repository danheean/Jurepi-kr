'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { MergedTopic } from '@/lib/bookmarks/schema';
import bookmarksData from './data/bookmarks.generated.json';
import { Toast } from '@/components/ui/Toast';
import { useBookmarksCatalog } from './useBookmarksCatalog';
import { BookmarksSearch } from './BookmarksSearch';
import { TopicTabs } from './TopicTabs';
import { TopicsList } from './TopicsList';
import { TopicDetail } from './TopicDetail';
import { BookmarksIntro } from './BookmarksIntro';
import { BookmarksHowTo } from './BookmarksHowTo';
import { BookmarksFaq } from './BookmarksFaq';
import { BookmarksStructuredData } from './BookmarksStructuredData';

// Static catalog import: available at SSR/prerender time
const CATALOG = bookmarksData as MergedTopic[];

export function Bookmarks() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.bookmarks');
  const r = useBookmarksCatalog(CATALOG);

  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Gate interactive content to mounted state (SSR + client hydration safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleFav = useCallback(
    (slug: string) => {
      const wasFav = r.favorites.includes(slug);
      r.toggleFavorite(slug);
      setToast(wasFav ? t('toast.favoriteRemoved') : t('toast.favoriteAdded'));
    },
    [r, t]
  );

  const handleClearQuery = useCallback(() => {
    r.setQuery('');
  }, [r]);

  return (
    <div className="space-y-16">
      {/* SEO/GEO: rendered unconditionally (outside mounted gate) so it lands
          in the prerendered HTML for search engines and answer engines. */}
      <BookmarksIntro />

      {/* Interactive bookmarks island. Selector on top, detail below. */}
      {mounted && (
        <div className="space-y-6">
          <div className="min-w-0 space-y-4">
            <BookmarksSearch
              query={r.query}
              setQuery={r.setQuery}
              resultCount={r.resultCount}
            />
            <TopicTabs
              activeTab={r.activeTab}
              setActiveTab={r.setActiveTab}
              topicsCount={r.catalog.length}
              favCount={r.favorites.length}
              recentCount={r.recents.length}
            />
            <TopicsList
              topics={r.filtered}
              selectedSlug={r.selectedSlug}
              favorites={r.favorites}
              query={r.query}
              onSelect={r.select}
              onToggleFavorite={handleToggleFav}
              onClearQuery={handleClearQuery}
              locale={locale}
            />
          </div>

          {/* Detail: full-width panel, only shown once a topic is picked */}
          {r.selectedTopic && (
            <section className="rounded-3xl border border-hairline bg-surface p-6 shadow-card">
              <TopicDetail topic={r.selectedTopic} onClose={() => r.select(null)} locale={locale} />
            </section>
          )}
        </div>
      )}

      {/* SEO/GEO sections */}
      <BookmarksHowTo />
      <BookmarksFaq />
      <BookmarksStructuredData catalog={CATALOG} />

      {toast && (
        <Toast
          message={toast}
          type="success"
          open={!!toast}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
