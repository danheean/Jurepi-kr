'use client';

import { useTranslations } from 'next-intl';
import type { CategoryOption } from '@/lib/tool-search';

interface CategoryFilterProps {
  categories: CategoryOption[];
  active: CategoryOption['id'];
  onChange: (id: CategoryOption['id']) => void;
  trailing?: React.ReactNode;
}

/**
 * CategoryFilter: horizontal pill row, scroll-snap on mobile.
 * Inactive: surface-muted bg + text-secondary.
 * Active: brand bg + white text.
 * Each pill is a ≥44px button.
 * Optional trailing element (e.g., FavoritesFilterToggle) renders in a fixed
 * slot OUTSIDE the scroll container so it stays visible on narrow viewports
 * (categories scroll beside it; the trailing control never hides behind the
 * horizontal scroll).
 */
export function CategoryFilter({
  categories,
  active,
  onChange,
  trailing,
}: CategoryFilterProps): React.ReactNode {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-container w-full flex items-start gap-3 px-6 md:px-8 lg:px-12">
      <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-2 min-w-max md:min-w-0 md:flex-wrap">
          {categories.map(cat => {
            const isActive = cat.id === active;
            return (
              <button
                key={cat.id}
                onClick={() => onChange(cat.id)}
                aria-pressed={isActive}
                className={`px-4 py-2 rounded-full text-sm transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-brand text-on-brand shadow-card font-semibold'
                    : 'bg-surface-muted text-text-secondary hover:bg-hairline-strong hover:text-text font-medium motion-safe:active:scale-95'
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring min-h-11 flex items-center justify-center`}
              >
                {t(cat.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      {trailing && <div className="shrink-0 pb-2">{trailing}</div>}
    </div>
  );
}
