import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { JwtDecoderHowTo } from './JwtDecoderHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('JwtDecoderHowTo', () => {
  it('renders all five Q&A items including the added use-cases and cautions (Korean)', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <JwtDecoderHowTo />
      </NextIntlClientProvider>
    );

    const items = messagesKo.tools['jwt-decoder'].howTo.items as Array<{ q: string; a: string }>;
    expect(items.length).toBe(5);
    for (const item of items) {
      expect(screen.getByRole('heading', { level: 3, name: item.q })).toBeInTheDocument();
    }
    expect(screen.getByText(/Authorization 헤더의 토큰/)).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <JwtDecoderHowTo />
      </NextIntlClientProvider>
    );
    const items = messagesEn.tools['jwt-decoder'].howTo.items as Array<{ q: string; a: string }>;
    expect(items.length).toBe(5);
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
