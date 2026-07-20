import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { CounterHowTo } from './CounterHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('CounterHowTo', () => {
  it('renders the reference sub-sections and the four numbered steps (Korean)', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <CounterHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['character-counter'].howTo;
    expect(screen.getByRole('heading', { level: 2, name: howTo.title })).toBeInTheDocument();
    for (const title of [howTo.whatIsTitle, howTo.stepsTitle, howTo.useCasesTitle, howTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
    // The four numbered steps still render.
    for (const s of howTo.steps) {
      expect(screen.getByText(s.text)).toBeInTheDocument();
    }
    expect(screen.getByText(/브라우저 안에서 이뤄집니다/)).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <CounterHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesEn.tools['character-counter'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
