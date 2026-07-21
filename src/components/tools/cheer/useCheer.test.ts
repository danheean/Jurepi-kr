import { renderHook, act } from '@testing-library/react';
import { useCheer } from './useCheer';
import { DEFAULT_SETTINGS } from '@/lib/cheer';

describe('useCheer', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('initializes with default settings', () => {
    const { result } = renderHook(() => useCheer());

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.recents).toEqual([]);
  });

  it('opens and closes the immersive presentation overlay', async () => {
    const { result } = renderHook(() => useCheer());

    expect(result.current.presenting).toBe(false);

    act(() => {
      result.current.startPresenting();
    });
    expect(result.current.presenting).toBe(true);

    await act(async () => {
      await result.current.stopPresenting();
    });
    expect(result.current.presenting).toBe(false);
  });

  it('updates settings immutably and persists', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '우리 팀 우승!' });
    });

    expect(result.current.settings.text).toBe('우리 팀 우승!');
    expect(result.current.settings.effect).toBe('scroll'); // default unchanged

    // Check localStorage was persisted
    const stored = localStorage.getItem('jurepi-cheer');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.lastSettings.text).toBe('우리 팀 우승!');
  });

  it('loads and restores from localStorage', () => {
    // Pre-populate localStorage
    localStorage.setItem(
      'jurepi-cheer',
      JSON.stringify({
        version: 1,
        recents: ['최근 응원'],
        lastSettings: {
          text: '저장된 응원',
          textColor: 'coral',
          bgColor: 'black',
          effect: 'flash',
          speed: 'fast',
          size: 'XL',
          landscape: true,
        },
      })
    );

    const { result } = renderHook(() => useCheer());

    expect(result.current.settings.text).toBe('저장된 응원');
    expect(result.current.settings.textColor).toBe('coral');
    expect(result.current.recents).toContain('최근 응원');
  });

  it('commits message to recents', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '첫 번째 응원' });
      result.current.commitMessage('첫 번째 응원');
    });

    expect(result.current.recents).toContain('첫 번째 응원');

    act(() => {
      result.current.updateSettings({ text: '두 번째 응원' });
      result.current.commitMessage('두 번째 응원');
    });

    expect(result.current.recents[0]).toBe('두 번째 응원'); // MRU
    expect(result.current.recents[1]).toBe('첫 번째 응원');
  });

  it('loads a recent message', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '응원' });
      result.current.commitMessage('응원');
    });

    act(() => {
      result.current.updateSettings({ text: '' });
    });

    expect(result.current.settings.text).toBe('');

    act(() => {
      result.current.loadRecent('응원');
    });

    expect(result.current.settings.text).toBe('응원');
  });

  it('clears the message', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '응원 문구' });
    });

    expect(result.current.settings.text).toBe('응원 문구');

    act(() => {
      result.current.clearMessage();
    });

    expect(result.current.settings.text).toBe('');
  });

  it('supports fullscreen feature detection', () => {
    const { result } = renderHook(() => useCheer());

    // Fullscreen API may or may not be available in test environment
    expect(typeof result.current.isFullscreenSupported).toBe('boolean');
    expect(typeof result.current.isFullscreenActive).toBe('boolean');
  });

  it('supports wake lock feature detection', () => {
    const { result } = renderHook(() => useCheer());

    expect(typeof result.current.isWakeLockSupported).toBe('boolean');
    expect(typeof result.current.isWakeLocked).toBe('boolean');
  });
});
