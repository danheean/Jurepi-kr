import { describe, it, expect } from 'vitest';
import { normalizeSearchText, filterTopics } from './search';
import type { MergedTopic } from './schema';

describe('bookmarks/search', () => {
  describe('normalizeSearchText', () => {
    it('converts to lowercase', () => {
      expect(normalizeSearchText('HARNESS')).toBe('harness');
    });

    it('removes spaces', () => {
      expect(normalizeSearchText('harness engineering')).toBe('harnessengineering');
    });

    it('removes hyphens', () => {
      expect(normalizeSearchText('harness-engineering')).toBe('harnessengineering');
    });

    it('removes underscores', () => {
      expect(normalizeSearchText('harness_engineering')).toBe('harnessengineering');
    });

    it('normalizes NFD → NFC (diacritics)', () => {
      const result = normalizeSearchText('café');
      expect(result).not.toContain(' ');
    });

    it('handles multiple spaces', () => {
      expect(normalizeSearchText('a   b')).toBe('ab');
    });

    it('handles multiple hyphens', () => {
      expect(normalizeSearchText('a---b')).toBe('ab');
    });
  });

  describe('filterTopics', () => {
    const topic1: MergedTopic = {
      slug: 'harness-engineering',
      ko: {
        title: '하네스 엔지니어링',
        description: '신뢰할 수 있는 하네스 자료',
        sections: [
          {
            heading: '메타 스킬',
            links: [
              { label: 'Agent', url: 'https://example.com/a', description: 'Agent stuff' },
              { label: 'TDD', url: 'https://example.com/tdd' },
              { label: 'Review', url: 'https://example.com/review' },
            ],
          },
        ],
      },
      en: {
        title: 'Harness Engineering',
        description: 'Trusted resources',
        sections: [
          {
            heading: 'Meta Skills',
            links: [
              { label: 'Agent Orchestration', url: 'https://example.com/a' },
              { label: 'TDD Guide', url: 'https://example.com/tdd' },
              { label: 'Code Review', url: 'https://example.com/review' },
            ],
          },
        ],
      },
    };

    const topic2: MergedTopic = {
      slug: 'frontend-resources',
      ko: {
        title: '프런트엔드 리소스',
        description: '웹 개발 자료',
        sections: [
          {
            heading: 'CSS',
            links: [
              { label: 'Tailwind', url: 'https://example.com/tailwind' },
              { label: 'Postcss', url: 'https://example.com/postcss' },
              { label: 'SCSS', url: 'https://example.com/scss' },
            ],
          },
        ],
      },
      en: {
        title: 'Frontend Resources',
        description: 'Web development tools',
        sections: [
          {
            heading: 'Styling',
            links: [
              { label: 'Tailwind CSS', url: 'https://example.com/tailwind' },
              { label: 'Postcss Tools', url: 'https://example.com/postcss' },
              { label: 'SCSS Guide', url: 'https://example.com/scss' },
            ],
          },
        ],
      },
    };

    const topics = [topic1, topic2];

    it('returns all topics when query is empty', () => {
      expect(filterTopics(topics, '')).toEqual(topics);
    });

    it('returns all topics when query is whitespace', () => {
      expect(filterTopics(topics, '   ')).toEqual(topics);
    });

    it('matches by KO title', () => {
      const result = filterTopics(topics, '하네스');
      expect(result).toContainEqual(topic1);
      expect(result).not.toContainEqual(topic2);
    });

    it('matches by EN title', () => {
      const result = filterTopics(topics, 'Harness');
      expect(result).toContainEqual(topic1);
    });

    it('matches by KO description', () => {
      const result = filterTopics(topics, '신뢰할 수 있는');
      expect(result).toContainEqual(topic1);
    });

    it('matches by EN description', () => {
      const result = filterTopics(topics, 'Trusted');
      expect(result).toContainEqual(topic1);
    });

    it('matches by section heading (KO)', () => {
      const result = filterTopics(topics, '메타 스킬');
      expect(result).toContainEqual(topic1);
    });

    it('matches by section heading (EN)', () => {
      const result = filterTopics(topics, 'Meta Skills');
      expect(result).toContainEqual(topic1);
    });

    it('matches by link label (KO)', () => {
      const result = filterTopics(topics, 'Agent');
      expect(result).toContainEqual(topic1);
    });

    it('matches by link label (EN)', () => {
      const result = filterTopics(topics, 'Orchestration');
      expect(result).toContainEqual(topic1);
    });

    it('is case insensitive', () => {
      const resultLower = filterTopics(topics, 'harness');
      const resultUpper = filterTopics(topics, 'HARNESS');
      expect(resultLower).toEqual(resultUpper);
    });

    it('is space insensitive', () => {
      const result1 = filterTopics(topics, 'harness engineering');
      const result2 = filterTopics(topics, 'harnessengineering');
      expect(result1).toEqual(result2);
    });

    it('matches partial words', () => {
      const result = filterTopics(topics, 'harness');
      expect(result).toContainEqual(topic1);
    });

    it('returns empty array on no match', () => {
      const result = filterTopics(topics, 'nonexistent-thing');
      expect(result).toEqual([]);
    });

    it('respects locale parameter: ko only', () => {
      const result = filterTopics(topics, 'Harness', 'ko');
      // EN title match should not return when locale='ko'
      expect(result.length).toBe(0);
    });

    it('respects locale parameter: en only', () => {
      const result = filterTopics(topics, 'Harness', 'en');
      expect(result).toContainEqual(topic1);
    });

    it('respects locale parameter: ko matches KO title', () => {
      const result = filterTopics(topics, '하네스', 'ko');
      expect(result).toContainEqual(topic1);
    });

    it('matches single specific topic', () => {
      const result = filterTopics(topics, 'Tailwind');
      expect(result.length).toBe(1); // Only "frontend-resources" mentions Tailwind
      expect(result[0].slug).toBe('frontend-resources');
    });
  });
});
