import { render, screen, act } from '@testing-library/react';
import { BallDisplay } from './BallDisplay';

describe('BallDisplay', () => {
  it('renders a ball with correct number and color', () => {
    render(
      <BallDisplay number={7} index={0} isAnimating={false} animationPhase="idle" label="Number 7" />
    );

    const ball = screen.getByRole('img', { name: 'Number 7' });
    expect(ball).toBeInTheDocument();
    expect(ball).toHaveTextContent('7');
  });

  it('applies official 동행복권 band colors for each number range', () => {
    const testCases = [
      { number: 5, bg: 'rgb(158, 101, 0)' }, // 1–10 gold #9e6500 (deepened from official for AA contrast)
      { number: 15, bg: 'rgb(0, 99, 204)' }, // 11–20 blue #0063cc (official)
      { number: 25, bg: 'rgb(216, 49, 79)' }, // 21–30 red #d8314f (official)
      { number: 35, bg: 'rgb(110, 115, 130)' }, // 31–40 gray #6e7382 (official)
      { number: 42, bg: 'rgb(37, 132, 57)' }, // 41–45 green #258439 (deepened from official for AA contrast)
    ];

    testCases.forEach(({ number, bg }) => {
      const { container } = render(
        <BallDisplay
          number={number}
          index={0}
          isAnimating={false}
          animationPhase="idle"
          label={`Number ${number}`}
        />
      );

      const ball = container.firstChild as HTMLElement;
      expect(ball.style.backgroundColor).toBe(bg);
    });
  });

  it('renders the label it is given as its accessible name — no hardcoded English fallback', () => {
    // Regression: BallDisplay used to default to `Ball ${number}` in English
    // when no label was supplied, so every main ball on the ko page announced
    // in English. `label` is now a required prop with no default.
    render(
      <BallDisplay number={42} index={0} isAnimating={false} animationPhase="idle" label="번호 42" />
    );

    const ball = screen.getByRole('img', { name: '번호 42' });
    expect(ball).toHaveAttribute('aria-label', '번호 42');
  });

  it('applies opacity and scale during pop animation', () => {
    const { container, rerender } = render(
      <BallDisplay number={7} index={0} isAnimating={false} animationPhase="idle" label="Number 7" />
    );

    const ball = container.firstChild as HTMLElement;

    // During locking phase, should apply animation styles
    rerender(
      <BallDisplay number={7} index={0} isAnimating={true} animationPhase="locking" label="Number 7" />
    );

    // Check that transform and opacity styles exist (actual values depend on timing)
    const style = (ball as HTMLElement).getAttribute('style');
    expect(style).toMatch(/transform|opacity/);
  });

  it('actually cycles through candidate numbers during the rolling phase', () => {
    // Regression: displayNumber was computed once via useMemo keyed on
    // Date.now() % window, with nothing re-rendering the component during
    // the rolling window — so it froze on whatever value it first computed
    // instead of flickering like a slot machine.
    vi.useFakeTimers();

    const { container, rerender } = render(
      <BallDisplay number={7} index={0} isAnimating={false} animationPhase="idle" label="Number 7" />
    );
    rerender(
      <BallDisplay number={7} index={0} isAnimating={true} animationPhase="rolling" label="Number 7" />
    );

    const ball = container.firstChild as HTMLElement;
    const seen = new Set<string>([ball.textContent ?? '']);

    for (let i = 0; i < 5; i++) {
      act(() => {
        vi.advanceTimersByTime(50);
      });
      seen.add(ball.textContent ?? '');
    }

    // A frozen display shows exactly one value for the entire window.
    expect(seen.size).toBeGreaterThan(1);

    vi.useRealTimers();
  });

  it('reveals a ball after its own staggered delay during the locking phase', () => {
    // Regression: the pop-in fraction was computed from
    // `Date.now() - lockStartMs`, where lockStartMs was a small relative
    // duration, not an absolute timestamp — so it produced an unanchored,
    // effectively-random frozen value instead of an actual 0→1 reveal timed
    // to each ball's stagger slot.
    vi.useFakeTimers();

    const { container, rerender } = render(
      <BallDisplay number={7} index={2} isAnimating={false} animationPhase="idle" label="Number 7" />
    );
    rerender(
      <BallDisplay number={7} index={2} isAnimating={true} animationPhase="locking" label="Number 7" />
    );

    const ball = container.firstChild as HTMLElement;
    // Ball at index 2 pops after 2 * (150ms pop + 100ms stagger) = 500ms.
    expect(ball.style.opacity).toBe('0');

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(ball.style.opacity).toBe('0');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(ball.style.opacity).toBe('1');

    vi.useRealTimers();
  });

  it('renders with no animation in idle phase', () => {
    const { container } = render(
      <BallDisplay number={7} index={0} isAnimating={false} animationPhase="idle" label="Number 7" />
    );

    const ball = container.firstChild as HTMLElement;
    const style = ball.getAttribute('style');

    // Idle phase should have default scale and opacity
    expect(style).toMatch(/opacity.*1|scale.*1/);
  });
});
