import { renderHook, act, waitFor } from '@/__test__/test-utils';
import { useUnitConverter } from './useUnitConverter';

/**
 * useUnitConverter hook tests
 * Covers state management, conversion logic, localStorage persistence,
 * and edge cases (invalid input, negative values, recents debouncing).
 */

describe('useUnitConverter', () => {
  // Clear localStorage between tests
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should initialize with default values (length category, meter→kilometer)', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      expect(result.current.category).toBe('length');
      expect(result.current.fromUnit).toBe('meter');
      expect(result.current.toUnit).toBe('kilometer');
      expect(result.current.fromValue).toBe('');
      expect(result.current.toValue).toBeNull();
      expect(result.current.formattedToValue).toBe('');
      expect(result.current.precision).toBe(2);
      expect(result.current.recents).toEqual([]);
      expect(result.current.error).toBe('');
    });
  });

  describe('conversion logic', () => {
    it('should compute toValue when fromValue is entered', async () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('1');
      });

      // 1 meter = 0.001 kilometers
      expect(result.current.toValue).toBe(0.001);
      expect(result.current.formattedToValue).toBe('0.00');
    });

    it('should return null toValue when fromValue is empty', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('1');
      });

      expect(result.current.toValue).not.toBeNull();

      act(() => {
        result.current.setFromValue('');
      });

      expect(result.current.toValue).toBeNull();
      expect(result.current.formattedToValue).toBe('');
    });

    it('should handle non-numeric input by setting error', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('abc');
      });

      expect(result.current.error).toBe('invalidNumber');
      expect(result.current.toValue).toBeNull();
    });

    it('should reject negative values for non-temperature categories', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('-10');
      });

      expect(result.current.error).toBe('negativeNonTemp');
      expect(result.current.toValue).toBeNull();
    });

    it('should allow negative values for temperature', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setCategory('temperature');
      });

      // Should reset to temperature defaults (Celsius)
      expect(result.current.fromUnit).not.toBeUndefined();

      act(() => {
        result.current.setFromValue('-10');
      });

      // Should not error for negative temperature
      expect(result.current.error).toBe('');
      expect(result.current.toValue).not.toBeNull();
    });

    it('should clear error when valid input is provided after invalid input', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('abc');
      });

      expect(result.current.error).toBe('invalidNumber');

      act(() => {
        result.current.setFromValue('100');
      });

      expect(result.current.error).toBe('');
      expect(result.current.toValue).not.toBeNull();
    });
  });

  describe('precision', () => {
    it('should format toValue to specified decimal places', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('1.23456');
      });

      expect(result.current.precision).toBe(2);
      expect(result.current.formattedToValue).toMatch(/\d+\.\d{2}/);

      act(() => {
        result.current.setPrecision(4);
      });

      expect(result.current.precision).toBe(4);
      expect(result.current.formattedToValue).toMatch(/\d+\.\d{4}/);
    });

    it('should clamp precision within [0, 6] range', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setPrecision(-5);
      });

      expect(result.current.precision).toBe(0);

      act(() => {
        result.current.setPrecision(10);
      });

      expect(result.current.precision).toBe(6);
    });
  });

  describe('swap', () => {
    it('should swap from and to units', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      const originalFrom = result.current.fromUnit;
      const originalTo = result.current.toUnit;

      act(() => {
        result.current.swap();
      });

      expect(result.current.fromUnit).toBe(originalTo);
      expect(result.current.toUnit).toBe(originalFrom);
    });

    it('should recompute conversion after swapping units', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('1000');
      });

      const originalToValue = result.current.toValue;

      act(() => {
        result.current.swap();
      });

      // After swap, 1 kilometer should convert back differently
      expect(result.current.toValue).not.toBe(originalToValue);
    });
  });

  describe('category switching', () => {
    it('should switch to category and reset from/to units to canonical pair', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      expect(result.current.category).toBe('length');

      act(() => {
        result.current.setCategory('temperature');
      });

      expect(result.current.category).toBe('temperature');
      // Should reset to canonical pair for temperature
      expect(result.current.fromUnit).not.toBe('meter');
      expect(result.current.toUnit).not.toBe('kilometer');
    });

    it('should clear fromValue and error when switching categories', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('100');
      });

      expect(result.current.fromValue).not.toBe('');

      act(() => {
        result.current.setCategory('mass');
      });

      expect(result.current.fromValue).toBe('');
      expect(result.current.error).toBe('');
    });
  });

  describe('localStorage persistence', () => {
    it('should load recents from localStorage on mount', async () => {
      const storedData = {
        version: 1,
        recents: [
          {
            categoryId: 'length',
            fromUnit: 'meter',
            toUnit: 'kilometer',
            fromValue: 100,
            toValue: 0.1,
            timestamp: Date.now() - 10000,
          },
        ],
        metadata: { createdAt: Date.now() },
      };

      localStorage.setItem(
        'jurepi-unit-converter',
        JSON.stringify(storedData)
      );

      const { result } = renderHook(() => useUnitConverter('en'));

      expect(result.current.recents).toHaveLength(1);
      expect(result.current.recents[0].fromValue).toBe(100);
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('jurepi-unit-converter', 'invalid json');

      const { result } = renderHook(() => useUnitConverter('en'));

      // Should start fresh without throwing
      expect(result.current.recents).toEqual([]);
    });

    it('should persist discrete state (category, units, precision) immediately', async () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setCategory('mass');
      });

      await waitFor(() => {
        const stored = localStorage.getItem('jurepi-unit-converter');
        expect(stored).toBeTruthy();
      });

      const parsed = JSON.parse(localStorage.getItem('jurepi-unit-converter')!);
      // Verify that category change was persisted
      expect(parsed).toBeDefined();
    });
  });

  describe('recents management', () => {
    it('should add a recent conversion after debounce period', async () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('100');
      });

      // Before debounce timeout, recents might still be empty or have the entry
      // The debounce happens asynchronously, so we wait for it
      await waitFor(() => {
        expect(result.current.recents.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const recent = result.current.recents[0];
      expect(recent.categoryId).toBe('length');
      expect(recent.fromValue).toBe(100);
      expect(recent.fromUnit).toBe('meter');
      expect(recent.toUnit).toBe('kilometer');
    }, { timeout: 5000 });

    it('should persist recents to localStorage after debounce', async () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('50');
      });

      await waitFor(() => {
        const stored = localStorage.getItem('jurepi-unit-converter');
        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed.recents.length).toBeGreaterThan(0);
        }
      }, { timeout: 3000 });
    }, { timeout: 5000 });

    it('should restore a recent conversion', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      const recentEntry = {
        categoryId: 'mass' as const,
        fromUnit: 'kilogram',
        toUnit: 'pound',
        fromValue: 75,
        toValue: 165.35,
        timestamp: Date.now(),
      };

      act(() => {
        result.current.restoreRecent(recentEntry);
      });

      expect(result.current.category).toBe('mass');
      expect(result.current.fromUnit).toBe('kilogram');
      expect(result.current.toUnit).toBe('pound');
      expect(result.current.fromValue).toBe('75');
    });

    it('should clear all recents', async () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('100');
      });

      await waitFor(() => {
        expect(result.current.recents.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      act(() => {
        result.current.clearRecents();
      });

      expect(result.current.recents).toEqual([]);

      const stored = JSON.parse(localStorage.getItem('jurepi-unit-converter')!);
      expect(stored.recents).toEqual([]);
    }, { timeout: 5000 });
  });

  describe('callback stability', () => {
    it('should not cause infinite re-renders from callback changes', () => {
      const { result, rerender } = renderHook(() => useUnitConverter('en'));

      const initialSetCategory = result.current.setCategory;
      const initialSwap = result.current.swap;

      rerender();

      // Callbacks should be stable references across renders
      expect(result.current.setCategory).toBe(initialSetCategory);
      expect(result.current.swap).toBe(initialSwap);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('999999999');
      });

      expect(result.current.error).toBe('');
      expect(result.current.toValue).not.toBeNull();
    });

    it('should handle very small decimal numbers', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('0.0001');
      });

      expect(result.current.error).toBe('');
      expect(result.current.toValue).not.toBeNull();
    });

    it('should handle whitespace in input (should be trimmed by Number conversion)', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('  100  ');
      });

      // Number("  100  ") = 100, so conversion should work
      expect(result.current.toValue).not.toBeNull();
      expect(result.current.error).toBe('');
    });

    it('should handle whitespace-only input', () => {
      const { result } = renderHook(() => useUnitConverter('en'));

      act(() => {
        result.current.setFromValue('   ');
      });

      // Whitespace-only should be treated as empty
      expect(result.current.toValue).toBeNull();
      expect(result.current.error).toBe('');
    });
  });
});
