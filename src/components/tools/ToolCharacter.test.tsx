import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { ToolCharacter } from './ToolCharacter';

function renderWithLocale(node: React.ReactNode, locale: 'ko' | 'en') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages as never}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('ToolCharacter', () => {
  it('renders the slug-derived character asset', () => {
    renderWithLocale(<ToolCharacter slug="roulette" />, 'ko');
    const img = screen.getByRole('img');
    // jsdom applies next/image URL encoding; decode to assert the source path
    // (production serves it raw via images.unoptimized).
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(
      '/characters/roulette.webp'
    );
  });

  it('localizes the alt text against the real ko catalog', () => {
    renderWithLocale(<ToolCharacter slug="ladder" />, 'ko');
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Jurepi 캐릭터');
  });

  it('localizes the alt text against the real en catalog', () => {
    renderWithLocale(<ToolCharacter slug="ladder" />, 'en');
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Jurepi character');
  });

  it('renders a square avatar (width === height) so square assets are not distorted', () => {
    renderWithLocale(<ToolCharacter slug="ladder" />, 'ko');
    const img = screen.getByRole('img');
    expect(img.getAttribute('width')).toBe(img.getAttribute('height'));
  });

  it('uses the small beside-title avatar size by default', () => {
    renderWithLocale(<ToolCharacter slug="ladder" />, 'ko');
    const img = screen.getByRole('img');
    expect(img.className).toContain('w-[64px]');
    expect(img.className).toContain('sm:w-[72px]');
  });

  it('honors an explicit alt override (e.g. the home welcome pose)', () => {
    renderWithLocale(
      <ToolCharacter slug="home" alt="Jurepi mascot" />,
      'en'
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Jurepi mascot');
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(
      '/characters/home.webp'
    );
  });
});
