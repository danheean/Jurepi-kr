import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canvasToBlob } from './export';

type BlobCallback = (blob: Blob | null) => void;

describe('canvasToBlob', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exports function exists and is callable', () => {
    expect(canvasToBlob).toBeDefined();
    expect(typeof canvasToBlob).toBe('function');
  });

  it('uses canvas.toBlob when available', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(mockBlob);
    });
    Object.defineProperty(canvas, 'toBlob', { value: toBlob, writable: true });

    const result = await canvasToBlob(canvas);

    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(result).toEqual(mockBlob);
  });

  it('rejects when toBlob callback receives null', async () => {
    const toBlob = vi.fn((callback: BlobCallback) => {
      callback(null);
    });
    Object.defineProperty(canvas, 'toBlob', { value: toBlob, writable: true });

    await expect(canvasToBlob(canvas)).rejects.toThrow('Canvas toBlob returned null');
  });

  it('falls back to dataURL when toBlob is not available', async () => {
    const mockDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const toDataURL = vi.fn(() => mockDataUrl);
    Object.defineProperty(canvas, 'toBlob', { value: undefined, writable: true });
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL, writable: true });

    const result = await canvasToBlob(canvas);

    expect(toDataURL).toHaveBeenCalledWith('image/png');
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/png');
  });

  it('handles dataURL with different MIME types', async () => {
    // Valid minimal JPEG header
    const mockDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA';
    const toDataURL = vi.fn(() => mockDataUrl);
    Object.defineProperty(canvas, 'toBlob', { value: undefined, writable: true });
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL, writable: true });

    const result = await canvasToBlob(canvas);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/jpeg');
  });

  it('defaults to image/png MIME type when cannot extract from dataURL', async () => {
    const mockDataUrl = 'data:base64,iVBORw0KGgo=';
    const toDataURL = vi.fn(() => mockDataUrl);
    Object.defineProperty(canvas, 'toBlob', { value: undefined, writable: true });
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL, writable: true });

    const result = await canvasToBlob(canvas);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/png');
  });

  it('rejects when toDataURL throws', async () => {
    const toDataURL = vi.fn(() => {
      throw new Error('toDataURL failed');
    });
    Object.defineProperty(canvas, 'toBlob', { value: undefined, writable: true });
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL, writable: true });

    await expect(canvasToBlob(canvas)).rejects.toThrow('toDataURL failed');
  });

  it('decodes base64 dataURL correctly in fallback', async () => {
    // Simple 1-pixel PNG
    const mockDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const toDataURL = vi.fn(() => mockDataUrl);
    Object.defineProperty(canvas, 'toBlob', { value: undefined, writable: true });
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL, writable: true });

    const result = await canvasToBlob(canvas);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/png');
    expect(result.size).toBeGreaterThan(0);
  });

  it('accepts HTMLCanvasElement and returns Promise', () => {
    // Legacy test: basic acceptance check
    const promise = canvasToBlob(canvas);
    expect(promise).toBeInstanceOf(Promise);
  });
});
