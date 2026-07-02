export const SOUND_TICK_HZ = 800;
export const SOUND_CHIME_HZ = 1200;
export const SOUND_BUZZ_HZ = 200;

export interface ToneSpec {
  freqHz: number;
  durationMs: number;
  type: string;
}

/**
 * Pure tone spec builder (no side effects)
 * Returns spec for Web Audio synthesis
 */
export function toneSpec(kind: 'tick' | 'chime' | 'buzz'): ToneSpec {
  switch (kind) {
    case 'tick':
      return {
        freqHz: SOUND_TICK_HZ,
        durationMs: 100,
        type: 'sine',
      };
    case 'chime':
      return {
        freqHz: SOUND_CHIME_HZ,
        durationMs: 200,
        type: 'sine',
      };
    case 'buzz':
      return {
        freqHz: SOUND_BUZZ_HZ,
        durationMs: 150,
        type: 'sine',
      };
  }
}
