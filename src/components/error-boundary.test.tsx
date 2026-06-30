import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Suppress console.error for this test suite
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws an error', () => {
    // Component that throws an error
    function ThrowingComponent(): React.ReactNode {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders fallback message in fallback UI', () => {
    function ThrowingComponent(): React.ReactNode {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/The tool encountered an error/)).toBeInTheDocument();
  });

  it('renders refresh button in fallback UI', () => {
    function ThrowingComponent(): React.ReactNode {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('renders fallback with red border styling', () => {
    function ThrowingComponent(): React.ReactNode {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const fallback = screen.getByText('Something went wrong').closest('div');
    expect(fallback).toHaveClass('rounded-lg', 'border');
    expect(fallback).toHaveClass('bg-danger/10');
  });

  it('renders h2 with danger styling in fallback', () => {
    function ThrowingComponent(): React.ReactNode {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Something went wrong');
    expect(heading).toHaveClass('text-danger-ink');
  });

  it('refresh button is clickable', async () => {
    const user = userEvent.setup();

    function ThrowingComponent(): React.ReactNode {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('Refresh') as HTMLButtonElement;
    expect(refreshButton).toBeEnabled();
    await user.click(refreshButton);
    // Button is clickable without error
  });

  it('refresh button has brand styling', () => {
    function ThrowingComponent(): React.ReactNode {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const button = screen.getByText('Refresh');
    expect(button).toHaveClass('bg-brand');
    expect(button).toHaveClass('text-on-brand');
  });

  it('renders multiple children without error', () => {
    render(
      <ErrorBoundary>
        <div>Content 1</div>
        <div>Content 2</div>
        <div>Content 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.getByText('Content 3')).toBeInTheDocument();
  });

  it('catches error during render lifecycle', () => {
    function ComponentWithRenderError(): React.ReactNode {
      const [state] = React.useState(null);
      // Simulate a render error by trying to access a method on null
      return <div>{(state as any).nonexistent.method()}</div>;
    }

    render(
      <ErrorBoundary>
        <ComponentWithRenderError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
