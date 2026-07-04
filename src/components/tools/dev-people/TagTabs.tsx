import { useTranslations } from 'next-intl';
import { TAG_VOCABULARY } from '@/lib/dev-people/schema';
import type { Tag } from './useDevPeopleCatalog';

interface TagTabsProps {
  selectedTag: Tag | undefined;
  onSelectTag: (tag: Tag | undefined) => void;
}

export function TagTabs({ selectedTag, onSelectTag }: TagTabsProps) {
  const t = useTranslations('tools.dev-people');

  const tabs: Array<{ id: string | undefined; label: string }> = [
    { id: undefined, label: t('tabs.all') },
    ...TAG_VOCABULARY.map((tag) => ({
      id: tag as Tag,
      label: t(`tags.${tag}`),
    })),
  ];

  return (
    <div
      role="group"
      aria-label={t('tabs.filterLabel')}
      className="flex flex-wrap gap-2 overflow-x-auto pb-2"
      data-testid="tag-tabs"
    >
      {tabs.map((tab) => {
        const isActive = selectedTag === tab.id;
        return (
          <button
            key={String(tab.id)}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectTag(tab.id as Tag | undefined)}
            className={`
              whitespace-nowrap px-3.5 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2
              ${
                isActive
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
              }
            `}
            data-testid={`tag-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
