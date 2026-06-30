/**
 * Pure Web Audio sound effect player.
 * Plays a short "pop" sound using an injectable AudioContext factory.
 * Safe for SSR: returns early if window is undefined.
 * Never throws to caller; errors are caught and silently ignored.
 */

/**
 * Play a short "pop" sound via Web Audio API.
 * The AudioContext is created via a factory function (injectable for testing).
 *
 * @param enabled whether to play the sound
 * @param ctxFactory optional factory to create/get an AudioContext;
 *                   defaults to creating a new AudioContext from window
 */
export function playPop(
  enabled: boolean,
  ctxFactory?: () => AudioContext | null
): void {
  if (!enabled) return;

  // Default factory: create AudioContext from window (with fallback for webkit)
  const factory = ctxFactory || (() => {
    if (typeof window === 'undefined') return null;
    try {
      return (
        new (window.AudioContext ||
          (window as any).webkitAudioContext)()
      );
    } catch {
      return null;
    }
  });

  try {
    const ctx = factory();
    if (!ctx) return;

    // Resume context if needed (user gesture requirement)
    if (ctx.resume) {
      ctx.resume().catch(() => {
        // Resume may fail; ignore
      });
    }

    // Create oscillator and gain
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Connect: osc → gain → destination
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Set up sound: moderate frequency, short envelope
    osc.frequency.value = 1000; // Hz

    // Gain envelope: attack 0, sustain ~100ms, then exponential decay
    const now = ctx.currentTime;
    const sustainTime = 0.1; // 100ms
    const endTime = now + sustainTime;

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, endTime);

    // Play
    osc.start(now);
    osc.stop(endTime);
  } catch {
    // Silently ignore any errors
  }
}
