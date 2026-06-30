import { describe, it, expect, vi } from 'vitest';
import { playPop } from './sound';

describe('sound', () => {
  describe('playPop', () => {
    it('does not call ctxFactory when enabled=false', () => {
      const ctxFactory = vi.fn();
      playPop(false, ctxFactory);
      expect(ctxFactory).not.toHaveBeenCalled();
    });

    it('calls ctxFactory when enabled=true', () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
      };
      const mockGain = {
        connect: vi.fn(),
        gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      };
      const mockCtx = {
        createOscillator: vi.fn(() => mockOscillator),
        createGain: vi.fn(() => mockGain),
        destination: {},
        resume: vi.fn(),
      };
      const ctxFactory = vi.fn(() => mockCtx as any);

      playPop(true, ctxFactory);

      expect(ctxFactory).toHaveBeenCalled();
    });

    it('creates oscillator and gain when enabled=true with valid context', () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
      };
      const mockGain = {
        connect: vi.fn(),
        gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      };
      const mockCtx = {
        createOscillator: vi.fn(() => mockOscillator),
        createGain: vi.fn(() => mockGain),
        destination: {},
        resume: vi.fn(() => Promise.resolve()),
        currentTime: 0,
      };
      const ctxFactory = vi.fn(() => mockCtx as any);

      playPop(true, ctxFactory);

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('calls oscillator.start when enabled=true', () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
      };
      const mockGain = {
        connect: vi.fn(),
        gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      };
      const mockCtx = {
        createOscillator: vi.fn(() => mockOscillator),
        createGain: vi.fn(() => mockGain),
        destination: {},
        resume: vi.fn(() => Promise.resolve()),
        currentTime: 0,
      };
      const ctxFactory = vi.fn(() => mockCtx as any);

      playPop(true, ctxFactory);

      expect(mockOscillator.start).toHaveBeenCalled();
    });

    it('calls oscillator.stop when enabled=true', () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
      };
      const mockGain = {
        connect: vi.fn(),
        gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      };
      const mockCtx = {
        createOscillator: vi.fn(() => mockOscillator),
        createGain: vi.fn(() => mockGain),
        destination: {},
        resume: vi.fn(() => Promise.resolve()),
        currentTime: 0,
      };
      const ctxFactory = vi.fn(() => mockCtx as any);

      playPop(true, ctxFactory);

      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('does not throw when ctxFactory returns null', () => {
      const ctxFactory = vi.fn(() => null);
      expect(() => playPop(true, ctxFactory)).not.toThrow();
    });

    it('does not throw when audio setup fails', () => {
      const mockCtx = {
        createOscillator: vi.fn(() => {
          throw new Error('Audio context error');
        }),
        resume: vi.fn(),
      };
      const ctxFactory = vi.fn(() => mockCtx as any);

      expect(() => playPop(true, ctxFactory)).not.toThrow();
    });

    it('does not throw when oscillator methods fail', () => {
      const mockOscillator = {
        connect: vi.fn(() => {
          throw new Error('Connect error');
        }),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
      };
      const mockGain = {
        connect: vi.fn(),
        gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      };
      const mockCtx = {
        createOscillator: vi.fn(() => mockOscillator),
        createGain: vi.fn(() => mockGain),
        destination: {},
        resume: vi.fn(),
        currentTime: 0,
      };
      const ctxFactory = vi.fn(() => mockCtx as any);

      expect(() => playPop(true, ctxFactory)).not.toThrow();
    });

    it('works when called without explicit ctxFactory (uses default)', () => {
      // This test just ensures the function doesn't crash with default params
      // In jsdom environment, window.AudioContext is undefined, so it should handle gracefully
      expect(() => playPop(true)).not.toThrow();
    });

    it('returns void regardless of enabled state', () => {
      const result1 = playPop(true);
      const result2 = playPop(false);
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
  });
});
