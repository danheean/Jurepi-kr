import { describe, it, expect } from 'vitest';
import { getLiveTools, getToolBySlug } from '@/tools/registry';

describe('Tool Registry (Smoke Test)', () => {
  it('should have at least one live tool', () => {
    const liveTools = getLiveTools();
    expect(liveTools.length).toBeGreaterThan(0);
  });

  it('should find ladder tool by slug', () => {
    const ladderTool = getToolBySlug('ladder');
    expect(ladderTool).toBeDefined();
    expect(ladderTool?.slug).toBe('ladder');
    expect(ladderTool?.status).toBe('live');
  });

  it('should return undefined for nonexistent slug', () => {
    const tool = getToolBySlug('nonexistent');
    expect(tool).toBeUndefined();
  });
});
