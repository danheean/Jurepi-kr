import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { SpeedQuizFaq } from './SpeedQuizFaq';

const messagesKo = koMessages as any;
const messagesEn = enMessages as any;

function renderFaq(locale = 'ko', messages = messagesKo) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SpeedQuizFaq />
    </NextIntlClientProvider>
  );
}

describe('SpeedQuizFaq', () => {
  it('renders the FAQ section with heading', () => {
    renderFaq('ko');
    const heading = screen.getByRole('heading', { name: /자주 묻는 질문/ });
    expect(heading).toBeInTheDocument();
  });

  it('renders FAQ items as details elements', () => {
    const { container } = renderFaq('ko');
    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThan(0);
  });

  it('renders question as summary inside details', () => {
    const { container } = renderFaq('ko');
    const summaries = container.querySelectorAll('details > summary');
    expect(summaries.length).toBeGreaterThan(0);
    summaries.forEach((summary) => {
      expect(summary).toHaveClass('font-semibold', 'cursor-pointer');
    });
  });

  it('renders answer as paragraph inside details', () => {
    const { container } = renderFaq('ko');
    const paragraphs = container.querySelectorAll('details > p');
    expect(paragraphs.length).toBeGreaterThan(0);
    paragraphs.forEach((p) => {
      expect(p).toHaveClass('mt-3', 'text-text-secondary', 'leading-relaxed');
    });
  });

  it('injects FAQPage JSON-LD schema', () => {
    const { container } = renderFaq('ko');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toBeDefined();
      expect(Array.isArray(schema.mainEntity)).toBe(true);
      expect(schema.mainEntity.length).toBeGreaterThan(0);

      // Verify each question follows FAQPage schema
      schema.mainEntity.forEach((entity: any) => {
        expect(entity['@type']).toBe('Question');
        expect(entity.name).toBeDefined();
        expect(entity.acceptedAnswer).toBeDefined();
        expect(entity.acceptedAnswer['@type']).toBe('Answer');
        expect(entity.acceptedAnswer.text).toBeDefined();
      });
    }
  });

  it('renders with proper semantic structure', () => {
    const { container } = renderFaq('ko');
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby');
    expect(section).toHaveClass('space-y-6', 'mt-12', 'mb-8', 'border-t', 'pt-8');
  });

  it('renders in English when locale is en', () => {
    const { container } = renderFaq('en', messagesEn);
    const heading = container.querySelector('h2');
    expect(heading).toBeInTheDocument();
  });

  it('renders FAQ items with at least 5 questions', () => {
    const { container } = renderFaq('ko');
    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThanOrEqual(5);
  });

  it('has collapsible details elements', () => {
    const { container } = renderFaq('ko');
    const details = container.querySelectorAll('details');
    // All details should be collapsed initially (open attribute not set)
    details.forEach((detail) => {
      expect(detail).not.toHaveAttribute('open');
    });
  });

  it('renders question-answer pairs in JSON-LD', () => {
    const { container } = renderFaq('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      const visibleQuestions = container.querySelectorAll('summary');

      // Verify at least as many JSON-LD items as visible questions
      expect(schema.mainEntity.length).toBe(visibleQuestions.length);
    }
  });

  it('renders FAQ items with proper styling', () => {
    const { container } = renderFaq('ko');
    const details = container.querySelectorAll('details');

    details.forEach((detail) => {
      expect(detail).toHaveClass('border', 'border-hairline', 'rounded-lg', 'p-4');
    });
  });
});
