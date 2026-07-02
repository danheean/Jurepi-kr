'use client';

import { Star } from 'lucide-react';
import type { MergedDeck } from '@/lib/speed-quiz/schema';

interface DeckCardProps {
  deck: MergedDeck;
  isFavorite: boolean;
  onFavorite: () => void;
  onSelect: () => void;
  wordCountLabel: string;
  addFavoriteLabel: string;
  removeFavoriteLabel: string;
  difficultyLabel: string;
}

/**
 * Individual deck card: title, category badge, difficulty stars, word count, favorite toggle.
 * ≥48px tap targets, hover/focus/press states.
 */
export function DeckCard({
  deck,
  isFavorite,
  onFavorite,
  onSelect,
  wordCountLabel,
  addFavoriteLabel,
  removeFavoriteLabel,
  difficultyLabel,
}: DeckCardProps) {
  // Difficulty stars
  const stars =
    deck.difficulty === 'easy'
      ? '⭐'
      : deck.difficulty === 'normal'
        ? '⭐⭐'
        : '⭐⭐⭐';

  // Accent color per category
  const accentClass = {
    animals: 'bg-accent-coral-soft',
    food: 'bg-accent-mint-soft',
    sports: 'bg-accent-sky-soft',
    movies: 'bg-accent-sun-soft',
    kpop: 'bg-accent-grape-soft',
    countries: 'bg-accent-sky-soft',
    jobs: 'bg-accent-coral-soft',
    brands: 'bg-accent-sun-soft',
    proverbs: 'bg-accent-grape-soft',
    'historical-figures': 'bg-accent-rose-soft',
  }[deck.category] || 'bg-accent-sun-soft';

  const textClass = {
    animals: 'text-accent-coral',
    food: 'text-accent-mint-ink',
    sports: 'text-accent-sky',
    movies: 'text-accent-sun-ink',
    kpop: 'text-accent-grape-ink',
    countries: 'text-accent-sky',
    jobs: 'text-accent-coral',
    brands: 'text-accent-sun-ink',
    proverbs: 'text-accent-grape-ink',
    'historical-figures': 'text-accent-rose-ink',
  }[deck.category] || 'text-accent-sun-ink';

  return (
    <div
      className="bg-surface border border-hairline rounded-lg p-5 hover:shadow-card-hover transition-shadow cursor-pointer"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          onSelect();
        }
      }}
      data-testid={`deck-card-${deck.slug}`}
    >
      {/* Header: Title + Favorite button */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-lg font-bold text-text line-clamp-2 flex-1">
          {deck[window.location.pathname.includes('/en') ? 'en' : 'ko'].title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          className="flex-shrink-0 p-2 hover:bg-surface-muted rounded-lg transition-colors"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? removeFavoriteLabel : addFavoriteLabel}
          data-testid={`deck-favorite-${deck.slug}`}
        >
          <Star
            size={20}
            className={`${
              isFavorite
                ? 'fill-brand text-brand'
                : 'text-text-secondary hover:text-text'
            } transition-colors`}
          />
        </button>
      </div>

      {/* Category badge */}
      <div className="mb-3">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${accentClass} ${textClass}`}
        >
          {deck.category}
        </span>
      </div>

      {/* Difficulty stars + Word count */}
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{stars}</span>
        <span>{wordCountLabel}</span>
      </div>
    </div>
  );
}
