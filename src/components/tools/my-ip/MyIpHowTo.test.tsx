import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyIpHowTo } from './MyIpHowTo';
import { NextIntlClientProvider } from 'next-intl';

const mockMessages = {
  tools: {
    'my-ip': {
      howTo: {
        title: 'How It Works',
        whatIsIp: {
          title: 'What is an IP Address?',
          body: 'An IP address is a unique identifier...',
        },
        ipv4VsIpv6: {
          title: 'IPv4 vs IPv6',
          body: 'IPv4 uses 32-bit addresses...',
        },
        publicVsPrivate: {
          title: 'Public vs Private IP',
          body: 'A public IP is visible to the internet...',
        },
        dynamicVsStatic: {
          title: 'Dynamic vs Static IP',
          body: 'A dynamic IP can change...',
        },
      },
    },
  },
};

function renderWithI18n(component: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('MyIpHowTo', () => {
  it('should render HowTo title', () => {
    renderWithI18n(<MyIpHowTo />);

    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('should render all HowTo sections', () => {
    renderWithI18n(<MyIpHowTo />);

    expect(screen.getByText('What is an IP Address?')).toBeInTheDocument();
    expect(screen.getByText('IPv4 vs IPv6')).toBeInTheDocument();
    expect(screen.getByText('Public vs Private IP')).toBeInTheDocument();
    expect(screen.getByText('Dynamic vs Static IP')).toBeInTheDocument();
  });

  it('should render section bodies', () => {
    renderWithI18n(<MyIpHowTo />);

    expect(screen.getByText(/An IP address is a unique identifier/)).toBeInTheDocument();
    expect(screen.getByText(/IPv4 uses 32-bit addresses/)).toBeInTheDocument();
  });

  it('should have accessible aria-labelledby on section', () => {
    const { container } = renderWithI18n(<MyIpHowTo />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'my-ip-howto-heading');
  });

  it('should render h2 heading', () => {
    renderWithI18n(<MyIpHowTo />);

    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent('How It Works');
  });
});
