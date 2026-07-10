'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FavoriteButtonProps {
  slug: string;
  name: string;
  isFavorited: boolean;
  onToggle: (slug: string) => void;
  testId?: string;
}

/**
 * FavoriteButton: Heart icon button to toggle favorite status.
 * Non-interactive component — 44px target, aria-pressed, no navigation.
 */
export function FavoriteButton({
  slug,
  name,
  isFavorited,
  onToggle,
  testId,
}: FavoriteButtonProps): React.ReactNode {
  const t = useTranslations('home.favorites');

  const ariaLabel = isFavorited
    ? t('removeAria', { name })
    : t('addAria', { name });

  const handleClick = () => {
    onToggle(slug);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorited}
      aria-label={ariaLabel}
      data-testid={testId}
      className={`
        w-11 h-11
        flex items-center justify-center
        rounded-lg
        transition-colors duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-focus-ring
        hover:bg-surface-sunken
        ${
          isFavorited
            ? 'text-accent-rose'
            : 'text-text-muted'
        }
      `}
    >
      <Heart
        className="w-5 h-5"
        fill={isFavorited ? 'currentColor' : 'none'}
        strokeWidth={isFavorited ? 0 : 2}
      />
    </button>
  );
}
