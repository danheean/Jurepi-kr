'use client';

import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { CheerFaq } from './CheerFaq';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('CheerFaq', () => {
  it('renders FAQPage JSON-LD with exactly 6 questions in Korean', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <CheerFaq />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    let faqFound = false;

    Array.from(scripts).forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '{}');
        if (data['@type'] === 'FAQPage') {
          faqFound = true;
          expect(data.mainEntity).toHaveLength(6);
          expect(data.mainEntity[0]).toHaveProperty('name');
          expect(data.mainEntity[0]).toHaveProperty('acceptedAnswer');
          expect(data.mainEntity[0].acceptedAnswer).toHaveProperty('text');
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    expect(faqFound).toBe(true);
  });

  it('renders all 6 visible FAQ questions and answers in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <CheerFaq />
      </NextIntlClientProvider>
    );

    const faqItems = messagesKo.tools.cheer.faq.items;
    expect(faqItems).toHaveLength(6);

    faqItems.forEach((item: { q: string; a: string }) => {
      expect(screen.getByText(item.q)).toBeInTheDocument();
      expect(screen.getByText(item.a)).toBeInTheDocument();
    });
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <CheerFaq />
      </NextIntlClientProvider>
    );

    const faqItems = messagesEn.tools.cheer.faq.items;
    faqItems.forEach((item: { q: string; a: string }) => {
      expect(screen.getByText(item.q)).toBeInTheDocument();
      expect(screen.getByText(item.a)).toBeInTheDocument();
    });

    // Check for Korean leak
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });

  it('has accessible landmark with aria-labelledby', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <CheerFaq />
      </NextIntlClientProvider>
    );

    const section = container.querySelector(
      'section[aria-labelledby="cheer-faq-heading"]'
    );
    expect(section).toBeInTheDocument();
  });

  it('renders FAQ heading from catalog', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <CheerFaq />
      </NextIntlClientProvider>
    );

    const heading = messagesKo.tools.cheer.faq.heading;
    expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
  });
});
