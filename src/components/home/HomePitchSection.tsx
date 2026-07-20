import { getTranslations } from 'next-intl/server';

type PitchItem = { title: string; description: string };

/**
 * Homepage editorial section ("Why Jurepi"). A static server component rendered
 * between the hero and the tool grid so the prerendered HTML carries real,
 * human-readable prose about what the site is, how it protects privacy, and
 * why it's free — not just a grid of tool cards. No motion, fixed layout
 * (CLS-safe), no images.
 */
export async function HomePitchSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const items = t.raw('pitch.items') as PitchItem[];

  return (
    <section
      aria-labelledby="pitch-heading"
      className="mx-auto mt-8 max-w-container border-t border-hairline px-6 pb-16 pt-12 md:px-8 md:pt-16 lg:px-12"
    >
      <h2
        id="pitch-heading"
        className="font-display text-headline font-bold text-text"
      >
        {t('pitch.heading')}
      </h2>
      <p className="mt-4 max-w-[680px] text-body-lg leading-relaxed text-text-secondary">
        {t('pitch.intro')}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <article
            key={idx}
            className="rounded-2xl border border-hairline bg-surface p-6"
          >
            <h3 className="text-card-title font-semibold text-text">
              {item.title}
            </h3>
            <p className="mt-2 text-body text-text-secondary leading-relaxed">
              {item.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-card-title font-semibold text-text">
          {t('pitch.categoriesTitle')}
        </h3>
        <p className="mt-2 max-w-[680px] text-body text-text-secondary leading-relaxed">
          {t('pitch.categoriesBody')}
        </p>
      </div>
    </section>
  );
}
