import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyIpFaq } from './MyIpFaq';
import { NextIntlClientProvider } from 'next-intl';

const faqItems = [
  { q: 'Is my IP public?', a: 'Yes, your public IP is visible to websites you visit.' },
  { q: 'Can I hide my IP?', a: 'Yes, using a VPN or proxy.' },
];

const mockMessages = {
  tools: {
    'my-ip': {
      faq: {
        title: 'Frequently Asked Questions',
        items: faqItems,
      },
    },
  },
} as any;

function renderWithI18n(component: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('MyIpFaq', () => {
  it('should render FAQ title', () => {
    renderWithI18n(<MyIpFaq />);

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('should render FAQ items', () => {
    renderWithI18n(<MyIpFaq />);

    expect(screen.getByText('Is my IP public?')).toBeInTheDocument();
    expect(screen.getByText('Can I hide my IP?')).toBeInTheDocument();
  });

  it('should render FAQ answers', () => {
    renderWithI18n(<MyIpFaq />);

    expect(screen.getByText(/Yes, your public IP is visible/)).toBeInTheDocument();
    expect(screen.getByText(/Yes, using a VPN/)).toBeInTheDocument();
  });

  it('should have FAQPage JSON-LD', () => {
    const { container } = renderWithI18n(<MyIpFaq />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const schema = JSON.parse(script?.textContent || '{}');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0]['@type']).toBe('Question');
  });

  it('should have accessible aria-labelledby on section', () => {
    const { container } = renderWithI18n(<MyIpFaq />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'my-ip-faq-heading');
  });
});
