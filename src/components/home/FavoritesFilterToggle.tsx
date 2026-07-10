'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FavoritesFilterToggleProps {
  active: boolean;
  onToggle: () => void;
  testId?: string;
}

/**
 * FavoritesFilterToggle: pill button to toggle favorites filter.
 * Styled like CategoryFilter pills: active (brand) / inactive (surface-muted).
 * 16px heart icon, filled when active.
 */
export function FavoritesFilterToggle({
  active,
  onToggle,
  testId,
}: FavoritesFilterToggleProps): React.ReactNode {
  const t = useTranslations('home.favorites');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={t('filterAria')}
      data-testid={testId || 'favorites-filter-toggle'}
      className={`px-4 py-2 rounded-full text-sm transition-all duration-150 whitespace-nowrap flex items-center gap-2 ${
        active
          ? 'bg-brand text-on-brand shadow-card font-semibold'
          : 'bg-surface-muted text-text-secondary hover:bg-hairline-strong hover:text-text font-medium motion-safe:active:scale-95'
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring min-h-11 flex-shrink-0`}
    >
      <Heart
        className="w-4 h-4"
        fill={active ? 'currentColor' : 'none'}
        strokeWidth={active ? 0 : 2}
      />
      {t('filterLabel')}
    </button>
  );
}
