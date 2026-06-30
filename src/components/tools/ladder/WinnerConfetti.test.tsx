import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WinnerConfetti } from './WinnerConfetti';

describe('WinnerConfetti', () => {
  it('renders confetti pieces when active and !reducedMotion', () => {
    render(<WinnerConfetti active={true} reducedMotion={false} />);

    const container = screen.getByTestId('winner-confetti');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-hidden', 'true');

    // Should render 16 confetti pieces
    const pieces = screen.getAllByTestId(/confetti-piece-/);
    expect(pieces).toHaveLength(16);
  });

  it('renders nothing when not active', () => {
    const { container } = render(
      <WinnerConfetti active={false} reducedMotion={false} />
    );

    expect(container.querySelector('[data-testid="winner-confetti"]')).not
      .toBeInTheDocument();
  });

  it('renders nothing when reducedMotion is true', () => {
    const { container } = render(
      <WinnerConfetti active={true} reducedMotion={true} />
    );

    expect(container.querySelector('[data-testid="winner-confetti"]')).not
      .toBeInTheDocument();
  });

  it('has aria-hidden on container', () => {
    render(<WinnerConfetti active={true} reducedMotion={false} />);

    const container = screen.getByTestId('winner-confetti');
    expect(container).toHaveAttribute('aria-hidden', 'true');
  });

  it('has pointer-events-none to not interfere with interactions', () => {
    render(<WinnerConfetti active={true} reducedMotion={false} />);

    const container = screen.getByTestId('winner-confetti');
    expect(container).toHaveClass('pointer-events-none');
  });
});
