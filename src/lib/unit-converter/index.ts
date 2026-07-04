/**
 * Unit Converter — Barrel export (frozen public API)
 */

export * from './types';
export * from './constants';
export { convert, validateUnit } from './convert';
export { formatNumber } from './precision';
export { addRecent, pruneUnknown, deserialize, serialize } from './recents';
export { RecentsStoreSchema } from './schema';
