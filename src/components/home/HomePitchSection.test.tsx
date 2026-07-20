import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { HomePitchSection } from './HomePitchSection';

// Build a `t` backed by the REAL message catalog (not an inline mock) so this
// test catches i18n drift / missing keys / bilingual leakage.
type Catalog = Record<string, unknown>;
function resolve(obj: Catalog, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Catalog)?.[k], obj);
}
function makeT(catalog: Catalog, namespace: string) {
  const ns = resolve(catalog, namespace) as Catalog;
  const t = (key: string) => {
    const v = resolve(ns, key);
    return typeof v === 'string' ? v : key;
  };
  t.raw = (key: string) => resolve(ns, key);
  return t;
}

vi.mock('next-intl/server', async () => {
  const actual = await vi.importActual('next-intl/server');
  return {
    ...actual,
    getTranslations: async ({
      locale,
      namespace,
    }: {
      locale: string;
      namespace: string;
    }) => makeT((locale === 'ko' ? koMessages : enMessages) as Catalog, namespace),
  };
});

describe('HomePitchSection', () => {
  it('renders the Korean heading, intro, all item cards, and category overview', async () => {
    render(await HomePitchSection({ locale: 'ko' }));

    expect(
      screen.getByRole('heading', { name: koMessages.home.pitch.heading })
    ).toBeInTheDocument();
    expect(screen.getByText(koMessages.home.pitch.intro)).toBeInTheDocument();

    for (const item of koMessages.home.pitch.items) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }

    expect(
      screen.getByText(koMessages.home.pitch.categoriesTitle)
    ).toBeInTheDocument();
    expect(
      screen.getByText(koMessages.home.pitch.categoriesBody)
    ).toBeInTheDocument();
  });

  it('renders the English catalog with no Korean leakage', async () => {
    const { container } = render(await HomePitchSection({ locale: 'en' }));

    expect(
      screen.getByRole('heading', { name: enMessages.home.pitch.heading })
    ).toBeInTheDocument();
    // English page must not leak Hangul (bilingual-leakage guard).
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });

  it('exposes an accessible section label', async () => {
    const { container } = render(await HomePitchSection({ locale: 'ko' }));
    const section = container.querySelector('section[aria-labelledby="pitch-heading"]');
    expect(section).not.toBeNull();
  });
});
