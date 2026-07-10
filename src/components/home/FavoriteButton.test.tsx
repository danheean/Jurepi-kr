import { render, screen, userEvent } from '@/__test__/test-utils';
import { FavoriteButton } from './FavoriteButton';

describe('FavoriteButton', () => {
  it('renders button with heart icon', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="Ladder Game"
        isFavorited={false}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('displays correct aria-label for unfavorited state', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="Ladder Game"
        isFavorited={false}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Add Ladder Game to favorites'
    );
  });

  it('displays correct aria-label for favorited state', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="Ladder Game"
        isFavorited={true}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Remove Ladder Game from favorites'
    );
  });

  it('has aria-pressed attribute reflecting favorited state', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <FavoriteButton
        slug="ladder"
        name="Ladder Game"
        isFavorited={false}
        onToggle={handleToggle}
      />
    );

    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <FavoriteButton
        slug="ladder"
        name="Ladder Game"
        isFavorited={true}
        onToggle={handleToggle}
      />
    );

    button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggle with slug when clicked', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="Ladder Game"
        isFavorited={false}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleToggle).toHaveBeenCalledWith('ladder');
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('uses provided testId', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="Ladder Game"
        isFavorited={false}
        onToggle={handleToggle}
        testId="ladder-favorite"
      />
    );

    const button = screen.getByTestId('ladder-favorite');
    expect(button).toBeInTheDocument();
  });

  it('applies text-accent-rose when favorited', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="사다리 타기"
        isFavorited={true}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-accent-rose');
  });

  it('applies text-text-muted when not favorited', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="사다리 타기"
        isFavorited={false}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-text-muted');
  });

  it('has focus-visible ring styling', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="사다리 타기"
        isFavorited={false}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('ring-offset-2');
    expect(button).toHaveClass('ring-focus-ring');
  });

  it('has 44px dimensions (w-11 h-11)', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="사다리 타기"
        isFavorited={false}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-11');
    expect(button).toHaveClass('h-11');
  });

  it('has hover:bg-surface-sunken styling', () => {
    const handleToggle = vi.fn();
    render(
      <FavoriteButton
        slug="ladder"
        name="사다리 타기"
        isFavorited={false}
        onToggle={handleToggle}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-surface-sunken');
  });
});
