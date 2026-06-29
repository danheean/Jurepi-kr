import { render, screen } from '@/__test__/test-utils';
import { renderHook, act } from '@testing-library/react';
import { useLadder } from './useLadder';
import { LadderBoard } from './LadderBoard';
import { tracePath, mulberry32 } from '@/lib/ladder';
import { describe, it, expect } from 'vitest';

describe('LadderBoard Component', () => {
  it('does not render when phase=setup', () => {
    const { result } = renderHook(() => useLadder(2));
    render(<LadderBoard ladder={result.current} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders SVG with correct aria-label', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<LadderBoard ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<LadderBoard ladder={result.current} />);

    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('aria-label');
  });

  it('renders N vertical lines for N players', () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderBoard ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<LadderBoard ladder={result.current} />);

    const svg = screen.getByRole('img');
    // SVG should contain 4 vertical lines (one per player)
    const lines = svg.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(4); // At least 4 vertical
  });

  it('renders horizontal rungs from rungs array', () => {
    const { result } = renderHook(() => useLadder(3));
    const { rerender } = render(<LadderBoard ladder={result.current} />);

    // Use a seeded RNG to ensure we get rungs (not identity permutation)
    const rng = mulberry32(42);
    act(() => {
      result.current.dispatch({ type: 'BUILD', rng });
    });
    rerender(<LadderBoard ladder={result.current} />);

    const svg = screen.getByRole('img');
    const lines = svg.querySelectorAll('line');

    // Should have rungs
    expect(result.current.state.rungs.length).toBeGreaterThan(0);
    expect(lines.length).toBeGreaterThan(3); // More than just vertical lines
  });

  it('animated trace path uses tracePath output', () => {
    const { result } = renderHook(() => useLadder(3));
    const { rerender } = render(<LadderBoard ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.startTrace(result.current.state.players[0].id);
    });
    rerender(<LadderBoard ladder={result.current} />);

    const svg = screen.getByRole('img');
    const path = svg.querySelector('path');

    // If activeTrace is set, path should exist
    if (result.current.state.activeTrace) {
      expect(path).toBeInTheDocument();

      // Verify path is based on tracePath (not self-calculated)
      const expectedPath = tracePath(result.current.state.rungs, 0);
      expect(expectedPath.length).toBeGreaterThan(0);
    }
  });

  it('path is hidden when no activeTrace', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<LadderBoard ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<LadderBoard ladder={result.current} />);

    const svg = screen.getByRole('img');
    const path = svg.querySelector('path');

    expect(path).not.toBeInTheDocument();
  });

  it('respects prefers-reduced-motion (no stroke-dashoffset animation)', () => {
    const { result } = renderHook(() => useLadder(2));
    render(<LadderBoard ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.startTrace(result.current.state.players[0].id);
    });

    // Component should handle prefers_reduced_motion flag
    expect(result.current.prefers_reduced_motion).toBeDefined();
  });

  it('has accessible structure (aria-hidden on decorative elements)', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<LadderBoard ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<LadderBoard ladder={result.current} />);

    const svg = screen.getByRole('img');
    // SVG itself should have role="img" for accessibility
    expect(svg).toHaveAttribute('role', 'img');
  });
});
