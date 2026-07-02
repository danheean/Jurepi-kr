import { useTranslations } from 'next-intl';

interface TopicTabsProps {
  activeTab: 'all' | 'favorites' | 'recent';
  setActiveTab: (tab: 'all' | 'favorites' | 'recent') => void;
  favCount: number;
  recentCount: number;
}

/**
 * Topic filter row. This is a set of mutually-exclusive filter toggles, NOT a
 * tab widget: there is no separate tabpanel to move focus into. Modeling it as
 * `role="tablist"`/`role="tab"` misleads screen readers (they announce "tab, N
 * of M" and look for a tabpanel that doesn't exist). It's a labelled group of
 * toggle buttons carrying `aria-pressed`; Tab moves between them, Space/Enter
 * activates — standard button semantics, no roving tabindex needed.
 */
export function TopicTabs({
  activeTab,
  setActiveTab,
  favCount,
  recentCount,
}: TopicTabsProps) {
  const t = useTranslations('tools.bookmarks');

  const baseClass =
    'inline-flex items-center min-h-11 px-4 rounded-full whitespace-nowrap font-medium text-sm transition-colors';
  const stateClass = (active: boolean) =>
    active
      ? 'bg-brand text-on-brand'
      : 'bg-surface-muted text-text-secondary hover:bg-hairline-strong';

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      role="group"
      aria-label={t('tabs.filterLabel')}
    >
      {/* All */}
      <button
        type="button"
        aria-pressed={activeTab === 'all'}
        onClick={() => setActiveTab('all')}
        className={`${baseClass} ${stateClass(activeTab === 'all')}`}
      >
        {t('tabs.all')}
      </button>

      {/* Favorites */}
      {favCount > 0 && (
        <button
          type="button"
          aria-pressed={activeTab === 'favorites'}
          onClick={() => setActiveTab('favorites')}
          className={`${baseClass} ${stateClass(activeTab === 'favorites')}`}
        >
          {t('tabs.favorites')}
        </button>
      )}

      {/* Recent */}
      {recentCount > 0 && (
        <button
          type="button"
          aria-pressed={activeTab === 'recent'}
          onClick={() => setActiveTab('recent')}
          className={`${baseClass} ${stateClass(activeTab === 'recent')}`}
        >
          {t('tabs.recent')}
        </button>
      )}
    </div>
  );
}
