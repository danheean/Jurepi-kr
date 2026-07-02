import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { SpeedQuizHowTo } from './SpeedQuizHowTo';

const messagesKo = koMessages as any;
const messagesEn = enMessages as any;

function renderHowTo(locale = 'ko', messages = messagesKo) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SpeedQuizHowTo />
    </NextIntlClientProvider>
  );
}

describe('SpeedQuizHowTo', () => {
  it('renders the howTo section with heading', () => {
    renderHowTo('ko');
    const heading = screen.getByRole('heading', {
      name: /스피드퀴즈 사용 방법/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the lead paragraph', () => {
    const { container } = renderHowTo('ko');
    expect(container.textContent).toContain('진행자가 주도하는');
  });

  it('renders an ordered list of steps', () => {
    const { container } = renderHowTo('ko');
    const ol = container.querySelector('ol');
    expect(ol).toBeInTheDocument();
    expect(ol).toHaveClass('list-decimal');
  });

  it('renders step items', () => {
    const { container } = renderHowTo('ko');
    const items = container.querySelectorAll('ol > li');
    expect(items.length).toBeGreaterThan(0);
  });

  it('renders step titles as h3 headings', () => {
    const { container } = renderHowTo('ko');
    const h3s = container.querySelectorAll('ol li h3');
    expect(h3s.length).toBeGreaterThan(0);
    h3s.forEach((h3) => {
      expect(h3).toHaveClass('font-semibold', 'text-xl', 'text-text');
    });
  });

  it('renders step bodies as paragraphs', () => {
    const { container } = renderHowTo('ko');
    const paragraphs = container.querySelectorAll('ol li p');
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('has semantic section wrapper with aria-labelledby', () => {
    const { container } = renderHowTo('ko');
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby');
  });

  it('renders in English when locale is en', () => {
    const { container } = renderHowTo('en', messagesEn);
    const heading = container.querySelector('h2');
    expect(heading).toBeInTheDocument();
    // Step content should be in English
    expect(container.textContent).toContain('Speed Quiz');
  });

  it('applies proper styling classes', () => {
    const { container } = renderHowTo('ko');
    const section = container.querySelector('section');
    expect(section).toHaveClass('space-y-8', 'mt-12', 'mb-8', 'border-t', 'pt-8');
  });

  it('renders multiple steps (at least 3)', () => {
    const { container } = renderHowTo('ko');
    const items = container.querySelectorAll('ol > li');
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it('renders answer-first style with lead paragraph first', () => {
    const { container } = renderHowTo('ko');
    const children = Array.from(container.querySelector('section')!.children);
    // Script tag comes first (FAQ schema)
    // Then h2, then p.lead, then ol
    const leadIndex = children.findIndex(
      (el) => el.tagName === 'P' && el.textContent?.includes('진행자가')
    );
    const olIndex = children.findIndex((el) => el.tagName === 'OL');
    expect(leadIndex).toBeLessThan(olIndex);
  });
});
