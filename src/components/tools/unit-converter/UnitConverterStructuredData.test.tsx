import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { UnitConverterStructuredData } from './UnitConverterStructuredData';
import koMessagesRaw from '@/i18n/messages/ko.json';
import enMessagesRaw from '@/i18n/messages/en.json';

// next-intl's AbstractIntlMessages rejects arrays-of-objects (e.g. useCases.items);
// the full catalog is valid at runtime, so cast like test-utils' own `defaultMessages as any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enMessages = enMessagesRaw as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const koMessages = koMessagesRaw as any;

describe('UnitConverterStructuredData', () => {
  it('renders SoftwareApplication JSON-LD with correct url', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <UnitConverterStructuredData />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const jsonLd = JSON.parse(script?.textContent || '{}');
    expect(jsonLd['@type']).toBe('SoftwareApplication');
    expect(jsonLd.name).toBe('Unit Converter');
    expect(jsonLd.url).toContain('unit-converter');
  });

  it('renders with Korean locale', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={koMessages}>
        <UnitConverterStructuredData />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script?.textContent || '{}');
    expect(jsonLd.name).toBe('단위 변환기');
    expect(jsonLd.url).toContain('unit-converter');
  });

  it('emits exactly one SoftwareApplication JSON-LD', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <UnitConverterStructuredData />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(1);
  });
});
