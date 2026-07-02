import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import koMessages from '@/i18n/messages/ko.json';
import { GameBoard } from './GameBoard';

const messagesKo = koMessages as any;

const mockLabels = {
  correct: '정답',
  pass: '패스',
  undo: '되돌리기',
  end: '끝내기',
  correctScore: '정답: {count}',
  passScore: '패스: {count}',
  hintLabel: '힌트',
  of: '{current} / {total}',
};

function renderGameBoard(overrides = {}) {
  const defaultProps = {
    word: '사자',
    hint: '밀림의 왕',
    showHint: true,
    index: 0,
    total: 10,
    timerMs: 30000,
    roundTimeMs: 30000,
    score: { correct: 2, pass: 1 },
    canUndo: true,
    reducedMotion: false,
    onCorrect: vi.fn(),
    onPass: vi.fn(),
    onUndo: vi.fn(),
    onEnd: vi.fn(),
    labels: mockLabels,
    ...overrides,
  };

  return render(<GameBoard {...defaultProps} />);
}

describe('GameBoard', () => {
  it('renders the prompt word in large, bold font', () => {
    renderGameBoard({ word: '호랑이' });
    expect(screen.getByText('호랑이')).toBeInTheDocument();
    const wordEl = screen.getByText('호랑이');
    expect(wordEl).toHaveClass('font-bold');
  });

  it('displays the timer with correct formatting', () => {
    renderGameBoard({ timerMs: 35000 }); // 35 seconds
    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('35');
  });

  it('displays timer in MM:SS format for long durations', () => {
    renderGameBoard({ timerMs: 90000 }); // 90 seconds = 1:30
    const timer = screen.getByRole('timer');
    expect(timer.textContent).toMatch(/1:\d{2}/);
  });

  it('displays infinity symbol when timerMs is null', () => {
    renderGameBoard({ timerMs: null });
    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('∞');
  });

  it('applies coral color to timer when ≤10 seconds', () => {
    const { container } = renderGameBoard({ timerMs: 10000 });
    const timerDiv = container.querySelector('[role="timer"]');
    expect(timerDiv).toHaveClass('text-accent-coral');
  });

  it('applies brand color to timer when >10 seconds', () => {
    const { container } = renderGameBoard({ timerMs: 11000 });
    const timerDiv = container.querySelector('[role="timer"]');
    expect(timerDiv).toHaveClass('text-brand');
  });

  it('applies pulse animation when timer ≤10s and reducedMotion is false', () => {
    const { container } = renderGameBoard({
      timerMs: 9000,
      reducedMotion: false,
    });
    const timerDiv = container.querySelector('[role="timer"]');
    expect(timerDiv).toHaveClass('animate-pulse');
  });

  it('does not apply pulse animation when reducedMotion is true', () => {
    const { container } = renderGameBoard({
      timerMs: 9000,
      reducedMotion: true,
    });
    const timerDiv = container.querySelector('[role="timer"]');
    expect(timerDiv).not.toHaveClass('animate-pulse');
  });

  it('renders hint when showHint is true and hint exists', () => {
    renderGameBoard({
      hint: 'A big cat',
      showHint: true,
    });
    expect(screen.getByText(/A big cat/)).toBeInTheDocument();
  });

  it('does not render hint when showHint is false', () => {
    renderGameBoard({
      hint: 'A big cat',
      showHint: false,
    });
    expect(screen.queryByText(/A big cat/)).not.toBeInTheDocument();
  });

  it('displays score tally', () => {
    renderGameBoard({
      score: { correct: 5, pass: 2 },
    });
    expect(screen.getByText('정답: 5')).toBeInTheDocument();
    expect(screen.getByText('패스: 2')).toBeInTheDocument();
  });

  it('displays word progress', () => {
    renderGameBoard({
      index: 3,
      total: 10,
    });
    expect(screen.getByText('4 / 10')).toBeInTheDocument();
  });

  it('renders Correct button that calls onCorrect when clicked', async () => {
    const user = userEvent.setup();
    const onCorrect = vi.fn();
    renderGameBoard({ onCorrect });

    const correctBtn = screen.getByRole('button', { name: /정답/ });
    await user.click(correctBtn);
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it('renders Pass button that calls onPass when clicked', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    renderGameBoard({ onPass });

    const passBtn = screen.getByRole('button', { name: /패스/ });
    await user.click(passBtn);
    expect(onPass).toHaveBeenCalledOnce();
  });

  it('Undo button is disabled when canUndo is false', () => {
    renderGameBoard({ canUndo: false });
    const undoBtn = screen.getByRole('button', { name: /되돌리기/ });
    expect(undoBtn).toBeDisabled();
  });

  it('Undo button is enabled when canUndo is true', () => {
    renderGameBoard({ canUndo: true });
    const undoBtn = screen.getByRole('button', { name: /되돌리기/ });
    expect(undoBtn).not.toBeDisabled();
  });

  it('renders End button that calls onEnd when clicked', async () => {
    const user = userEvent.setup();
    const onEnd = vi.fn();
    renderGameBoard({ onEnd });

    const endBtn = screen.getByRole('button', { name: /끝내기/ });
    await user.click(endBtn);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  // Keyboard shortcuts (Space/→/←/Esc) are owned by the SpeedQuiz orchestrator,
  // not this presentational component — covered by the hook logic tests and E2E.
});
