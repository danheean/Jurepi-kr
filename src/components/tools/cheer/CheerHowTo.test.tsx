import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { CheerHowTo } from './CheerHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('CheerHowTo', () => {
  it('renders all four sections in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <CheerHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools.cheer.howTo;
    expect(
      screen.getByRole('heading', { level: 3, name: howTo.whatTitle })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: howTo.howTitle })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: howTo.tipsTitle })
    ).toBeInTheDocument();

    // Verify prose bodies render as text (not markdown)
    expect(screen.getByText(/모두의 응원은 짧은 응원 문구를/)).toBeInTheDocument();
    expect(screen.getByText(/먼저 응원 문구 칸에 보여 주고 싶은/)).toBeInTheDocument();
  });

  it('renders all sections in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <CheerHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesEn.tools.cheer.howTo;
    expect(
      screen.getByRole('heading', { level: 3, name: howTo.whatTitle })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: howTo.howTitle })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })
    ).toBeInTheDocument();

    // Check for Korean leak
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });

  it('has accessible landmark with aria-labelledby', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <CheerHowTo />
      </NextIntlClientProvider>
    );

    const section = container.querySelector(
      'section[aria-labelledby="cheer-howto-heading"]'
    );
    expect(section).toBeInTheDocument();
  });
});
