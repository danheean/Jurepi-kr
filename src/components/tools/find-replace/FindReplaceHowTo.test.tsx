import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { FindReplaceHowTo } from './FindReplaceHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('FindReplaceHowTo', () => {
  it('renders the added what-is / use-cases sections and keeps steps + tips (Korean)', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <FindReplaceHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['find-replace'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.whatIsTitle })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    // Existing tips cards still render.
    for (const tip of howTo.tips as Array<{ title: string; body: string }>) {
      expect(screen.getByText(tip.title)).toBeInTheDocument();
    }
    expect(screen.getByText(/브라우저 안에서 이뤄집니다/)).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <FindReplaceHowTo />
      </NextIntlClientProvider>
    );
    const howTo = messagesEn.tools['find-replace'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
