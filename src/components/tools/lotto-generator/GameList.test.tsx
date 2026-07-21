import { render, screen, fireEvent, waitFor, act } from '@/__test__/test-utils';
import { GameList } from './GameList';
import type { Game } from '@/lib/lotto-generator/schema';

const game = (numbers: number[], bonus: number): Game => ({ numbers, bonus });

describe('GameList', () => {
  it('displays empty state when no games', () => {
    render(<GameList games={[]} animationPhase="idle" />);

    expect(screen.getByText(/Generate numbers/i)).toBeInTheDocument();
  });

  it('displays games with correct labels', () => {
    const games: Game[] = [
      game([1, 7, 13, 21, 35, 42], 25),
      game([2, 8, 14, 22, 36, 43], 9),
    ];

    render(<GameList games={games} animationPhase="idle" />);

    expect(screen.getByText(/Game 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Game 2/i)).toBeInTheDocument();
  });

  it('renders the 6 main balls plus a bonus ball per game', () => {
    const games: Game[] = [game([1, 7, 13, 21, 35, 42], 25)];

    render(<GameList games={games} animationPhase="idle" />);

    // 6 main balls carry the "Ball N" label; the bonus ball carries "Bonus number N".
    const mainBalls = screen.getAllByRole('img', { name: /^Ball /i });
    expect(mainBalls.length).toBe(6);

    const bonusBall = screen.getByRole('img', { name: /Bonus number 25/i });
    expect(bonusBall).toBeInTheDocument();
    // Official-style group captions
    expect(screen.getByText(/^Numbers$/)).toBeInTheDocument();
    expect(screen.getByText(/^Bonus$/)).toBeInTheDocument();
  });

  it('copy button shows "Copied!" after click', async () => {
    const games: Game[] = [game([1, 7, 13, 21, 35, 42], 25)];

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    render(<GameList games={games} animationPhase="idle" />);

    const copyButton = screen.getByRole('button', { name: /COPY/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });

  it('reverts copy button after 2 seconds', async () => {
    const games: Game[] = [game([1, 7, 13, 21, 35, 42], 25)];

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.useFakeTimers();

    render(<GameList games={games} animationPhase="idle" />);

    const copyButton = screen.getByRole('button', { name: /COPY/i });
    fireEvent.click(copyButton);

    // Flush the async clipboard promise (advanceTimersByTimeAsync flushes
    // microtasks AND timers — waitFor deadlocks under fake timers).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(copyButton.textContent).toContain('Copied!');

    // Advance past the 2s revert timeout
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(copyButton.textContent).toContain('COPY');
    expect(copyButton.textContent).not.toContain('Copied!');

    vi.useRealTimers();
  });
});
