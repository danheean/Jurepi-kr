import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IpDisplay } from './IpDisplay';
import { NextIntlClientProvider } from 'next-intl';
import type { IpResult } from '@/lib/my-ip/schema';

const mockMessages = {
  tools: {
    'my-ip': {
      display: {
        ipv4Label: 'IPv4',
        ipv6Label: 'IPv6',
        copy: 'Copy',
        copied: 'Copied!',
        copyAria: 'Copy IP address',
        refresh: 'Refresh',
        provider: 'From {provider}',
        approximateNote: 'Approximate location (from {provider})',
        ispLabel: 'ISP',
        cityLabel: 'City',
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

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

const mockData: IpResult = {
  ipv4: '203.0.113.45',
  ipv6: '2001:db8::1',
  isp: 'Example ISP',
  city: 'New York',
  provider: 'api.ipify.org',
  fetchedAt: 1000000,
};

describe('IpDisplay', () => {
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display IPv4 address', () => {
    renderWithI18n(<IpDisplay data={mockData} onRefresh={mockRefresh} />);

    expect(screen.getByText('203.0.113.45')).toBeInTheDocument();
  });

  it('should display IPv6 if present', () => {
    renderWithI18n(<IpDisplay data={mockData} onRefresh={mockRefresh} />);

    expect(screen.getByText('2001:db8::1')).toBeInTheDocument();
  });

  it('should display ISP and city', () => {
    renderWithI18n(<IpDisplay data={mockData} onRefresh={mockRefresh} />);

    expect(screen.getByText(/Example ISP/)).toBeInTheDocument();
    expect(screen.getByText(/New York/)).toBeInTheDocument();
    expect(screen.getByText(/Approximate location/)).toBeInTheDocument();
  });

  it('formats fetchedAt with the app locale, not the system locale', () => {
    // ko provider → Korean day-period time format (오전/오후), regardless of
    // the OS/system locale the tests happen to run under.
    render(
      <NextIntlClientProvider locale="ko" messages={mockMessages}>
        <IpDisplay data={mockData} onRefresh={mockRefresh} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(/오전|오후/)).toBeInTheDocument();
  });

  it('should copy IP to clipboard on button click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    (navigator.clipboard.writeText as any) = writeTextMock;

    renderWithI18n(<IpDisplay data={mockData} onRefresh={mockRefresh} />);

    const copyButton = screen.getByLabelText(/Copy IP address/);
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('203.0.113.45');
    });
  });

  it('should call onRefresh when refresh button clicked', () => {
    renderWithI18n(<IpDisplay data={mockData} onRefresh={mockRefresh} />);

    const refreshButton = screen.getByLabelText(/Refresh/);
    fireEvent.click(refreshButton);

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should show provider name', () => {
    renderWithI18n(<IpDisplay data={mockData} onRefresh={mockRefresh} />);

    // Provider appears in at least one location (metadata)
    const providerTexts = screen.getAllByText(/api.ipify.org/);
    expect(providerTexts.length).toBeGreaterThan(0);
  });
});
