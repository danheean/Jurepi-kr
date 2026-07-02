import { describe, it, expect, beforeEach } from 'vitest';
import {
  initCatalog,
  allTopics,
  byId,
  topics,
  validateUniqueSlug,
  validateLocaleCompleteness,
  validateLinkCounts,
} from './catalog';
import type { MergedTopic } from './schema';

describe('bookmarks/catalog', () => {
  const mockTopics: MergedTopic[] = [
    {
      slug: 'harness-engineering',
      ko: {
        title: '하네스 엔지니어링',
        description: 'Desc',
        sections: [
          {
            heading: 'H1',
            links: [
              { label: 'L1', url: 'https://example.com/1' },
              { label: 'L2', url: 'https://example.com/2' },
              { label: 'L3', url: 'https://example.com/3' },
            ],
          },
        ],
      },
      en: {
        title: 'Harness Engineering',
        description: 'Desc',
        sections: [
          {
            heading: 'H1',
            links: [
              { label: 'L1', url: 'https://example.com/1' },
              { label: 'L2', url: 'https://example.com/2' },
              { label: 'L3', url: 'https://example.com/3' },
            ],
          },
        ],
      },
    },
    {
      slug: 'frontend-resources',
      ko: {
        title: '프런트엔드',
        description: 'Desc',
        sections: [
          {
            heading: 'H2',
            links: [
              { label: 'L1', url: 'https://example.com/a' },
              { label: 'L2', url: 'https://example.com/b' },
              { label: 'L3', url: 'https://example.com/c' },
            ],
          },
        ],
      },
      en: {
        title: 'Frontend',
        description: 'Desc',
        sections: [
          {
            heading: 'H2',
            links: [
              { label: 'L1', url: 'https://example.com/a' },
              { label: 'L2', url: 'https://example.com/b' },
              { label: 'L3', url: 'https://example.com/c' },
            ],
          },
        ],
      },
    },
  ];

  beforeEach(() => {
    initCatalog(mockTopics);
  });

  describe('initCatalog', () => {
    it('initializes catalog', () => {
      initCatalog(mockTopics);
      expect(allTopics()).toEqual(mockTopics);
    });

    it('replaces previous catalog', () => {
      const newCatalog: MergedTopic[] = [mockTopics[0]];
      initCatalog(newCatalog);
      expect(allTopics()).toEqual(newCatalog);
      expect(allTopics()).toHaveLength(1);
    });
  });

  describe('allTopics', () => {
    it('returns all topics', () => {
      const result = allTopics();
      expect(result).toHaveLength(2);
    });

    it('returns topics in order', () => {
      const result = allTopics();
      expect(result[0].slug).toBe('harness-engineering');
      expect(result[1].slug).toBe('frontend-resources');
    });
  });

  describe('byId', () => {
    it('finds topic by slug', () => {
      const result = byId('harness-engineering');
      expect(result).not.toBeNull();
      expect(result?.slug).toBe('harness-engineering');
    });

    it('returns null if not found', () => {
      const result = byId('nonexistent');
      expect(result).toBeNull();
    });

    it('finds by any slug', () => {
      const result = byId('frontend-resources');
      expect(result).not.toBeNull();
      expect(result?.ko.title).toBe('프런트엔드');
    });
  });

  describe('topics', () => {
    it('returns all topic slugs', () => {
      const result = topics();
      expect(result).toContain('harness-engineering');
      expect(result).toContain('frontend-resources');
      expect(result).toHaveLength(2);
    });

    it('returns slugs in order', () => {
      const result = topics();
      expect(result[0]).toBe('harness-engineering');
      expect(result[1]).toBe('frontend-resources');
    });

    it('returns empty array for empty catalog', () => {
      initCatalog([]);
      expect(topics()).toEqual([]);
    });
  });

  describe('validateUniqueSlug', () => {
    it('passes for unique slugs', () => {
      const errors = validateUniqueSlug(mockTopics);
      expect(errors).toHaveLength(0);
    });

    it('catches duplicate slugs', () => {
      const duplicates: MergedTopic[] = [
        mockTopics[0],
        {
          ...mockTopics[1],
          slug: 'harness-engineering', // Duplicate!
        },
      ];
      const errors = validateUniqueSlug(duplicates);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Duplicate');
    });

    it('reports each duplicate', () => {
      const triplicates: MergedTopic[] = [
        mockTopics[0],
        { ...mockTopics[1], slug: 'harness-engineering' },
        { ...mockTopics[1], slug: 'harness-engineering' },
      ];
      const errors = validateUniqueSlug(triplicates);
      expect(errors.length).toBe(2); // Two duplicates reported
    });
  });

  describe('validateLocaleCompleteness', () => {
    it('passes for complete topics', () => {
      const errors = validateLocaleCompleteness(mockTopics);
      expect(errors).toHaveLength(0);
    });

    it('catches missing KO title', () => {
      const incomplete: MergedTopic[] = [
        {
          ...mockTopics[0],
          ko: {
            title: '', // Invalid!
            description: 'Desc',
            sections: mockTopics[0].ko.sections,
          },
        },
      ];
      const errors = validateLocaleCompleteness(incomplete);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('KO');
    });

    it('catches missing EN title', () => {
      const incomplete: MergedTopic[] = [
        {
          ...mockTopics[0],
          en: {
            title: '', // Invalid!
            description: 'Desc',
            sections: mockTopics[0].en.sections,
          },
        },
      ];
      const errors = validateLocaleCompleteness(incomplete);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('EN');
    });

    it('catches missing KO sections', () => {
      const incomplete: MergedTopic[] = [
        {
          ...mockTopics[0],
          ko: {
            title: 'Title',
            description: 'Desc',
            sections: [], // Invalid!
          },
        },
      ];
      const errors = validateLocaleCompleteness(incomplete);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('catches missing EN description', () => {
      const incomplete: MergedTopic[] = [
        {
          ...mockTopics[0],
          en: {
            title: 'Title',
            description: '', // Invalid!
            sections: mockTopics[0].en.sections,
          },
        },
      ];
      const errors = validateLocaleCompleteness(incomplete);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateLinkCounts', () => {
    it('passes with ≥3 links per locale', () => {
      const errors = validateLinkCounts(mockTopics);
      expect(errors).toHaveLength(0);
    });

    it('catches KO with <3 links', () => {
      const insufficient: MergedTopic[] = [
        {
          ...mockTopics[0],
          ko: {
            title: 'Title',
            description: 'Desc',
            sections: [
              {
                heading: 'H',
                links: [
                  { label: 'L1', url: 'https://example.com/1' },
                  { label: 'L2', url: 'https://example.com/2' }, // Only 2
                ],
              },
            ],
          },
        },
      ];
      const errors = validateLinkCounts(insufficient);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('KO');
    });

    it('catches EN with <3 links', () => {
      const insufficient: MergedTopic[] = [
        {
          ...mockTopics[0],
          en: {
            title: 'Title',
            description: 'Desc',
            sections: [
              {
                heading: 'H',
                links: [{ label: 'L1', url: 'https://example.com/1' }], // Only 1
              },
            ],
          },
        },
      ];
      const errors = validateLinkCounts(insufficient);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('EN');
    });

    it('passes with exactly 3 links (min)', () => {
      const exactly3: MergedTopic[] = [
        {
          slug: 'test',
          ko: {
            title: 'T',
            description: 'D',
            sections: [
              {
                heading: 'H',
                links: [
                  { label: 'L1', url: 'https://example.com/1' },
                  { label: 'L2', url: 'https://example.com/2' },
                  { label: 'L3', url: 'https://example.com/3' },
                ],
              },
            ],
          },
          en: {
            title: 'T',
            description: 'D',
            sections: [
              {
                heading: 'H',
                links: [
                  { label: 'L1', url: 'https://example.com/1' },
                  { label: 'L2', url: 'https://example.com/2' },
                  { label: 'L3', url: 'https://example.com/3' },
                ],
              },
            ],
          },
        },
      ];
      const errors = validateLinkCounts(exactly3);
      expect(errors).toHaveLength(0);
    });

    it('respects custom minLinks parameter', () => {
      const insufficient: MergedTopic[] = [
        {
          slug: 'test',
          ko: {
            title: 'T',
            description: 'D',
            sections: [
              {
                heading: 'H',
                links: [
                  { label: 'L1', url: 'https://example.com/1' },
                  { label: 'L2', url: 'https://example.com/2' },
                  { label: 'L3', url: 'https://example.com/3' },
                  { label: 'L4', url: 'https://example.com/4' },
                ],
              },
            ],
          },
          en: {
            title: 'T',
            description: 'D',
            sections: [
              {
                heading: 'H',
                links: [
                  { label: 'L1', url: 'https://example.com/1' },
                  { label: 'L2', url: 'https://example.com/2' },
                  { label: 'L3', url: 'https://example.com/3' },
                ],
              },
            ],
          },
        },
      ];
      const errors = validateLinkCounts(insufficient, 4); // Require 4
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('EN');
    });
  });
});
