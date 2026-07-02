'use client';

import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  STORE_VERSION,
  BookmarksStoreSchema,
  type BookmarksStore,
  type MergedTopic,
} from '@/lib/bookmarks/schema';
import { filterTopics } from '@/lib/bookmarks/search';
import { toggleFavorite, pushRecent, pruneUnknown, RECENTS_MAX } from '@/lib/bookmarks/favorites';

const STORAGE_KEY = 'jurepi-bookmarks';
const SEARCH_DEBOUNCE = 120;

export interface UseBookmarksCatalogReturn {
  catalog: MergedTopic[];
  filtered: MergedTopic[];
  selectedSlug: string | null;
  selectedTopic: MergedTopic | null;
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  activeTab: 'all' | 'topics' | 'favorites' | 'recent';
  setActiveTab: (tab: 'all' | 'topics' | 'favorites' | 'recent') => void;
  favorites: string[];
  recents: string[];
  toggleFavorite: (slug: string) => void;
  select: (slug: string | null) => void;
}

interface State {
  catalog: MergedTopic[];
  store: BookmarksStore;
  selectedSlug: string | null;
  query: string;
  queryDraft: string;
  activeTab: 'all' | 'topics' | 'favorites' | 'recent';
  mounted: boolean;
}

type Action =
  | { type: 'SET_CATALOG'; payload: MergedTopic[] }
  | { type: 'SET_STORE'; payload: BookmarksStore }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_QUERY_DRAFT'; payload: string }
  | { type: 'COMMIT_QUERY'; payload: string }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_TAB'; payload: 'all' | 'topics' | 'favorites' | 'recent' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SYNC_STORE'; payload: BookmarksStore };

function initialState(catalog: MergedTopic[] = []): State {
  return {
    catalog,
    store: {
      version: STORE_VERSION,
      favorites: [],
      recents: [],
      meta: { createdAt: Date.now() },
    },
    selectedSlug: null,
    query: '',
    queryDraft: '',
    activeTab: 'all',
    mounted: false,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CATALOG':
      return { ...state, catalog: action.payload };
    case 'SET_STORE':
      return { ...state, store: action.payload };
    case 'SET_MOUNTED':
      return { ...state, mounted: true };
    case 'SET_QUERY_DRAFT':
      return { ...state, queryDraft: action.payload };
    case 'COMMIT_QUERY':
      return { ...state, query: action.payload };
    case 'SELECT': {
      const newStore = { ...state.store };
      if (action.payload) {
        newStore.recents = pushRecent(state.store.recents, action.payload, RECENTS_MAX);
      }
      return { ...state, selectedSlug: action.payload, store: newStore };
    }
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        store: {
          ...state.store,
          favorites: toggleFavorite(state.store.favorites, action.payload),
        },
      };
    case 'SYNC_STORE':
      return { ...state, store: action.payload };
    default:
      return state;
  }
}

export function useBookmarksCatalog(initialCatalog: MergedTopic[] = []): UseBookmarksCatalogReturn {
  const locale = useLocale() as 'ko' | 'en';
  const [state, dispatch] = useReducer(reducer, initialState(initialCatalog));

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load catalog on mount (dynamic import for code-split)
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const module = await import('./data/bookmarks.generated.json');
        const topics = (module.default || module) as MergedTopic[];
        dispatch({ type: 'SET_CATALOG', payload: topics });

        // Load localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        let store: BookmarksStore;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const validated = BookmarksStoreSchema.safeParse(parsed);
            store = validated.success ? validated.data : initialState().store;
          } catch {
            store = initialState().store;
          }
        } else {
          store = initialState().store;
        }

        // Prune unknown slugs
        store.recents = pruneUnknown(store.recents, topics);
        store.favorites = pruneUnknown(store.favorites, topics);

        dispatch({ type: 'SET_STORE', payload: store });
        dispatch({ type: 'SET_MOUNTED' });
      } catch (e) {
        // Fallback: catalog load failure, empty catalog in-memory
        dispatch({ type: 'SET_MOUNTED' });
      }
    };

    loadCatalog();
  }, []);

  // Debounced query commit (stale closure fix)
  const commitQuery = useCallback((q: string) => {
    dispatch({ type: 'COMMIT_QUERY', payload: q });
  }, []);

  // Handle query draft + debounce
  const setQueryDraft = useCallback(
    (q: string) => {
      dispatch({ type: 'SET_QUERY_DRAFT', payload: q });
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        commitQuery(q);
      }, SEARCH_DEBOUNCE);
    },
    [commitQuery]
  );

  // Persist store to localStorage immediately
  const persistStore = useCallback((storeData: BookmarksStore) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
    } catch {
      // Silent fail: quota exceeded or security error → keep in-memory.
    }
  }, []);

  // Persist when store changes
  useEffect(() => {
    if (state.mounted) {
      persistStore(state.store);
    }
  }, [state.store, state.mounted, persistStore]);

  // Compute filtered list
  const filtered = useMemo(() => {
    let result = state.catalog;

    if (state.activeTab === 'favorites') {
      result = result.filter((t) => state.store.favorites.includes(t.slug));
    } else if (state.activeTab === 'recent') {
      result = state.store.recents
        .map((slug) => state.catalog.find((t) => t.slug === slug) ?? null)
        .filter((t) => t !== null) as MergedTopic[];
    }
    // activeTab === 'all' or 'topics' both show all catalog

    return filterTopics(result, state.query, locale);
  }, [state.catalog, state.activeTab, state.query, state.store.favorites, state.store.recents, locale]);

  const selectedTopic = state.selectedSlug
    ? state.catalog.find((t) => t.slug === state.selectedSlug) ?? null
    : null;

  return {
    catalog: state.catalog,
    filtered,
    selectedSlug: state.selectedSlug,
    selectedTopic,
    query: state.queryDraft,
    setQuery: setQueryDraft,
    resultCount: filtered.length,
    activeTab: state.activeTab,
    setActiveTab: (tab) => dispatch({ type: 'SET_TAB', payload: tab }),
    favorites: state.store.favorites,
    recents: state.store.recents,
    toggleFavorite: (slug) => dispatch({ type: 'TOGGLE_FAVORITE', payload: slug }),
    select: (slug) => dispatch({ type: 'SELECT', payload: slug }),
  };
}
