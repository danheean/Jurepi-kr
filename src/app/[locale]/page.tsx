import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { tools } from '@/tools/registry';

export default function HomePage() {
  const t = useTranslations('home');

  // Get the ladder tool
  const ladderTool = tools.find((tool) => tool.slug === 'ladder');

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-container px-6 py-16">
        {/* Hero Section */}
        <div className="mb-24 text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-brand">
            {t('eyebrow')}
          </p>
          <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-text">
            {t('headline')}
          </h1>
          <p className="mb-12 text-lg text-text-secondary">{t('subhead')}</p>
        </div>

        {/* Tool Grid (Minimal) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ladderTool && ladderTool.status === 'live' && (
            <Link href={`/tools/${ladderTool.slug}`}>
              <div className="group overflow-hidden rounded-xl border border-hairline bg-surface p-6 shadow-card transition-all duration-200 hover:border-brand-soft hover:shadow-card-hover hover:-translate-y-1">
                {/* Icon Tile */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent-coral-soft text-accent-coral">
                  {/* Placeholder for icon */}
                </div>

                {/* Badge */}
                <div className="mb-2 inline-block rounded-full bg-accent-mint-soft px-2 py-1 text-xs font-bold uppercase text-accent-mint">
                  NEW
                </div>

                {/* Title & Description */}
                <h2 className="mb-2 text-lg font-bold text-text">
                  사다리 타기
                </h2>
                <p className="text-sm text-text-secondary">
                  Ladder game - Ghost Leg. Coming soon!
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
