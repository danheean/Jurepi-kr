import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { Base64EncoderHowTo } from './Base64EncoderHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('Base64EncoderHowTo', () => {
  it('renders all four reference sub-sections in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <Base64EncoderHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['base64-encoder'].howTo;
    expect(screen.getByRole('heading', { level: 2, name: howTo.title })).toBeInTheDocument();
    for (const title of [howTo.whatIsTitle, howTo.howToTitle, howTo.useCasesTitle, howTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText(/브라우저 안에서 이뤄집니다/)).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <Base64EncoderHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesEn.tools['base64-encoder'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
