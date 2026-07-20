import { render } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { absoluteSiteUrl } from '@/lib/seo';
import { HomeStructuredData } from './HomeStructuredData';

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

function parseJsonLd(container: HTMLElement): Record<string, unknown>[] {
  return Array.from(
    container.querySelectorAll('script[type="application/ld+json"]')
  ).map((s) => JSON.parse(s.textContent ?? '{}'));
}

describe('HomeStructuredData', () => {
  it('emits valid Organization and WebSite JSON-LD with canonical-matching URL', async () => {
    const { container } = render(await HomeStructuredData({ locale: 'ko' }));
    const blocks = parseJsonLd(container);
    const homeUrl = absoluteSiteUrl('ko');

    const org = blocks.find((b) => b['@type'] === 'Organization');
    const site = blocks.find((b) => b['@type'] === 'WebSite');

    expect(org).toBeDefined();
    expect(site).toBeDefined();
    expect(org!.name).toBe('Jurepi');
    expect(org!.url).toBe(homeUrl);
    expect(site!.url).toBe(homeUrl);
  });

  it('never exposes a Person schema (operator stays pseudonymous)', async () => {
    const { container } = render(await HomeStructuredData({ locale: 'ko' }));
    const blocks = parseJsonLd(container);
    expect(blocks.some((b) => b['@type'] === 'Person')).toBe(false);
  });

  it('WebSite includes a SearchAction pointing at the ?q= homepage query', async () => {
    const { container } = render(await HomeStructuredData({ locale: 'en' }));
    const site = parseJsonLd(container).find((b) => b['@type'] === 'WebSite');
    const action = site!.potentialAction as Record<string, unknown>;
    expect(action['@type']).toBe('SearchAction');
    const target = action.target as Record<string, unknown>;
    expect(String(target.urlTemplate)).toContain('?q={search_term_string}');
  });
});
