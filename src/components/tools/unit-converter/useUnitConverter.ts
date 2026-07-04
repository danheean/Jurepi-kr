import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  UNITS_BY_CATEGORY,
  PRECISION_DEFAULT,
  PRECISION_MIN,
  PRECISION_MAX,
  RECENTS_MAX,
  type CategoryId,
  type RecentsEntry,
  type RecentsStore,
  convert,
  formatNumber,
  addRecent,
  pruneUnknown,
  deserialize,
  serialize,
} from '@/lib/unit-converter';

const STORAGE_KEY = 'jurepi-unit-converter';
const RECENTS_DEBOUNCE_MS = 100;

export interface UseUnitConverterReturn {
  // State
  category: CategoryId;
  fromUnit: string;
  toUnit: string;
  fromValue: string;
  toValue: number | null;
  formattedToValue: string;
  precision: number;
  recents: RecentsEntry[];
  error: string;
  // Actions
  setCategory: (id: CategoryId) => void;
  setFromUnit: (id: string) => void;
  setToUnit: (id: string) => void;
  setFromValue: (v: string) => void;
  setPrecision: (n: number) => void;
  swap: () => void;
  clearRecents: () => void;
  restoreRecent: (e: RecentsEntry) => void;
}

/**
 * useUnitConverter — Single-source-of-truth for all unit converter state.
 * Mount loads localStorage; changes persist with rules:
 * - Discrete state (category, units, precision) persist IMMEDIATELY.
 * - Value/recents persist with DEBOUNCE (100ms for addRecent).
 */
export function useUnitConverter(locale: string = 'en'): UseUnitConverterReturn {
  // State (frozen after initialization, changed via action callbacks)
  const [category, setCategory] = useState<CategoryId>('length');
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [toUnit, setToUnit] = useState<string>('kilometer');
  const [fromValue, setFromValue] = useState<string>('');
  const [precision, setPrecision] = useState<number>(PRECISION_DEFAULT);
  const [recents, setRecents] = useState<RecentsEntry[]>([]);
  const [error, setError] = useState<string>('');

  // Refs for debounce and cleanup
  const recentsDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Derived: compute toValue from fromValue, fromUnit, toUnit
  const toValue: number | null = useMemo(() => {
    if (!fromValue || fromValue.trim() === '') return null;

    const num = Number(fromValue);
    if (isNaN(num)) {
      setError('invalidNumber');
      return null;
    }

    try {
      // Validate range for non-temperature
      if (category !== 'temperature' && num < 0) {
        setError('negativeNonTemp');
        return null;
      }

      const result = convert(category, num, fromUnit, toUnit);
      if (!isFinite(result)) {
        setError('outOfRange');
        return null;
      }

      setError('');
      return result;
    } catch (e) {
      setError('outOfRange');
      return null;
    }
  }, [fromValue, fromUnit, toUnit, category]);

  // Derived: format toValue to precision decimals
  const formattedToValue: string = useMemo(() => {
    if (toValue === null) return '';
    return formatNumber(toValue, precision, locale);
  }, [toValue, precision, locale]);

  // Lifecycle: load localStorage on mount
  useEffect(() => {
    try {
      const stored = deserialize(localStorage.getItem(STORAGE_KEY));
      const pruned = pruneUnknown(stored.recents);
      setRecents(pruned);
    } catch {
      // Silent: start fresh if deserialization fails
    }
  }, []);

  // Debounced recents persistence (100ms for addRecent)
  useEffect(() => {
    if (recentsDebounceRef.current) clearTimeout(recentsDebounceRef.current);

    recentsDebounceRef.current = setTimeout(() => {
      if (fromValue && toValue !== null && fromUnit && toUnit) {
        const newRecents = addRecent(recents, {
          categoryId: category,
          fromUnit,
          toUnit,
          fromValue: Number(fromValue),
          toValue,
        });
        setRecents(newRecents);

        // Persist to localStorage
        try {
          const store: RecentsStore = {
            version: 1,
            recents: newRecents,
            metadata: { createdAt: Date.now() },
          };
          localStorage.setItem(STORAGE_KEY, serialize(store));
        } catch {
          // Silent: quota exceeded or disabled
        }
      }
    }, RECENTS_DEBOUNCE_MS);

    return () => {
      if (recentsDebounceRef.current) clearTimeout(recentsDebounceRef.current);
    };
  }, [fromValue, toValue, fromUnit, toUnit, category, recents]);

  // Discrete state persistence (IMMEDIATE, no debounce)
  useEffect(() => {
    try {
      const store = deserialize(localStorage.getItem(STORAGE_KEY));
      localStorage.setItem(
        STORAGE_KEY,
        serialize({
          ...store,
          recents,
        })
      );
    } catch {
      // Silent
    }
  }, [category, fromUnit, toUnit, precision]);

  // Action callbacks (avoid captured state via functional setState)
  const handleSetCategory = useCallback((catId: CategoryId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      setFromUnit(cat.canonicalPair.from);
      setToUnit(cat.canonicalPair.to);
    }
    setCategory(catId);
    setFromValue(''); // Reset input on category change
    setError('');
  }, []);

  const handleSetFromUnit = useCallback((id: string) => {
    setFromUnit(id);
  }, []);

  const handleSetToUnit = useCallback((id: string) => {
    setToUnit(id);
  }, []);

  const handleSetFromValue = useCallback((v: string) => {
    setFromValue(v);
  }, []);

  const handleSetPrecision = useCallback((n: number) => {
    const clamped = Math.min(PRECISION_MAX, Math.max(PRECISION_MIN, n));
    setPrecision(clamped);
  }, []);

  const handleSwap = useCallback(() => {
    // Swap from and to units using the current values from deps
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  }, [fromUnit, toUnit]);

  const handleClearRecents = useCallback(() => {
    setRecents([]);
    try {
      const store = deserialize(localStorage.getItem(STORAGE_KEY));
      localStorage.setItem(
        STORAGE_KEY,
        serialize({
          ...store,
          recents: [],
        })
      );
    } catch {
      // Silent
    }
  }, []);

  const handleRestoreRecent = useCallback(
    (entry: RecentsEntry) => {
      handleSetCategory(entry.categoryId);
      setFromUnit(entry.fromUnit);
      setToUnit(entry.toUnit);
      setFromValue(String(entry.fromValue));
    },
    [handleSetCategory]
  );

  return {
    // State
    category,
    fromUnit,
    toUnit,
    fromValue,
    toValue,
    formattedToValue,
    precision,
    recents,
    error,
    // Actions
    setCategory: handleSetCategory,
    setFromUnit: handleSetFromUnit,
    setToUnit: handleSetToUnit,
    setFromValue: handleSetFromValue,
    setPrecision: handleSetPrecision,
    swap: handleSwap,
    clearRecents: handleClearRecents,
    restoreRecent: handleRestoreRecent,
  };
}
