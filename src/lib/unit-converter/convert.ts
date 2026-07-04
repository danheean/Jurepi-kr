/**
 * Unit Converter — Router by category
 * Dispatches conversions to the appropriate category converter
 */

import { CategoryId } from './types';
import * as length from './converters/length';
import * as mass from './converters/mass';
import * as temperature from './converters/temperature';
import * as area from './converters/area';
import * as volume from './converters/volume';
import * as speed from './converters/speed';
import * as digitalStorage from './converters/digital-storage';
import * as time from './converters/time';

const convertersByCategory = {
  length,
  mass,
  temperature,
  area,
  volume,
  speed,
  digital_storage: digitalStorage,
  time,
};

/**
 * Dispatch to the appropriate category converter
 * @param category — one of the 8 CategoryId values
 * @param value — numeric input
 * @param fromUnit — unit string
 * @param toUnit — unit string
 * @returns converted numeric value
 * @throws Error if category or unit is unknown
 */
export function convert(
  category: CategoryId,
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const converter = convertersByCategory[category];
  if (!converter) {
    throw new Error(`Unknown category: ${category}`);
  }
  return converter.convert(value, fromUnit, toUnit);
}

/**
 * Validate that a unit exists in a category
 */
export function validateUnit(category: CategoryId, unit: string): boolean {
  const converter = convertersByCategory[category];
  if (!converter) return false;
  return converter.validateUnit(unit);
}
