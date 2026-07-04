import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyIpIntro } from './MyIpIntro';
import { NextIntlClientProvider } from 'next-intl';

const mockMessages = {
  tools: {
    'my-ip': {
      title: 'My IP Address',
      lead: 'Find your public IP',
    },
  },
};

function renderWithI18n(component: React.ReactElement, locale: string = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('MyIpIntro', () => {
  it('should render title', () => {
    renderWithI18n(<MyIpIntro />);

    expect(screen.getByText('My IP Address')).toBeInTheDocument();
  });

  it('should render lead', () => {
    renderWithI18n(<MyIpIntro />);

    expect(screen.getByText('Find your public IP')).toBeInTheDocument();
  });

  it('should show correct eyebrow for en locale', () => {
    renderWithI18n(<MyIpIntro />, 'en');

    expect(screen.getByText(/Developer Tool/i)).toBeInTheDocument();
  });

  it('should show correct eyebrow for ko locale', () => {
    renderWithI18n(<MyIpIntro />, 'ko');

    expect(screen.getByText('개발 도구')).toBeInTheDocument();
  });

  it('should render h1 semantic', () => {
    renderWithI18n(<MyIpIntro />);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });
});
