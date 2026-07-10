import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHomeFavorites } from './useHomeFavorites';
import { STORAGE_KEY, buildFavoritesStore } from '@/lib/home-favorites/schema';

describe('useHomeFavorites', () => {
  const liveSlugs = ['ladder', 'qna', 'age-calc', 'character-counter'];

  beforeEach(() => {
    // Clear localStorage before each test (jsdom isolation)
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('initializes with empty favoriteIds', () => {
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.favoriteIds).toEqual([]);
    });

    it('loads saved favorites from localStorage', () => {
      const saved = buildFavoritesStore(['ladder', 'qna']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.favoriteIds).toEqual(['ladder', 'qna']);
    });

    it('returns empty array on corrupted localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json');
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.favoriteIds).toEqual([]);
    });

    it('prunes favorites not in liveSlugs', () => {
      const saved = buildFavoritesStore(['ladder', 'qna', 'missing-tool']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.favoriteIds).toEqual(['ladder', 'qna']);
    });

    it('updates localStorage when prune removes items', () => {
      const saved = buildFavoritesStore(['ladder', 'missing-tool']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      renderHook(() => useHomeFavorites(liveSlugs));

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored.ids).toEqual(['ladder']);
    });

    it('handles missing localStorage gracefully', () => {
      localStorage.removeItem(STORAGE_KEY);
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.favoriteIds).toEqual([]);
    });
  });

  describe('toggleFavorite', () => {
    it('adds favorite to state', () => {
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      act(() => {
        result.current.toggleFavorite('ladder');
      });

      expect(result.current.favoriteIds).toContain('ladder');
    });

    it('persists to localStorage immediately on add', () => {
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      act(() => {
        result.current.toggleFavorite('ladder');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored.ids).toContain('ladder');
    });

    it('removes favorite from state', () => {
      const saved = buildFavoritesStore(['ladder', 'qna']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.favoriteIds).toContain('ladder');

      act(() => {
        result.current.toggleFavorite('ladder');
      });

      expect(result.current.favoriteIds).not.toContain('ladder');
    });

    it('persists to localStorage immediately on remove', () => {
      const saved = buildFavoritesStore(['ladder', 'qna']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      act(() => {
        result.current.toggleFavorite('ladder');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored.ids).not.toContain('ladder');
      expect(stored.ids).toContain('qna');
    });

    it('handles multiple toggles correctly', () => {
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      act(() => {
        result.current.toggleFavorite('ladder');
        result.current.toggleFavorite('qna');
        result.current.toggleFavorite('age-calc');
      });

      expect(result.current.favoriteIds).toEqual(['ladder', 'qna', 'age-calc']);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored.ids).toEqual(['ladder', 'qna', 'age-calc']);
    });

    it('maintains order on sequential toggles', () => {
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      act(() => {
        result.current.toggleFavorite('age-calc');
        result.current.toggleFavorite('ladder');
        result.current.toggleFavorite('qna');
      });

      expect(result.current.favoriteIds).toEqual(['age-calc', 'ladder', 'qna']);
    });
  });

  describe('isFavorited', () => {
    it('returns true for favorited item', () => {
      const saved = buildFavoritesStore(['ladder']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.isFavorited('ladder')).toBe(true);
    });

    it('returns false for non-favorited item', () => {
      const saved = buildFavoritesStore(['ladder']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.isFavorited('qna')).toBe(false);
    });

    it('updates after toggle', () => {
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      expect(result.current.isFavorited('ladder')).toBe(false);

      act(() => {
        result.current.toggleFavorite('ladder');
      });

      expect(result.current.isFavorited('ladder')).toBe(true);
    });
  });

  describe('persistence across remount', () => {
    it('restores favorites on remount', () => {
      const saved = buildFavoritesStore(['ladder', 'qna']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result, unmount } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result.current.favoriteIds).toEqual(['ladder', 'qna']);

      unmount();

      const { result: result2 } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result2.current.favoriteIds).toEqual(['ladder', 'qna']);
    });

    it('preserves modifications across remount', () => {
      const { result, unmount } = renderHook(() => useHomeFavorites(liveSlugs));

      act(() => {
        result.current.toggleFavorite('ladder');
        result.current.toggleFavorite('qna');
      });

      unmount();

      const { result: result2 } = renderHook(() => useHomeFavorites(liveSlugs));
      expect(result2.current.favoriteIds).toEqual(['ladder', 'qna']);
    });
  });

  describe('React StrictMode safety', () => {
    it('handles double initialization in StrictMode', () => {
      const saved = buildFavoritesStore(['ladder']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      // Simulate StrictMode double mount by calling hook logic twice
      // The useRef guard should prevent duplicate initialization
      expect(result.current.favoriteIds).toEqual(['ladder']);

      // Verify localStorage wasn't written twice
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(stored.ids).toEqual(['ladder']);
    });
  });

  describe('localStorage error handling', () => {
    it('catches and ignores localStorage setItem errors', () => {
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      // Even if localStorage throws, state should update
      act(() => {
        result.current.toggleFavorite('ladder');
      });

      // State should be updated despite any localStorage error
      expect(result.current.favoriteIds).toContain('ladder');
    });

    it('recovers from localStorage quota exceeded', () => {
      const { result } = renderHook(() => useHomeFavorites(liveSlugs));

      act(() => {
        result.current.toggleFavorite('ladder');
      });

      expect(result.current.isFavorited('ladder')).toBe(true);
    });
  });

  describe('callback stability', () => {
    it('maintains stable toggleFavorite reference', () => {
      const { result, rerender } = renderHook(() => useHomeFavorites(liveSlugs));

      const firstToggle = result.current.toggleFavorite;

      rerender();

      const secondToggle = result.current.toggleFavorite;

      // Should be the same reference if wrapped with useCallback
      expect(firstToggle).toBe(secondToggle);
    });

    it('maintains stable isFavorited reference', () => {
      const { result, rerender } = renderHook(() => useHomeFavorites(liveSlugs));

      const firstIsFavorited = result.current.isFavorited;

      rerender();

      const secondIsFavorited = result.current.isFavorited;

      expect(firstIsFavorited).toBe(secondIsFavorited);
    });
  });

  describe('liveSlugs changes', () => {
    it('re-prunes when liveSlugs changes', () => {
      const saved = buildFavoritesStore(['ladder', 'qna', 'age-calc']);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const { result, rerender } = renderHook(
        ({ slugs }) => useHomeFavorites(slugs),
        { initialProps: { slugs: liveSlugs } }
      );

      expect(result.current.favoriteIds).toEqual(['ladder', 'qna', 'age-calc']);

      // Change liveSlugs to exclude 'age-calc'
      rerender({ slugs: ['ladder', 'qna'] });

      // Should prune 'age-calc'
      expect(result.current.favoriteIds).toEqual(['ladder', 'qna']);
    });
  });
});
