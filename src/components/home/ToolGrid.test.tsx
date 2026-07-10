import { render, screen, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ToolGrid } from './ToolGrid';
import type { SearchableTool } from '@/lib/tool-search';

describe('ToolGrid', () => {
  const mockTools: SearchableTool[] = [
    {
      id: 'ladder',
      slug: 'ladder',
      name: 'Ladder Game',
      description: 'Play the ladder game',
      category: 'random',
      accent: 'coral',
      icon: 'ListTree',
      status: 'live',
    addedAt: '2026-07-01',
      order: 1,
      keywords: ['ladder'],
    },
    {
      id: 'picker',
      slug: 'picker',
      name: 'Random Picker',
      description: 'Pick randomly from a list',
      category: 'random',
      accent: 'rose',
      icon: 'Dices',
      status: 'coming_soon',
    addedAt: '2026-07-01',
      order: 2,
      keywords: ['picker'],
    },
  ];

  it('renders all tools as cards', () => {
    render(<ToolGrid tools={mockTools} isFiltered={false} onReset={() => {}} testId="grid" />);
    expect(screen.getByText('Ladder Game')).toBeInTheDocument();
    expect(screen.getByText('Random Picker')).toBeInTheDocument();
  });

  it('renders empty state when no tools', () => {
    const onReset = vi.fn();
    render(
      <ToolGrid tools={[]} isFiltered={true} onReset={onReset} testId="grid" />
    );
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search or category.')).toBeInTheDocument();
  });

  it('calls onReset when empty state action is clicked', async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(
      <ToolGrid tools={[]} isFiltered={true} onReset={onReset} testId="grid" />
    );
    const resetButton = screen.getByTestId('grid-empty-action');
    await user.click(resetButton);
    expect(onReset).toHaveBeenCalled();
  });

  it('shows mascot in empty state', () => {
    render(<ToolGrid tools={[]} isFiltered={true} onReset={() => {}} />);
    const mascot = screen.getByAltText('Jurepi mascot');
    expect(mascot).toBeInTheDocument();
  });

  it('applies correct grid classes', () => {
    const { container } = render(
      <ToolGrid tools={mockTools} isFiltered={false} onReset={() => {}} testId="grid" />
    );
    const grid = container.querySelector('[data-testid="grid"]');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
  });

  describe('Favorites', () => {
    it('passes favorite state to ToolCard', () => {
      const onToggleFavorite = vi.fn();
      const { container } = render(
        <ToolGrid
          tools={mockTools}
          isFiltered={false}
          onReset={() => {}}
          testId="grid"
          favoriteIds={['ladder']}
          onToggleFavorite={onToggleFavorite}
        />
      );
      // Both cards should be rendered with favorite state
      expect(screen.getByText('Ladder Game')).toBeInTheDocument();
      expect(screen.getByText('Random Picker')).toBeInTheDocument();
    });

    it('shows favorites-specific empty state when isEmptyBecauseFavorites is true', () => {
      const onShowAll = vi.fn();
      render(
        <ToolGrid
          tools={[]}
          isFiltered={false}
          onReset={() => {}}
          testId="grid"
          isEmptyBecauseFavorites={true}
          onShowAll={onShowAll}
        />
      );
      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
      expect(screen.getByText('Tap the heart on a card to add favorites.')).toBeInTheDocument();
    });

    it('calls onShowAll when favorites empty state action is clicked', async () => {
      const onShowAll = vi.fn();
      const user = userEvent.setup();
      render(
        <ToolGrid
          tools={[]}
          isFiltered={false}
          onReset={() => {}}
          testId="grid"
          isEmptyBecauseFavorites={true}
          onShowAll={onShowAll}
        />
      );
      const showAllButton = screen.getByTestId('grid-empty-favorites-action');
      await user.click(showAllButton);
      expect(onShowAll).toHaveBeenCalled();
    });

    it('shows generic empty state when empty but not because of favorites', () => {
      render(
        <ToolGrid
          tools={[]}
          isFiltered={true}
          onReset={() => {}}
          testId="grid"
          isEmptyBecauseFavorites={false}
        />
      );
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });
});
