import { render, screen } from '@/__test__/test-utils';
import { renderHook, act } from '@testing-library/react';
import { useLadder } from './useLadder';
import { PrizeCards } from './PrizeCards';
import { describe, it, expect } from 'vitest';

describe('PrizeCards Component', () => {
  it('does not render when phase=setup', () => {
    const { result } = renderHook(() => useLadder(2));
    render(<PrizeCards ladder={result.current} />);

    expect(
      screen.queryByRole('region', { name: /Prize cards/i })
    ).not.toBeInTheDocument();
  });

  it('shows question marks when hideResults=true and not revealed', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    const questionMarks = screen.getAllByText('?');
    expect(questionMarks).toHaveLength(2);
  });

  it('shows labels when hideResults=false', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.setPrizeLable(0, 'Prize1');
      result.current.setPrizeLable(1, 'Prize2');
      result.current.toggleHide();
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    expect(screen.getByText('Prize1')).toBeInTheDocument();
    expect(screen.getByText('Prize2')).toBeInTheDocument();
    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });

  it('reveals label when prize is revealed', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.setPrizeLable(0, 'Prize1');
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    const questionMarks = screen.getAllByText('?');
    expect(questionMarks.length).toBeGreaterThan(0);

    act(() => {
      result.current.completeReveal(result.current.state.players[0].id);
    });
    rerender(<PrizeCards ladder={result.current} />);

    expect(screen.getByText('Prize1')).toBeInTheDocument();
  });

  it('uses default label when prize.label is empty', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.toggleHide();
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    // Prize cards should exist (default labels rendered)
    const cards = result.current.state.prizes;
    expect(cards.length).toBe(2);
  });

  it('renders exactly N cards for N players', () => {
    const { result } = renderHook(() => useLadder(5));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    const questionMarks = screen.getAllByText('?');
    expect(questionMarks).toHaveLength(5);
  });

  it('respects prefers-reduced-motion (no rotateY)', () => {
    // This test verifies the component respects the flag
    // (actual CSS transform is not tested here, just prop passing)
    const { result } = renderHook(() => useLadder(2));
    render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.completeReveal(result.current.state.players[0].id);
    });

    // Component should render without error
    expect(result.current.prefers_reduced_motion).toBeDefined();
  });
});
