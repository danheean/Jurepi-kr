import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { MyIpHowTo } from './MyIpHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('MyIpHowTo', () => {
  it('renders all six concept sections from the real catalog (Korean)', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <MyIpHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['my-ip'].howTo;
    expect(screen.getByRole('heading', { level: 2, name: howTo.title })).toBeInTheDocument();
    for (const key of ['whatIsIp', 'ipv4VsIpv6', 'publicVsPrivate', 'dynamicVsStatic', 'useCases', 'tips'] as const) {
      expect(
        screen.getByRole('heading', { level: 3, name: (howTo as any)[key].title })
      ).toBeInTheDocument();
    }
    // Added use-cases prose renders (not just the key).
    expect(screen.getByText(/공유기에 포트를 설정/)).toBeInTheDocument();
  });

  it('has an accessible section (aria-labelledby)', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <MyIpHowTo />
      </NextIntlClientProvider>
    );
    expect(container.querySelector('section')).toHaveAttribute(
      'aria-labelledby',
      'my-ip-howto-heading'
    );
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <MyIpHowTo />
      </NextIntlClientProvider>
    );
    const howTo = messagesEn.tools['my-ip'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCases.title })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
