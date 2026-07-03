import { render, screen } from '@testing-library/react';
import { TransparentBgFaq } from '../TransparentBgFaq';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('TransparentBgFaq', () => {
  it('renders FAQ section in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgFaq />
      </NextIntlClientProvider>
    );

    // Verify H2 heading is present
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();

    // Verify section has aria-labelledby
    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'transparent-bg-faq-heading');
  });

  it('renders FAQ items with details elements', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgFaq />
      </NextIntlClientProvider>
    );

    // Verify at least 6 FAQ items as per SPEC (jsdom does not expose summary as role=button)
    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThanOrEqual(6);
  });

  it('emits exactly one FAQPage JSON-LD schema', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgFaq />
      </NextIntlClientProvider>
    );

    // Find all <script type="application/ld+json"> tags
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');

    // Filter to FAQPage only (within this component)
    const faqPageScripts = Array.from(scripts).filter((script) => {
      try {
        const json = JSON.parse(script.textContent || '{}');
        return json['@type'] === 'FAQPage';
      } catch {
        return false;
      }
    });

    expect(faqPageScripts).toHaveLength(1);
  });

  it('JSON-LD schema contains mainEntity with Question/Answer structure', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgFaq />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const json = JSON.parse(script?.textContent || '{}');
    expect(json['@type']).toBe('FAQPage');
    expect(Array.isArray(json.mainEntity)).toBe(true);
    expect(json.mainEntity.length).toBeGreaterThanOrEqual(6);

    // Verify Question/Answer structure
    json.mainEntity.forEach((item: any) => {
      expect(item['@type']).toBe('Question');
      expect(typeof item.name).toBe('string');
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(typeof item.acceptedAnswer.text).toBe('string');
    });
  });

  it('renders in English with no Korean text leak', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <TransparentBgFaq />
      </NextIntlClientProvider>
    );

    const section = screen.getByRole('heading', { level: 2 }).closest('section');
    const text = section?.textContent || '';

    // Verify no Korean characters (except in JSON-LD, which we ignore for this check)
    const koreanRegex = /[一-鿿가-힯぀-ゟ]/g;
    const koreanMatches = text.match(koreanRegex);
    expect(koreanMatches).toBeNull();
  });
});
