import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useIpFetch } from './useIpFetch';
import * as fetchModule from '@/lib/my-ip/fetch';
import { IpFetchError } from '@/lib/my-ip/schema';

vi.mock('@/lib/my-ip/fetch');

const mockFetchIp = vi.spyOn(fetchModule, 'fetchIp');

describe('useIpFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch IP on mount', async () => {
    const mockData = {
      ipv4: '203.0.113.45',
      provider: 'api.ipify.org' as const,
      fetchedAt: Date.now(),
    };

    mockFetchIp.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useIpFetch());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    mockFetchIp.mockRejectedValueOnce(new IpFetchError('ALL_PROVIDERS_FAILED', 'Test error'));

    const { result } = renderHook(() => useIpFetch());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('ALL_PROVIDERS_FAILED');
  });

  it('should track online/offline state', async () => {
    mockFetchIp.mockResolvedValueOnce({
      ipv4: '203.0.113.45',
      provider: 'api.ipify.org' as const,
      fetchedAt: Date.now(),
    });

    const { result } = renderHook(() => useIpFetch());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should call refresh to re-fetch IP', async () => {
    const mockData1 = {
      ipv4: '203.0.113.45',
      provider: 'api.ipify.org' as const,
      fetchedAt: 1000,
    };
    const mockData2 = {
      ipv4: '203.0.113.46',
      provider: 'api.ipify.org' as const,
      fetchedAt: 2000,
    };

    mockFetchIp.mockResolvedValueOnce(mockData1).mockResolvedValueOnce(mockData2);

    const { result } = renderHook(() => useIpFetch());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });
  });

  it('should not fetch again if already fetching', async () => {
    let resolveFirstFetch: any;
    const firstFetchPromise = new Promise<any>((resolve) => {
      resolveFirstFetch = resolve;
    });

    mockFetchIp.mockReturnValueOnce(firstFetchPromise);

    const { result } = renderHook(() => useIpFetch());

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Call refresh again while loading — should be prevented
    act(() => {
      result.current.refresh();
    });

    // Resolve the first fetch
    act(() => {
      resolveFirstFetch({
        ipv4: '203.0.113.45',
        provider: 'api.ipify.org' as const,
        fetchedAt: Date.now(),
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only have called fetchIp once (mount only, second refresh was prevented)
    expect(mockFetchIp).toHaveBeenCalledTimes(1);
  });

  it('auto-retries on "online" event while in error state (no stale closure)', async () => {
    const mockData = {
      ipv4: '203.0.113.45',
      provider: 'api.ipify.org' as const,
      fetchedAt: Date.now(),
    };
    mockFetchIp
      .mockRejectedValueOnce(new IpFetchError('NETWORK_ERROR', 'offline'))
      .mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useIpFetch());

    await waitFor(() => {
      expect(result.current.error).toBe('NETWORK_ERROR');
    });

    // Reconnect: the 'online' handler must see the CURRENT error state,
    // not the stale initial null captured at effect setup.
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });
    expect(result.current.error).toBeNull();
    expect(mockFetchIp).toHaveBeenCalledTimes(2);
  });

  it('does not auto-retry on "online" event when there is no error', async () => {
    const mockData = {
      ipv4: '203.0.113.45',
      provider: 'api.ipify.org' as const,
      fetchedAt: Date.now(),
    };
    mockFetchIp.mockResolvedValue(mockData);

    const { result } = renderHook(() => useIpFetch());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(mockFetchIp).toHaveBeenCalledTimes(1);
  });

  it('starts with isOnline=true (SSR-consistent) and syncs navigator.onLine after mount', async () => {
    mockFetchIp.mockRejectedValue(new IpFetchError('NETWORK_ERROR', 'offline'));
    const onLineSpy = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);

    try {
      const { result } = renderHook(() => useIpFetch());

      // Initial render must match SSR output (true) — hydration safety.
      // After the mount effect, the real browser value (false) must win.
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    } finally {
      onLineSpy.mockRestore();
    }
  });

  it('survives Strict Mode effect re-run (mounted flag restored, loading resolves)', async () => {
    const { StrictMode, createElement } = await import('react');
    const mockData = {
      ipv4: '203.0.113.45',
      provider: 'api.ipify.org' as const,
      fetchedAt: Date.now(),
    };
    mockFetchIp.mockResolvedValue(mockData);

    // StrictMode mounts → cleanup → re-runs the effect; the mounted flag must
    // be restored or setState is skipped forever and loading sticks at true.
    const { result } = renderHook(() => useIpFetch(), {
      wrapper: ({ children }) => createElement(StrictMode, null, children),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual(mockData);
  });
});
