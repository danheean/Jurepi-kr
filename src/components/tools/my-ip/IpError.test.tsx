import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IpError } from './IpError';
import { NextIntlClientProvider } from 'next-intl';

const mockMessages = {
  tools: {
    'my-ip': {
      errors: {
        ALL_PROVIDERS_FAILED: 'All providers failed',
        NETWORK_ERROR: 'Network error',
        retry: 'Try Again',
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

describe('IpError', () => {
  const mockRetry = vi.fn();

  it('should display error message', () => {
    renderWithI18n(
      <IpError error="ALL_PROVIDERS_FAILED" onRetry={mockRetry} isLoading={false} />
    );

    expect(screen.getByText(/All providers failed/i)).toBeInTheDocument();
  });

  it('should call onRetry when button clicked', () => {
    renderWithI18n(
      <IpError error="ALL_PROVIDERS_FAILED" onRetry={mockRetry} isLoading={false} />
    );

    const retryButton = screen.getByRole('button');
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalled();
  });

  it('should disable retry button when loading', () => {
    renderWithI18n(
      <IpError error="ALL_PROVIDERS_FAILED" onRetry={mockRetry} isLoading={true} />
    );

    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeDisabled();
  });

  it('should have alertive aria-live for error state', () => {
    const { container } = renderWithI18n(
      <IpError error="NETWORK_ERROR" onRetry={mockRetry} isLoading={false} />
    );

    const alertDiv = container.querySelector('[role="alert"]');
    expect(alertDiv).toHaveAttribute('aria-live', 'assertive');
  });
});
