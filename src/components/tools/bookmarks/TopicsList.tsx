import { useTranslations } from 'next-intl';
import type { MergedTopic } from '@/lib/bookmarks/schema';
import { TopicCard } from './TopicCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface TopicsListProps {
  topics: MergedTopic[];
  selectedSlug: string | null;
  favorites: string[];
  query: string;
  onSelect: (slug: string | null) => void;
  onToggleFavorite: (slug: string) => void;
  onClearQuery: () => void;
  locale: 'ko' | 'en';
}

export function TopicsList({
  topics,
  selectedSlug,
  favorites,
  query,
  onSelect,
  onToggleFavorite,
  onClearQuery,
  locale,
}: TopicsListProps) {
  const t = useTranslations('tools.bookmarks');

  if (topics.length === 0) {
    if (query) {
      const localeData = locale === 'ko' ? 'ko' : 'en';
      return (
        <EmptyState
          heading={t('empty.noResults', { query })}
          body=""
          actionLabel={t('empty.clearSearch')}
          onAction={onClearQuery}
        />
      );
    }
    return (
      <EmptyState
        heading={t('empty.noFavorites')}
        body=""
        actionLabel=""
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {topics.map((topic) => (
        <TopicCard
          key={topic.slug}
          topic={topic}
          isFavorited={favorites.includes(topic.slug)}
          isSelected={selectedSlug === topic.slug}
          onSelect={() => onSelect(topic.slug)}
          onToggleFavorite={() => onToggleFavorite(topic.slug)}
          locale={locale}
        />
      ))}
    </div>
  );
}
