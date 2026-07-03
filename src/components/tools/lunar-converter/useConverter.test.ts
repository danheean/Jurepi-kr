import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConverter } from './useConverter';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useConverter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useConverter());

    expect(result.current.solarYear).toBe(0);
    expect(result.current.solarMonth).toBe(0);
    expect(result.current.solarDay).toBe(0);
    expect(result.current.lunarYear).toBe(0);
  });

  it('mounts successfully', async () => {
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });
  });

  it('sets solar date and triggers conversion', async () => {
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    act(() => {
      result.current.setSolar(2024, 3, 15);
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result).toHaveProperty('solarDate');
    if (result.current.result && !('error' in result.current.result)) {
      expect(result.current.result.solarDate.year).toBe(2024);
      expect(result.current.result.solarDate.month).toBe(3);
      expect(result.current.result.solarDate.day).toBe(15);
    }
  });

  it('handles out-of-range solar date error', async () => {
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    act(() => {
      result.current.setSolar(1390, 1, 1);
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result).toHaveProperty('error');
    if (result.current.result && 'error' in result.current.result) {
      expect(result.current.result.error).toBe('out_of_range');
    }
  });

  it('boundary solar 1901-01-01 keeps the valid result (lunar 1900) and does NOT self-overwrite with out_of_range', async () => {
    // Regression: solar Jan 1901 maps to lunar 1900. Mirroring that lunar value
    // into the inputs must NOT re-trigger lunarToSolar(1900) (which would error),
    // so the displayed result must stay the valid conversion, not out_of_range.
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    act(() => {
      result.current.setSolar(1901, 1, 1);
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    // Give any (buggy) follow-up conversion a chance to run and overwrite.
    await new Promise((r) => setTimeout(r, 50));

    expect(result.current.result).toHaveProperty('solarDate');
    expect(result.current.result).not.toHaveProperty('error');
    if (result.current.result && !('error' in result.current.result)) {
      expect(result.current.result.lunarDate.year).toBe(1900);
    }
  });

  it('sets lunar date and triggers conversion', async () => {
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    // 2023 has leap month 2 (윤2월)
    act(() => {
      result.current.setLunar(2023, 2, 15, true);
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result).toHaveProperty('solarDate');
  });

  it('persists recents to localStorage on successful conversion', async () => {
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    act(() => {
      result.current.setSolar(2024, 3, 15);
    });

    await waitFor(() => {
      expect(result.current.recents.length).toBeGreaterThan(0);
    });

    const stored = localStorage.getItem('jurepi-lunar-converter');
    expect(stored).not.toBeNull();

    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.entries).toHaveLength(result.current.recents.length);
    }
  });

  it('loads a recent conversion', async () => {
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    const recent = {
      solarDate: '2024-03-15',
      lunarDate: '2024-02-06(윤)',
      ts: Date.now(),
    };

    act(() => {
      result.current.loadRecent(recent);
    });

    expect(result.current.solarYear).toBe(2024);
    expect(result.current.solarMonth).toBe(3);
    expect(result.current.solarDay).toBe(15);
  });

  it('handles leap month toggle on lunar input', async () => {
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    act(() => {
      result.current.setLunar(2023, 2, 15, true);
    });

    expect(result.current.lunarIsLeap).toBe(true);

    act(() => {
      result.current.setLunar(2023, 2, 15, false);
    });

    expect(result.current.lunarIsLeap).toBe(false);
  });

  it('handles copy to clipboard', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });

    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    act(() => {
      result.current.setSolar(2024, 3, 15);
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    await act(async () => {
      await result.current.copy('solar');
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith('2024-03-15');
  });

  it('deduplicates recent entries', async () => {
    const { result } = renderHook(() => useConverter());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });

    // First conversion
    act(() => {
      result.current.setSolar(2024, 3, 15);
    });

    await waitFor(() => {
      expect(result.current.recents).toHaveLength(1);
    });

    const initialCount = result.current.recents.length;

    // Same conversion again (should move to front, not duplicate)
    act(() => {
      result.current.setSolar(2024, 3, 15);
    });

    await waitFor(() => {
      expect(result.current.recents).toHaveLength(initialCount);
    });
  });
});
