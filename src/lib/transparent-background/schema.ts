import { z } from 'zod';

/**
 * Constants for transparent background removal
 */
export const DOWNSCALE_THRESHOLD_PX = 4096;
export const CORNER_INSET_RATIO = 0.05; // 5% inset from edge
export const TOLERANCE_MAX_DISTANCE = 85; // RGB distance cap
export const FEATHER_MAX_PX = 20;
export const CHUNK_SIZE = 65536; // pixels per rAF frame

/**
 * RGB color type
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Schema for RGB color
 */
export const rgbSchema = z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
});

/**
 * Removal options input by user
 */
export interface RemovalOptions {
  bgColor: RGB;
  tolerance: number; // 0–100
  feather: number; // 0–20
  mode: 'flood-fill' | 'global';
}

export const removalOptionsSchema = z.object({
  bgColor: rgbSchema,
  tolerance: z.number().min(0).max(100),
  feather: z.number().min(0).max(FEATHER_MAX_PX),
  mode: z.enum(['flood-fill', 'global']),
});

/**
 * Result of removal operation
 */
export interface RemovalResult {
  imageData: ImageData;
  processingTimeMs: number;
}

/**
 * Processing state for UI state machine
 */
export type ProcessingPhase = 'idle' | 'uploading' | 'detecting' | 'removing' | 'done' | 'error';

export interface ProcessingState {
  phase: ProcessingPhase;
  progress: number; // 0–100
  error?: string;
}

/**
 * Local storage schema for user preferences
 */
export const transparentBgStoreSchema = z.object({
  tolerance: z.number().min(0).max(100).default(50),
  feather: z.number().min(0).max(FEATHER_MAX_PX).default(2),
  mode: z.enum(['flood-fill', 'global']).default('flood-fill'),
  lastBgColor: rgbSchema.optional(),
});

export type TransparentBgStore = z.infer<typeof transparentBgStoreSchema>;

export const STORE_KEY = 'jurepi-transparent-background';
export const STORE_VERSION = 1;
