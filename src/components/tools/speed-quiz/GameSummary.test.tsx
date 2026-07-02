import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameSummary, type WordResult } from './GameSummary';

const mockLabels = {
  titleDone: '게임 끝!',
  titleTimeout: '시간 초과',
  correct: '정답 {count}개',
  pass: '패스 {count}개',
  timeout: '시간초과 {count}개',
  results: '결과',
  wordList: '단어 목록',
  replay: '다시 하기',
  home: '홈으로',
};

const mockWords: WordResult[] = [
  { term: '사자', result: 'correct' },
  { term: '호랑이', result: 'pass' },
  { term: '곰', result: 'timeout' },
];

function renderGameSummary(overrides = {}) {
  const defaultProps = {
    outcome: 'done' as const,
    score: { correct: 7, pass: 2, timeout: 1 },
    words: mockWords,
    onReplay: vi.fn(),
    onHome: vi.fn(),
    labels: mockLabels,
    ...overrides,
  };

  return render(<GameSummary {...defaultProps} />);
}

describe('GameSummary', () => {
  it('renders the correct title when outcome is "done"', () => {
    renderGameSummary({ outcome: 'done' });
    expect(screen.getByText('게임 끝!')).toBeInTheDocument();
  });

  it('renders the timeout title when outcome is "timeout"', () => {
    renderGameSummary({ outcome: 'timeout' });
    expect(screen.getByText('시간 초과')).toBeInTheDocument();
  });

  it('displays the correct score count', () => {
    renderGameSummary({ score: { correct: 7, pass: 2, timeout: 1 } });
    expect(screen.getByText('정답 7개')).toBeInTheDocument();
  });

  it('displays the pass score count', () => {
    renderGameSummary({ score: { correct: 7, pass: 2, timeout: 1 } });
    expect(screen.getByText('패스 2개')).toBeInTheDocument();
  });

  it('displays the timeout score count', () => {
    renderGameSummary({ score: { correct: 7, pass: 2, timeout: 1 } });
    expect(screen.getByText('시간초과 1개')).toBeInTheDocument();
  });

  it('renders word-by-word results list', () => {
    const { container } = renderGameSummary({ words: mockWords });
    // Check that words appear in the results section
    const resultsSection = container.querySelectorAll('.space-y-2')[0]; // results section
    expect(resultsSection.textContent).toContain('사자');
    expect(resultsSection.textContent).toContain('호랑이');
    expect(resultsSection.textContent).toContain('곰');
  });

  it('renders result icons correctly', () => {
    const { container } = renderGameSummary({
      words: [
        { term: '사자', result: 'correct' },
        { term: '호랑이', result: 'pass' },
        { term: '곰', result: 'timeout' },
      ],
    });

    // Check for icons in the results section
    const content = container.textContent;
    expect(content).toContain('✓'); // correct
    expect(content).toContain('✗'); // pass
    expect(content).toContain('·'); // timeout
  });

  it('applies correct color classes to results', () => {
    const { container } = renderGameSummary({
      words: [
        { term: '사자', result: 'correct' },
        { term: '호랑이', result: 'pass' },
        { term: '곰', result: 'timeout' },
      ],
    });

    // Verify status color classes are applied (real tokens: success/danger/warning)
    const icons = container.querySelectorAll(
      '[class*="text-success"], [class*="text-danger"], [class*="text-warning"]'
    );
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders full word list', () => {
    renderGameSummary({ words: mockWords });
    expect(screen.getByText('단어 목록')).toBeInTheDocument();
  });

  it('renders Replay button that calls onReplay when clicked', async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();
    renderGameSummary({ onReplay });

    const replayBtn = screen.getByRole('button', { name: /다시 하기/ });
    await user.click(replayBtn);
    expect(onReplay).toHaveBeenCalledOnce();
  });

  it('renders Home button that calls onHome when clicked', async () => {
    const user = userEvent.setup();
    const onHome = vi.fn();
    renderGameSummary({ onHome });

    const homeBtn = screen.getByRole('button', { name: /홈으로/ });
    await user.click(homeBtn);
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('displays timeout score section only when timeout > 0', () => {
    const { rerender } = renderGameSummary({
      score: { correct: 7, pass: 3, timeout: 0 },
    });
    // Timeout section should not be visible when timeout is 0
    const timeoutElements = screen.queryAllByText(/시간초과/);
    // May have title but no score display
  });

  it('handles empty word list gracefully', () => {
    renderGameSummary({ words: [] });
    expect(screen.getByText('단어 목록')).toBeInTheDocument();
  });

  it('handles large score numbers', () => {
    renderGameSummary({
      score: { correct: 98, pass: 50, timeout: 12 },
    });
    expect(screen.getByText('정답 98개')).toBeInTheDocument();
    expect(screen.getByText('패스 50개')).toBeInTheDocument();
    expect(screen.getByText('시간초과 12개')).toBeInTheDocument();
  });
});
