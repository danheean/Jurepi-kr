import { render, screen } from '@testing-library/react';
import { TransparentBgHowTo } from '../TransparentBgHowTo';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('TransparentBgHowTo', () => {
  it('renders how-to section in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    // Verify H2 heading is present
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();

    // Verify section has aria-labelledby
    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'transparent-bg-howto-heading');
  });

  it('renders step-by-step guides', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    // Verify H3 headings for steps (numbered 1–6)
    const h3s = screen.getAllByRole('heading', { level: 3 });
    expect(h3s.length).toBeGreaterThanOrEqual(6);
  });

  it('renders when-to-use section', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    // Verify "when to use" content is present (italicized)
    const container = screen.getByRole('heading', { level: 2 }).closest('section');
    const italicText = container?.querySelector('p.italic');
    expect(italicText).toBeInTheDocument();
  });

  it('renders in English with no Korean text leak', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    const section = screen.getByRole('heading', { level: 2 }).closest('section');
    const text = section?.textContent || '';

    // Verify no Korean characters
    const koreanRegex = /[一-鿿가-힯぀-ゟ]/g;
    const koreanMatches = text.match(koreanRegex);
    expect(koreanMatches).toBeNull();
  });
});
