'use client';

import { useTranslations } from 'next-intl';
import type { TopicTab } from '@/lib/howto/schema';

const TOPICS: readonly TopicTab[] = ['all', 'setup', 'ai-tools', 'git', 'api', 'cli', 'deploy'] as const;

interface TopicTabsProps {
  activeTopic: TopicTab;
  setActiveTopic: (topic: TopicTab) => void;
  favCount: number;
  recentCount: number;
}

export function TopicTabs({ activeTopic, setActiveTopic, favCount, recentCount }: TopicTabsProps) {
  const t = useTranslations('tools.howto');

  const tabs: Array<{ id: TopicTab; label: string }> = TOPICS.map(topic => ({
    id: topic,
    label: topic === 'all' ? t('tabs.all') : t(`topics.${topic}`),
  })).concat([
    ...(favCount > 0 ? [{ id: 'favorites' as const, label: t('tabs.favorites') }] : []),
    ...(recentCount > 0 ? [{ id: 'recent' as const, label: t('tabs.recent') }] : []),
  ]);

  return (
    // Filter chips (not ARIA tabs — they narrow a list, they don't switch panels),
    // so each is a toggle button with aria-pressed rather than role="tab".
    <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label={t('tabs.label')}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTopic(tab.id)}
          className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
            activeTopic === tab.id
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
          }`}
          aria-pressed={activeTopic === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
