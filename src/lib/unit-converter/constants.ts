/**
 * Unit Converter — Category and unit definitions (frozen seed data)
 */

import { Category, CategoryId, Unit } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    label: '', // i18n tools.unit-converter.categories.length
    icon: 'Ruler',
    units: [
      { id: 'meter', symbol: 'm', category: 'length', factor: 1 },
      { id: 'millimeter', symbol: 'mm', category: 'length', factor: 0.001 },
      { id: 'centimeter', symbol: 'cm', category: 'length', factor: 0.01 },
      { id: 'kilometer', symbol: 'km', category: 'length', factor: 1000 },
      { id: 'inch', symbol: 'in', category: 'length', factor: 0.0254 },
      { id: 'foot', symbol: 'ft', category: 'length', factor: 0.3048 },
      { id: 'yard', symbol: 'yd', category: 'length', factor: 0.9144 },
      { id: 'mile', symbol: 'mi', category: 'length', factor: 1609.34 },
    ],
    canonicalPair: { from: 'meter', to: 'kilometer' },
  },
  {
    id: 'mass',
    label: '', // i18n tools.unit-converter.categories.mass
    icon: 'Weight',
    units: [
      { id: 'kilogram', symbol: 'kg', category: 'mass', factor: 1 },
      { id: 'gram', symbol: 'g', category: 'mass', factor: 0.001 },
      { id: 'milligram', symbol: 'mg', category: 'mass', factor: 1e-6 },
      { id: 'ounce', symbol: 'oz', category: 'mass', factor: 0.0283495 },
      { id: 'pound', symbol: 'lb', category: 'mass', factor: 0.453592 },
    ],
    canonicalPair: { from: 'kilogram', to: 'pound' },
  },
  {
    id: 'temperature',
    label: '', // i18n tools.unit-converter.categories.temperature
    icon: 'Thermometer',
    units: [
      { id: 'celsius', symbol: '°C', category: 'temperature', tempFormula: { a: 1, b: 0 } }, // base
      { id: 'fahrenheit', symbol: '°F', category: 'temperature', tempFormula: { a: 9 / 5, b: 32 } }, // C→F
      { id: 'kelvin', symbol: 'K', category: 'temperature', tempFormula: { a: 1, b: 273.15 } }, // C→K
    ],
    canonicalPair: { from: 'celsius', to: 'fahrenheit' },
  },
  {
    id: 'area',
    label: '', // i18n tools.unit-converter.categories.area
    icon: 'Maximize2',
    units: [
      { id: 'square_meter', symbol: 'm²', category: 'area', factor: 1 },
      { id: 'square_millimeter', symbol: 'mm²', category: 'area', factor: 1e-6 },
      { id: 'square_centimeter', symbol: 'cm²', category: 'area', factor: 0.0001 },
      { id: 'square_kilometer', symbol: 'km²', category: 'area', factor: 1e6 },
      { id: 'square_inch', symbol: 'in²', category: 'area', factor: 0.00064516 },
      { id: 'square_foot', symbol: 'ft²', category: 'area', factor: 0.092903 },
      { id: 'square_yard', symbol: 'yd²', category: 'area', factor: 0.836127 },
      { id: 'square_mile', symbol: 'mi²', category: 'area', factor: 2.58999e6 },
    ],
    canonicalPair: { from: 'square_meter', to: 'square_foot' },
  },
  {
    id: 'volume',
    label: '', // i18n tools.unit-converter.categories.volume
    icon: 'Container',
    units: [
      { id: 'liter', symbol: 'L', category: 'volume', factor: 0.001 }, // base = m³
      { id: 'milliliter', symbol: 'mL', category: 'volume', factor: 1e-6 },
      { id: 'cubic_inch', symbol: 'in³', category: 'volume', factor: 1.63871e-5 },
      { id: 'cubic_foot', symbol: 'ft³', category: 'volume', factor: 0.0283168 },
      { id: 'gallon', symbol: 'gal', category: 'volume', factor: 0.00378541 }, // US gallon
    ],
    canonicalPair: { from: 'liter', to: 'gallon' },
  },
  {
    id: 'speed',
    label: '', // i18n tools.unit-converter.categories.speed
    icon: 'Zap',
    units: [
      { id: 'meter_per_second', symbol: 'm/s', category: 'speed', factor: 1 },
      { id: 'kilometer_per_hour', symbol: 'km/h', category: 'speed', factor: 1 / 3.6 },
      { id: 'mile_per_hour', symbol: 'mi/h', category: 'speed', factor: 0.44704 },
      { id: 'knot', symbol: 'knot', category: 'speed', factor: 0.51444 },
    ],
    canonicalPair: { from: 'meter_per_second', to: 'kilometer_per_hour' },
  },
  {
    id: 'digital_storage',
    label: '', // i18n tools.unit-converter.categories.digital_storage
    icon: 'Database',
    units: [
      { id: 'byte', symbol: 'B', category: 'digital_storage', factor: 1 },
      { id: 'kilobyte', symbol: 'KB', category: 'digital_storage', factor: 1000 }, // decimal
      { id: 'megabyte', symbol: 'MB', category: 'digital_storage', factor: 1e6 },
      { id: 'gigabyte', symbol: 'GB', category: 'digital_storage', factor: 1e9 },
      { id: 'terabyte', symbol: 'TB', category: 'digital_storage', factor: 1e12 },
      { id: 'kibibyte', symbol: 'KiB', category: 'digital_storage', factor: 1024 }, // binary
      { id: 'mebibyte', symbol: 'MiB', category: 'digital_storage', factor: 1048576 },
      { id: 'gibibyte', symbol: 'GiB', category: 'digital_storage', factor: 1073741824 },
      { id: 'tebibyte', symbol: 'TiB', category: 'digital_storage', factor: 1099511627776 },
    ],
    canonicalPair: { from: 'kilobyte', to: 'megabyte' },
  },
  {
    id: 'time',
    label: '', // i18n tools.unit-converter.categories.time
    icon: 'Clock',
    units: [
      { id: 'millisecond', symbol: 'ms', category: 'time', factor: 0.001 },
      { id: 'second', symbol: 's', category: 'time', factor: 1 },
      { id: 'minute', symbol: 'min', category: 'time', factor: 60 },
      { id: 'hour', symbol: 'h', category: 'time', factor: 3600 },
      { id: 'day', symbol: 'day', category: 'time', factor: 86400 },
    ],
    canonicalPair: { from: 'second', to: 'minute' },
  },
];

/**
 * Convenience lookup: { categoryId → { unitId → Unit } }
 */
export const UNITS_BY_CATEGORY: Record<CategoryId, Record<string, Unit>> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.id] = Object.fromEntries(cat.units.map((u) => [u.id, u]));
    return acc;
  },
  {} as Record<CategoryId, Record<string, Unit>>
);
