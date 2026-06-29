import { render, screen } from '@/__test__/test-utils';
import { LadderIntro } from './LadderIntro';
import { describe, it, expect } from 'vitest';

describe('LadderIntro Component', () => {
  it('renders main heading', () => {
    render(<LadderIntro />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('renders title from translation', () => {
    render(<LadderIntro />);
    expect(screen.getByText('Ladder Game')).toBeInTheDocument();
  });

  it('renders lead paragraph', () => {
    render(<LadderIntro />);
    expect(screen.getByText('Decide fair orders for your group.')).toBeInTheDocument();
  });

  it('renders in a section element', () => {
    const { container } = render(<LadderIntro />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('applies display-lg font class to heading', () => {
    render(<LadderIntro />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('font-display-lg');
  });

  it('applies text class to heading', () => {
    render(<LadderIntro />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-text');
  });

  it('applies body-lg font class to lead paragraph', () => {
    render(<LadderIntro />);
    const paragraph = screen.getByText('Decide fair orders for your group.');
    expect(paragraph).toHaveClass('font-body-lg');
  });

  it('applies text-secondary class to lead paragraph', () => {
    render(<LadderIntro />);
    const paragraph = screen.getByText('Decide fair orders for your group.');
    expect(paragraph).toHaveClass('text-text-secondary');
  });

  it('has margin-bottom on section', () => {
    const { container } = render(<LadderIntro />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('mb-8');
  });

  it('has margin-bottom on heading', () => {
    render(<LadderIntro />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('mb-4');
  });

  it('applies max-width to lead paragraph', () => {
    render(<LadderIntro />);
    const paragraph = screen.getByText('Decide fair orders for your group.');
    expect(paragraph).toHaveClass('max-w-2xl');
  });
});
