import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { KnittingGaugeIntro } from './KnittingGaugeIntro';
import { KnittingGaugeHowTo } from './KnittingGaugeHowTo';
import koMessagesRaw from '@/i18n/messages/ko.json';
import enMessagesRaw from '@/i18n/messages/en.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enMessages = enMessagesRaw as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const koMessages = koMessagesRaw as any;

const koTool = koMessagesRaw.tools['knitting-gauge'];
const enTool = enMessagesRaw.tools['knitting-gauge'];

describe('KnittingGaugeIntro', () => {
  it('renders H1 title, eyebrow, and lead from the real ko catalog', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={koMessages}>
        <KnittingGaugeIntro />
      </NextIntlClientProvider>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: koTool.title })
    ).toBeInTheDocument();
    expect(screen.getByText(koTool.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(koTool.lead)).toBeInTheDocument();
  });

  it('has no Korean leakage in the en render', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <KnittingGaugeIntro />
      </NextIntlClientProvider>
    );
    expect(container.textContent).not.toMatch(/[가-힣]/);
  });
});

describe('KnittingGaugeHowTo', () => {
  it('renders title and all howTo paragraphs from the real ko catalog', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={koMessages}>
        <KnittingGaugeHowTo />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(koTool.howTo.title)).toBeInTheDocument();
    for (const item of koTool.howTo.items) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it('renders clean paragraphs without raw markdown markers', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <KnittingGaugeHowTo />
      </NextIntlClientProvider>
    );

    expect(enTool.howTo.items.length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/##|\*\*/);
    expect(container.textContent).not.toMatch(/[가-힣]/);
  });
});
