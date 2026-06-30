'use client';

import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Localized fallback strings (defaults are English for standalone use). */
  title?: string;
  body?: string;
  actionLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const {
        title = 'Something went wrong',
        body = 'The tool encountered an error. Please try refreshing the page.',
        actionLabel = 'Refresh',
      } = this.props;
      return (
        <div className="rounded-lg border border-danger bg-danger/10 p-6">
          <h2 className="text-lg font-bold text-danger-ink">{title}</h2>
          <p className="mt-2 text-sm text-text-secondary">{body}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-strong"
          >
            {actionLabel}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
