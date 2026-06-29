/**
 * Tool Registry — compile-time source of truth
 * New tools: add a ToolMeta entry, add messages keys, implement component, wire slug branch
 */

import { ToolMeta } from './types';

export const tools: ToolMeta[] = [
  {
    id: 'ladder',
    slug: 'ladder',
    category: 'random',
    icon: 'ListTree',
    accent: 'coral',
    status: 'live',
    isNew: true,
    isPopular: true,
    order: 1,
    keywords: ['사다리', '사다리타기', 'ladder', 'ghost leg', '추첨', '제비뽑기', '아미다쿠지', 'amidakuji'],
  },
  // Example of coming_soon tool (commented out)
  // {
  //   id: 'picker',
  //   slug: 'picker',
  //   category: 'random',
  //   icon: 'Shuffle',
  //   accent: 'rose',
  //   status: 'coming_soon',
  //   order: 2,
  //   keywords: ['추첨', 'picker', 'random'],
  // },
];

/** Get all live tools for static generation */
export function getLiveTools() {
  return tools.filter((tool) => tool.status === 'live');
}

/** Get tool by slug */
export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
