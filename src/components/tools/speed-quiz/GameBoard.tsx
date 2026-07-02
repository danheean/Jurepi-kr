'use client';

import { useRef } from 'react';

export interface GameBoardProps {
  word: string;
  hint?: string;
  showHint: boolean;
  index: number;
  total: number;
  timerMs: number | null;
  roundTimeMs: number | null;
  score: { correct: number; pass: number };
  canUndo: boolean;
  reducedMotion: boolean;
  onCorrect: () => void;
  onPass: () => void;
  onUndo: () => void;
  onEnd: () => void;
  labels: {
    correct: string;
    pass: string;
    undo: string;
    end: string;
    correctScore: string;
    passScore: string;
    hintLabel: string;
    of: string;
  };
}

function formatTimer(ms: number | null): string {
  if (ms === null) return '∞';
  const totalSecs = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`;
}

export function GameBoard({
  word,
  hint,
  showHint,
  index,
  total,
  timerMs,
  roundTimeMs,
  score,
  canUndo,
  reducedMotion,
  onCorrect,
  onPass,
  onUndo,
  onEnd,
  labels,
}: GameBoardProps) {
  const timerRef = useRef<HTMLDivElement>(null);

  // Apply pulse animation class when timer <= 10s, respecting reduced motion
  const isLowTime = timerMs !== null && timerMs <= 10000;
  const timerPulseClass =
    isLowTime && !reducedMotion ? 'animate-pulse' : '';

  // Determine timer color: brand color (>10s), coral + pulse (≤10s)
  const timerColorClass = isLowTime
    ? 'text-accent-coral'
    : 'text-brand';

  // Progress indicator (current word / total)
  const wordProgress = labels.of
    .replace('{current}', `${index + 1}`)
    .replace('{total}', `${total}`);

  // Keyboard shortcuts (Space/→/←/Esc) are owned by the SpeedQuiz orchestrator,
  // which also guards against the search input and drives the help overlay.
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface p-6 md:p-8" data-testid="game-board">
      {/* Timer (top center) */}
      <div
        ref={timerRef}
        className={`absolute top-8 left-1/2 -translate-x-1/2 text-center ${timerColorClass} ${timerPulseClass}`}
        role="timer"
        aria-live="polite"
        aria-label={`Timer: ${formatTimer(timerMs)}`}
        data-testid="game-timer"
      >
        <div className="font-mono text-[72px] font-bold tabular-nums leading-none">
          {formatTimer(timerMs)}
        </div>
      </div>

      {/* Score tally (top right) */}
      <div
        className="absolute top-8 right-8 space-y-1 text-right text-sm font-semibold text-text"
        aria-live="polite"
      >
        <div>{labels.correctScore.replace('{count}', String(score.correct))}</div>
        <div>{labels.passScore.replace('{count}', String(score.pass))}</div>
      </div>

      {/* Undo button (top left) */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="absolute top-8 left-8 px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-surface-muted active:enabled:scale-95"
        aria-label={labels.undo}
        title={`${labels.undo} (←)`}
        data-testid="game-undo"
      >
        ← {labels.undo}
      </button>

      {/* End button (top right, below score) */}
      <button
        onClick={onEnd}
        className="absolute top-32 right-8 px-4 py-2 rounded-lg font-semibold text-sm text-text-secondary transition-all hover:bg-surface-muted active:scale-95"
        aria-label={labels.end}
        title={`${labels.end} (Esc)`}
        data-testid="game-end"
      >
        {labels.end}
      </button>

      {/* Center: prompt word */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 max-w-2xl">
        <p className="font-display text-center leading-tight font-bold break-words" style={{
          fontSize: 'clamp(48px, 10vw, 120px)',
        }}>
          {word}
        </p>

        {/* Optional hint */}
        {showHint && hint && (
          <p className="text-base text-text-secondary italic max-w-[24rem] text-center">
            <span className="font-semibold">{labels.hintLabel}:</span> {hint}
          </p>
        )}

        {/* Word progress indicator */}
        <p className="text-xs text-text-muted mt-4">{wordProgress}</p>
      </div>

      {/* Bottom: action buttons */}
      <div className="absolute bottom-8 left-6 right-6 grid grid-cols-2 gap-4">
        <button
          onClick={onCorrect}
          className={`py-4 md:py-5 px-6 rounded-lg font-bold text-base md:text-lg transition-all ${
            reducedMotion
              ? ''
              : 'hover:scale-105 active:scale-95'
          } bg-brand text-on-brand hover:bg-brand-strong focus-visible:outline-offset-2`}
          aria-label={labels.correct}
          title={`${labels.correct} (Space)`}
          data-testid="game-correct"
        >
          {labels.correct}
        </button>
        <button
          onClick={onPass}
          className={`py-4 md:py-5 px-6 rounded-lg font-bold text-base md:text-lg transition-all ${
            reducedMotion
              ? ''
              : 'hover:scale-105 active:scale-95'
          } bg-surface-muted text-text hover:bg-surface-sunken focus-visible:outline-offset-2`}
          aria-label={labels.pass}
          title={`${labels.pass} (→)`}
          data-testid="game-pass"
        >
          {labels.pass}
        </button>
      </div>
    </div>
  );
}
