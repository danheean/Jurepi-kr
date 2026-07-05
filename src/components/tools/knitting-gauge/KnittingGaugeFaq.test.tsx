import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { KnittingGaugeFaq } from './KnittingGaugeFaq';
import koMessagesRaw from '@/i18n/messages/ko.json';
import enMessagesRaw from '@/i18n/messages/en.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enMessages = enMessagesRaw as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const koMessages = koMessagesRaw as any;

describe('KnittingGaugeFaq', () => {
  it('renders visible FAQ items from the real ko catalog', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={koMessages}>
        <KnittingGaugeFaq />
      </NextIntlClientProvider>
    );

    const koFaq = koMessagesRaw.tools['knitting-gauge'].faq;
    expect(screen.getByText(koFaq.title)).toBeInTheDocument();
    for (const item of koFaq.items) {
      expect(screen.getByText(item.q)).toBeInTheDocument();
    }
  });

  it('emits exactly one FAQPage JSON-LD matching the visible items', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <KnittingGaugeFaq />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(1);

    const jsonLd = JSON.parse(scripts[0]?.textContent || '{}');
    expect(jsonLd['@type']).toBe('FAQPage');

    const enItems = enMessagesRaw.tools['knitting-gauge'].faq.items;
    expect(jsonLd.mainEntity).toHaveLength(enItems.length);
    expect(jsonLd.mainEntity[0]['@type']).toBe('Question');
    expect(jsonLd.mainEntity[0].name).toBe(enItems[0].q);
    expect(jsonLd.mainEntity[0].acceptedAnswer.text).toBe(enItems[0].a);
  });

  it('has no Korean leakage in the en render', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <KnittingGaugeFaq />
      </NextIntlClientProvider>
    );
    expect(container.textContent).not.toMatch(/[가-힣]/);
  });
});
