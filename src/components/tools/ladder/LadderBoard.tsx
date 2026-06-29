'use client';

import { useTranslations } from 'next-intl';
import { tracePath } from '@/lib/ladder';
import type { UseLadderReturn } from './useLadder';

const ACCENT_COLORS = [
  'coral',
  'mint',
  'sky',
  'sun',
  'grape',
  'rose',
];

interface LadderBoardProps {
  ladder: UseLadderReturn;
  onTraceComplete?: (playerId: string) => void;
}

export function LadderBoard({ ladder, onTraceComplete }: LadderBoardProps) {
  const t = useTranslations('tools.ladder');

  if (ladder.state.phase === 'setup') return null;

  const { playerCount, rungs, permutation } = ladder.state;
  const numLevels = rungs.length || 5;
  const columnWidth = 60;
  const levelHeight = 40;
  const padding = 30;

  // SVG dimensions
  const svgWidth = padding * 2 + columnWidth * (playerCount - 1);
  const svgHeight = padding * 2 + levelHeight * numLevels;

  // Get path for a player
  const playerPath = ladder.state.activeTrace
    ? tracePath(rungs, ladder.state.players.findIndex(
        (p) => p.id === ladder.state.activeTrace
      ))
    : [];

  return (
    <div className="w-full overflow-x-auto mb-6 flex justify-center p-4">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ minHeight: '320px', maxWidth: '100%', height: 'auto' }}
        role="img"
        aria-label={t('board.aria')}
        data-testid="ladder-board"
        className="border border-hairline rounded-lg bg-surface"
      >
        {/* Vertical lines (players) */}
        {Array.from({ length: playerCount }).map((_, col) => (
          <line
            key={`col-${col}`}
            x1={padding + col * columnWidth}
            y1={padding}
            x2={padding + col * columnWidth}
            y2={padding + levelHeight * numLevels}
            stroke="var(--hairline-strong)"
            strokeWidth="3"
            strokeLinecap="round"
            aria-hidden="true"
          />
        ))}

        {/* Horizontal rungs */}
        {rungs.map((level, levelIdx) =>
          level.map((hasRung, col) => {
            if (!hasRung) return null;
            return (
              <line
                key={`rung-${levelIdx}-${col}`}
                x1={padding + col * columnWidth}
                y1={padding + (levelIdx + 1) * levelHeight}
                x2={padding + (col + 1) * columnWidth}
                y2={padding + (levelIdx + 1) * levelHeight}
                stroke="var(--hairline-strong)"
                strokeWidth="3"
                strokeLinecap="round"
                aria-hidden="true"
              />
            );
          })
        )}

        {/* Animated trace path */}
        {ladder.state.activeTrace &&
          playerPath.length > 0 && (
            <path
              d={playerPath
                .map((point, idx) => {
                  const x = padding + point.col * columnWidth;
                  const y = padding + point.level * levelHeight;
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              stroke={`var(--accent-${
                ACCENT_COLORS[
                  ladder.state.players.findIndex(
                    (p) => p.id === ladder.state.activeTrace
                  ) % ACCENT_COLORS.length
                ]
              })`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: ladder.prefers_reduced_motion ? 0 : 1000,
                animation: ladder.prefers_reduced_motion
                  ? 'none'
                  : 'strokeDraw 280ms ease-out forwards',
              }}
            />
          )}

        {/* Define animation */}
        <defs>
          <style>{`
            @keyframes strokeDraw {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
        </defs>
      </svg>
    </div>
  );
}
