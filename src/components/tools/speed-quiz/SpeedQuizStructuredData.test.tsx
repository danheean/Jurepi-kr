import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { SpeedQuizStructuredData } from './SpeedQuizStructuredData';

const messagesKo = koMessages as any;
const messagesEn = enMessages as any;

function renderStructuredData(locale = 'ko', messages = messagesKo) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SpeedQuizStructuredData />
    </NextIntlClientProvider>
  );
}

describe('SpeedQuizStructuredData', () => {
  it('renders a script tag with application/ld+json', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('injects valid SoftwareApplication JSON-LD', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('SoftwareApplication');
      expect(schema.name).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.url).toBeDefined();
    }
  });

  it('includes the tool name from i18n', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      expect(schema.name).toContain('스피드퀴즈');
    }
  });

  it('includes the tool description from i18n', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      expect(schema.description).toBeTruthy();
      expect(schema.description.length).toBeGreaterThan(0);
    }
  });

  it('includes the correct URL with locale', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      expect(schema.url).toContain('ko');
      expect(schema.url).toContain('speed-quiz');
    }
  });

  it('includes applicationCategory', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      expect(schema.applicationCategory).toBe('UtilityApplication');
    }
  });

  it('includes pricing and download URL', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      expect(schema.offers).toBeDefined();
      expect(schema.offers.price).toBe('0');
      expect(schema.downloadUrl).toBe(schema.url);
    }
  });

  it('renders English version with correct locale', () => {
    const { container } = renderStructuredData('en', messagesEn);
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      expect(schema.url).toContain('en');
      expect(schema.url).toContain('speed-quiz');
    }
  });

  it('has valid schema.org structure', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);

      // Verify all required fields exist
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('SoftwareApplication');
      expect(typeof schema.name).toBe('string');
      expect(typeof schema.description).toBe('string');
      expect(typeof schema.url).toBe('string');
      expect(schema.applicationCategory).toBe('UtilityApplication');
      expect(schema.offers.price).toBe('0');
      expect(schema.operatingSystem).toBe('Any');
    }
  });

  it('url matches canonical URL structure', () => {
    const { container } = renderStructuredData('ko');
    const script = container.querySelector('script[type="application/ld+json"]');

    if (script?.textContent) {
      const schema = JSON.parse(script.textContent);
      // URL should end with /ko/tools/speed-quiz or /en/tools/speed-quiz
      expect(schema.url).toMatch(/\/(ko|en)\/tools\/speed-quiz$/);
    }
  });
});
