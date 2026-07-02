import { useTranslations } from 'next-intl';
import { Star, Bookmark } from 'lucide-react';
import type { MergedTopic } from '@/lib/bookmarks/schema';

interface TopicCardProps {
  topic: MergedTopic;
  isFavorited: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  locale: 'ko' | 'en';
}

export function TopicCard({
  topic,
  isFavorited,
  isSelected,
  onSelect,
  onToggleFavorite,
  locale,
}: TopicCardProps) {
  const t = useTranslations('tools.bookmarks');

  const localeData = locale === 'ko' ? topic.ko : topic.en;

  // Count total links across all sections
  const totalLinks = localeData.sections.reduce((sum, section) => sum + section.links.length, 0);
  const sectionCount = localeData.sections.length;

  return (
    // Non-interactive container. The whole-card click target is the title
    // button's stretched ::after (relative container + after:inset-0); the
    // favorite button sits above it via z-10. This keeps the two actions as
    // DOM siblings — no interactive element nested inside another.
    <article
      className={`relative p-4 rounded-xl border-2 shadow-card transition-[color,box-shadow,border-color,transform] duration-200 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        isSelected
          ? 'border-accent-sky-ink bg-accent-sky-soft shadow-card-hover'
          : 'border-hairline bg-surface hover:-translate-y-0.5 hover:shadow-card-hover hover:border-hairline-strong'
      }`}
    >
      {/* Header: accent icon tile + title + favorite button */}
      <div className="flex items-start gap-3 mb-3">
        <span
          className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-sky-soft text-accent-sky-ink"
          aria-hidden="true"
        >
          <Bookmark className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="leading-tight">
            <button
              type="button"
              onClick={onSelect}
              aria-pressed={isSelected}
              className="text-left font-bold text-lg text-text after:absolute after:inset-0 after:rounded-xl after:content-[''] cursor-pointer"
            >
              {localeData.title}
            </button>
          </h3>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorited}
          aria-label={t('list.toggleFavorite')}
          className="relative z-10 flex-shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 hover:bg-surface-muted rounded-lg transition-colors"
        >
          <Star
            className={`w-5 h-5 ${
              isFavorited
                ? 'fill-accent-sky-ink text-accent-sky-ink'
                : 'text-text-secondary hover:text-accent-sky-ink'
            }`}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary mb-2.5 line-clamp-2">
        {localeData.description}
      </p>

      {/* Section and link count tag */}
      <div className="text-xs text-text-secondary pt-2 border-t border-hairline">
        {t('list.itemCount', {
          sections: sectionCount,
          links: totalLinks,
        })}
      </div>
    </article>
  );
}
