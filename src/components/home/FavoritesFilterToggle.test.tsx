import { render, screen, userEvent } from '@/__test__/test-utils';
import { vi } from 'vitest';
import { FavoritesFilterToggle } from './FavoritesFilterToggle';

describe('FavoritesFilterToggle', () => {
  it('renders button with heart icon and label', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('has aria-pressed attribute reflecting active state', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <FavoritesFilterToggle active={true} onToggle={handleToggle} />
    );

    button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays correct aria-label', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Filter by favorites');
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('uses provided testId', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle
        active={false}
        onToggle={handleToggle}
        testId="custom-toggle"
      />
    );

    const button = screen.getByTestId('custom-toggle');
    expect(button).toBeInTheDocument();
  });

  it('uses default testId if not provided', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByTestId('favorites-filter-toggle');
    expect(button).toBeInTheDocument();
  });

  it('applies bg-brand and text-on-brand when active', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={true} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-brand');
    expect(button).toHaveClass('text-on-brand');
    expect(button).toHaveClass('shadow-card');
    expect(button).toHaveClass('font-semibold');
  });

  it('applies bg-surface-muted and text-text-secondary when inactive', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-surface-muted');
    expect(button).toHaveClass('text-text-secondary');
    expect(button).toHaveClass('font-medium');
  });

  it('has hover styling when inactive', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-hairline-strong');
    expect(button).toHaveClass('hover:text-text');
  });

  it('has min-h-11 and focus-visible ring styling', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-11');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-offset-2');
    expect(button).toHaveClass('focus-visible:ring-focus-ring');
  });

  it('fills heart icon when active', () => {
    const handleToggle = vi.fn();
    const { rerender: rerenderComp } = render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    let heartIcon = screen.getByRole('button').querySelector('svg');
    expect(heartIcon).toHaveAttribute('fill', 'none');

    rerenderComp(
      <FavoritesFilterToggle active={true} onToggle={handleToggle} />
    );

    heartIcon = screen.getByRole('button').querySelector('svg');
    expect(heartIcon).toHaveAttribute('fill', 'currentColor');
  });
});
