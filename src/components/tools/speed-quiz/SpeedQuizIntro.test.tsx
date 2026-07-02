import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { SpeedQuizIntro } from './SpeedQuizIntro';

const messagesKo = koMessages as any;
const messagesEn = enMessages as any;

function renderIntro(locale = 'ko', messages = messagesKo) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SpeedQuizIntro />
    </NextIntlClientProvider>
  );
}

describe('SpeedQuizIntro', () => {
  it('renders an h1 with the tool title (SSR-safe, no client gate)', () => {
    const { container } = renderIntro('ko');
    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toContain('스피드퀴즈');
  });

  it('renders the Korean eyebrow', () => {
    const { container } = renderIntro('ko');
    expect(container.textContent).toContain('파티 게임 도구');
  });

  it('renders an English title when locale is en', () => {
    const { container } = renderIntro('en', messagesEn);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toContain('Speed Quiz');
  });

  it('renders a lead paragraph inside a semantic header', () => {
    const { container } = renderIntro('ko');
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    const paragraphs = header?.querySelectorAll('p');
    expect(paragraphs!.length).toBeGreaterThanOrEqual(2); // eyebrow + lead
  });

  it('applies correct styling classes', () => {
    const { container } = renderIntro('ko');
    const header = container.querySelector('header');
    expect(header).toHaveClass('space-y-4', 'mb-8');
  });

  it('renders accent-sun colored eyebrow', () => {
    const { container } = renderIntro('ko');
    const eyebrow = container.querySelector('p.text-accent-sun');
    expect(eyebrow).toBeInTheDocument();
  });

  it('renders with proper semantic structure', () => {
    const { container } = renderIntro('ko');
    const header = container.querySelector('header');
    const h1 = header?.querySelector('h1');
    const paragraphs = header?.querySelectorAll('p');

    expect(header).toBeInTheDocument();
    expect(h1).toBeInTheDocument();
    expect(paragraphs!.length).toBeGreaterThanOrEqual(2);
  });
});
