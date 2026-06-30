'use client';

interface WinnerConfettiProps {
  active: boolean;
  reducedMotion: boolean;
}

export function WinnerConfetti({
  active,
  reducedMotion,
}: WinnerConfettiProps) {
  if (!active || reducedMotion) {
    return null;
  }

  const ACCENT_COLORS = [
    'coral',
    'mint',
    'sky',
    'sun',
    'grape',
    'rose',
  ];

  // Generate 16 confetti pieces with random properties
  const pieces = Array.from({ length: 16 }).map((_, i) => {
    const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
    const delay = (i * 30) % 200; // Stagger start times
    const duration = 1800 + Math.random() * 600; // 1.8-2.4s
    const xOffset = (Math.random() - 0.5) * 300; // -150 to 150
    const rotation = Math.random() * 720;
    const size = 6 + Math.random() * 8; // 6-14px

    return {
      id: i,
      color,
      delay,
      duration,
      xOffset,
      rotation,
      size,
    };
  });

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
      data-testid="winner-confetti"
    >
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: `var(--accent-${piece.color})`,
            borderRadius: '2px',
            animation: `confetti-fall-${piece.id} ${piece.duration}ms ease-out forwards`,
            animationDelay: `${piece.delay}ms`,
            transform: `translateX(-50%) translateY(-50%)`,
          }}
          data-testid={`confetti-piece-${piece.id}`}
        />
      ))}

      <style>{`
        ${pieces
          .map(
            (piece) => `
          [data-testid="winner-confetti"] > div:nth-child(${piece.id + 1}) {
            animation: confetti-fall-${piece.id} ${piece.duration}ms ease-out forwards;
            animation-delay: ${piece.delay}ms;
          }

          @keyframes confetti-fall-${piece.id} {
            0% {
              opacity: 1;
              transform: translateX(-50%) translateY(-50%) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: translateX(calc(-50% + ${piece.xOffset}px)) translateY(calc(-50% + 300px)) rotate(${piece.rotation}deg);
            }
          }
        `
          )
          .join('\n')}
      `}</style>
    </div>
  );
}
