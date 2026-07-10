'use client';

import { useTranslations } from 'next-intl';
import type { SearchableTool } from '@/lib/tool-search';
import { ToolCard } from './ToolCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface ToolGridProps {
  tools: SearchableTool[];
  isFiltered: boolean;
  onReset: () => void;
  testId?: string;
  favoriteIds?: string[];
  onToggleFavorite?: (slug: string) => void;
  isEmptyBecauseFavorites?: boolean;
  onShowAll?: () => void;
}

/**
 * ToolGrid: responsive grid layout (1-col <480, 2-col 480–767, 3-col 768–1023, 4-col ≥1024).
 * Maps tools to ToolCard. Shows EmptyState if no tools and filters are active.
 * Supports favorites filtering with custom empty state.
 */
export function ToolGrid({
  tools,
  isFiltered,
  onReset,
  testId,
  favoriteIds,
  onToggleFavorite,
  isEmptyBecauseFavorites,
  onShowAll,
}: ToolGridProps): React.ReactNode {
  const t = useTranslations('emptyState');
  const tFav = useTranslations('home.favorites');

  if (tools.length === 0) {
    // Show favorites-specific empty state if filtering by favorites
    if (isEmptyBecauseFavorites && onShowAll) {
      return (
        <EmptyState
          heading={tFav('emptyHeading')}
          body={tFav('emptyBody')}
          actionLabel={tFav('showAll')}
          onAction={onShowAll}
          showMascot={true}
          testId={testId ? `${testId}-empty-favorites` : undefined}
        />
      );
    }

    // Show generic empty state otherwise
    return (
      <EmptyState
        heading={t('heading')}
        body={t('body')}
        actionLabel={t('resetButton')}
        onAction={onReset}
        showMascot={true}
        testId={testId ? `${testId}-empty` : undefined}
      />
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-container mx-auto px-6 md:px-8 lg:px-12"
      data-testid={testId}
    >
      {tools.map(tool => (
        <ToolCard
          key={tool.id}
          tool={tool}
          testId={testId ? `${testId}-card-${tool.id}` : undefined}
          isFavorited={favoriteIds?.includes(tool.slug)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
