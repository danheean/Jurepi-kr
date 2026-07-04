/**
 * Unit Converter — Shared type definitions (frozen contract)
 * Pure domain types, no React/Next imports.
 */

export type CategoryId = 'length' | 'mass' | 'temperature' | 'area' | 'volume' | 'speed' | 'digital_storage' | 'time';

/**
 * Single unit of measurement
 * INVARIANT: exactly one of factor OR tempFormula must be defined (not both)
 */
export interface Unit {
  id: string;           // e.g., "meter", "foot", "kelvin"
  symbol: string;       // e.g., "m", "ft", "K"
  category: CategoryId;
  factor?: number;      // for non-temperature: ratio to base unit (e.g., meter=1, km=1000)
  tempFormula?: { a: number; b: number }; // for temperature: T_target = T_source × a + b
}

/**
 * Category of units (e.g., "Length", "Temperature")
 */
export interface Category {
  id: CategoryId;
  label: string;        // localized from i18n tools.unit-converter.categories.<id>
  icon: string;         // lucide icon name (e.g., 'Ruler', 'Weight')
  units: Unit[];
  canonicalPair: { from: string; to: string }; // default from/to unit IDs on category select
}

/**
 * Result of a single conversion
 */
export interface ConversionResult {
  fromValue: number;
  toValue: number;
  fromUnit: string;
  toUnit: string;
  category: CategoryId;
  precision: number;
  formatted: string;    // toValue formatted to precision decimals
}

/**
 * Single entry in recents history
 */
export interface RecentsEntry {
  categoryId: CategoryId;
  fromUnit: string;
  toUnit: string;
  fromValue: number;
  toValue: number;
  timestamp: number;
}

/**
 * Persisted recents store (localStorage)
 */
export interface RecentsStore {
  version: number;      // STORE_VERSION = 1
  recents: RecentsEntry[];
  metadata: { createdAt: number };
}

// Constants
export const RECENTS_MAX = 20;
export const CONVERSION_DEBOUNCE = 50; // ms
export const PRECISION_MIN = 0;
export const PRECISION_MAX = 6;
export const PRECISION_DEFAULT = 2;
export const STORE_VERSION = 1;
