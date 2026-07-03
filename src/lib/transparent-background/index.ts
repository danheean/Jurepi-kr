export {
  DOWNSCALE_THRESHOLD_PX,
  CORNER_INSET_RATIO,
  TOLERANCE_MAX_DISTANCE,
  FEATHER_MAX_PX,
  CHUNK_SIZE,
  STORE_KEY,
  STORE_VERSION,
  type RGB,
  type RemovalOptions,
  type RemovalResult,
  type ProcessingPhase,
  type ProcessingState,
  type TransparentBgStore,
  rgbSchema,
  removalOptionsSchema,
  transparentBgStoreSchema,
} from './schema';

export { euclideanDistance } from './color-distance';

export { detectBackgroundColor } from './corner-detect';

export { applyTransparency } from './transparency';

export { featherAlphaValues } from './feather';

export { canvasToBlob } from './export';
