'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, ExternalLink } from 'lucide-react';
import { useLottoGenerator } from './useLottoGenerator';
import { SettingsPanel } from './SettingsPanel';
import { GameList } from './GameList';
import { HistoryPanel } from './HistoryPanel';
import { ResponsibilityDisclaimer } from './ResponsibilityDisclaimer';
import { spawnConfetti } from './confetti';
import { playPopSound } from '@/lib/lotto-generator/sound';
import { BEEP_FREQ_HZ } from '@/lib/lotto-generator/schema';
import { formatGamesPlaintext } from '@/lib/lotto-generator/format';

/**
 * Lotto Generator orchestrator component.
 * "use client" — owns state, animation, lifecycle.
 * Mounted gate: only render interactive UI after hydration.
 * Global keyboard handler for Enter key.
 */
export function LottoGenerator() {
  const t = useTranslations('tools.lotto-generator');
  const {
    gameCount,
    setGameCount,
    fixedNumbers,
    addFixedNumber,
    removeFixedNumber,
    excludedNumbers,
    addExcludedNumber,
    removeExcludedNumber,
    soundOn,
    setSoundOn,
    games,
    history,
    clearHistoryLocal,
    generate,
    restoreFromHistory,
    animationState,
    mounted,
  } = useLottoGenerator();

  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  // Legitimate ref: only ever read inside event handlers (click/keydown),
  // never rendered — a plain debounce gate, not something the UI reflects.
  const isGeneratingRef = useRef(false);
  // Real state, not a ref: this drives the button's `disabled` attribute,
  // so it must trigger a re-render when it changes (a ref read directly in
  // JSX doesn't — mutating it wouldn't reliably update what's on screen).
  const [generateDisabled, setGenerateDisabled] = useState(false);

  // Initialize AudioContext on first interaction
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      } catch {
        // AudioContext not available
      }
    }
  }, []);

  // Global keyboard handler (Enter to generate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !generateDisabled && !isGeneratingRef.current) {
        e.preventDefault();
        generate();
      }
    };

    if (mounted) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [mounted, generate, generateDisabled]);

  // Pop sound during animation (locking phase)
  useEffect(() => {
    if (animationState.phase === 'locking' && soundOn && audioContextRef.current) {
      playPopSound({ frequency: BEEP_FREQ_HZ, durationMs: 100 }, audioContextRef.current);
    }
  }, [animationState.phase, animationState.activeBallIndex, soundOn]);

  // Confetti on done
  useEffect(() => {
    if (animationState.phase === 'done' && containerRef.current && games.length > 0) {
      spawnConfetti(containerRef.current, { count: 50, duration: 1500 });
    }
  }, [animationState.phase, games.length]);

  if (!mounted) {
    return null; // Hydration guard: don't render interactive UI until client-ready
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Responsibility Disclaimer — ALWAYS visible */}
      <ResponsibilityDisclaimer />

      {/* Settings Panel */}
      <SettingsPanel
        gameCount={gameCount}
        onGameCountChange={setGameCount}
        fixedNumbers={fixedNumbers}
        onAddFixed={addFixedNumber}
        onRemoveFixed={removeFixedNumber}
        excludedNumbers={excludedNumbers}
        onAddExcluded={addExcludedNumber}
        onRemoveExcluded={removeExcludedNumber}
        onGenerateDisabledChange={setGenerateDisabled}
      />

      {/* Generate Button */}
      <button
        onClick={() => {
          isGeneratingRef.current = true;
          generate();
          setTimeout(() => {
            isGeneratingRef.current = false;
          }, 2000);
        }}
        disabled={generateDisabled}
        className="w-full py-3 px-4 rounded-lg bg-brand text-on-brand font-semibold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors"
      >
        {t('buttons.generate')}
      </button>

      {/* Sound Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={soundOn}
          onChange={(e) => setSoundOn(e.target.checked)}
          className="w-4 h-4 rounded accent-brand focus-visible:ring-2 focus-visible:ring-focus-ring"
        />
        <span className="text-sm">{t('settings.sound')}</span>
      </label>

      {/* Game Results */}
      {games.length > 0 && (
        <GameList games={games} animationPhase={animationState.phase} />
      )}

      {/*
        Announce the final result to screen readers once generation
        completes. aria-live used to sit on the Generate button itself,
        which announces nothing (a button's own text isn't dynamic content) —
        moved to a dedicated status region, and gated on the "done" phase so
        it doesn't read out the rapidly-flickering rolling/locking numbers.
      */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {animationState.phase === 'done' && games.length > 0
          ? formatGamesPlaintext(games, (i) => t('results.gameLabel', { count: i + 1 }))
          : ''}
      </div>

      {/* History Panel */}
      <HistoryPanel
        history={history}
        onRestore={restoreFromHistory}
        onClear={clearHistoryLocal}
      />

      {/* Official winning-results link (동행복권) */}
      <a
        href="https://www.dhlottery.co.kr/lt645/result"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-hairline text-text text-sm font-medium hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors"
      >
        <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{t('officialResult')}</span>
        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-text-muted" aria-hidden="true" />
      </a>
    </div>
  );
}
