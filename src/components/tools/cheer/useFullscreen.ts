'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFullscreenReturn {
  isSupported: boolean;
  isActive: boolean;
  enter: (element: HTMLElement) => Promise<void>;
  exit: () => Promise<void>;

  // Wake Lock (independent feature)
  isWakeLockSupported: boolean;
  isWakeLocked: boolean;
  acquire: () => Promise<void>;
  release: () => Promise<void>;
}

/**
 * Fullscreen API + Screen Wake Lock feature detection and lifecycle.
 * All feature-detected; unsupported → methods are no-ops, isSupported false.
 * Wake lock re-acquires on visibilitychange when active.
 */
export function useFullscreen(): UseFullscreenReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isWakeLockSupported, setIsWakeLockSupported] = useState(false);
  const [isWakeLocked, setIsWakeLocked] = useState(false);

  const wakeLockRef = useRef<any>(null);
  const isWakeLockToggleRef = useRef(false);

  // Feature detection (mount)
  useEffect(() => {
    setIsSupported(!!document.fullscreenEnabled);
    setIsWakeLockSupported('wakeLock' in navigator);
  }, []);

  // Track fullscreenchange
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsActive(!!document.fullscreenElement);
    };

    if (isSupported) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  }, [isSupported]);

  // Track visibilitychange to re-acquire wake lock
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.hidden ||
        !isWakeLockToggleRef.current ||
        !isWakeLockSupported ||
        !isWakeLocked
      ) {
        return;
      }

      // Page became visible and toggle is on — re-acquire
      try {
        if (!wakeLockRef.current) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          setIsWakeLocked(true);
        }
      } catch {
        // Silently fail (user may have denied permission)
        setIsWakeLocked(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isWakeLockSupported, isWakeLocked]);

  const enter = useCallback(
    async (element: HTMLElement) => {
      if (!isSupported) return;

      try {
        await element.requestFullscreen();
        setIsActive(true);

        // Auto-acquire wake lock on fullscreen enter if toggle on
        if (isWakeLockToggleRef.current && isWakeLockSupported) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            setIsWakeLocked(true);
          } catch {
            // Silently fail
          }
        }
      } catch {
        // Fullscreen failed (e.g., user denied)
      }
    },
    [isSupported, isWakeLockSupported]
  );

  const exit = useCallback(async () => {
    if (!isSupported) return;

    try {
      await document.exitFullscreen();
      setIsActive(false);

      // Release wake lock on exit
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsWakeLocked(false);
      }
    } catch {
      // Exit failed
    }
  }, [isSupported]);

  const acquire = useCallback(async () => {
    if (!isWakeLockSupported) return;

    isWakeLockToggleRef.current = true;

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsWakeLocked(true);
    } catch {
      setIsWakeLocked(false);
    }
  }, [isWakeLockSupported]);

  const release = useCallback(async () => {
    isWakeLockToggleRef.current = false;

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Already released
      }
      wakeLockRef.current = null;
      setIsWakeLocked(false);
    }
  }, []);

  return {
    isSupported,
    isActive,
    enter,
    exit,
    isWakeLockSupported,
    isWakeLocked,
    acquire,
    release,
  };
}
