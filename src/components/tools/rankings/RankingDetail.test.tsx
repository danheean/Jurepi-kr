import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__test__/test-utils';
import { RankingDetail } from './RankingDetail';
import type { MergedRanking } from '@/lib/rankings/schema';

const mockRanking: MergedRanking = {
  slug: 'arena-llm-agents',
  field: 'tech',
  asOfDate: '2026-07-01',
  sourceUrl: 'https://example.com/arena',
  ko: {
    title: 'LLM 에이전트 전투장',
    sourceNote: '2026년 7월 1일 기준',
    items: [
      { rank: 1, name: 'Claude', description: 'Top agent' },
      { rank: 2, name: 'GPT-4', description: 'Second place' },
    ],
  },
  en: {
    title: 'LLM Agent Arena',
    sourceNote: 'As of July 1, 2026',
    items: [
      { rank: 1, name: 'Claude', description: 'Top agent' },
      { rank: 2, name: 'GPT-4', description: 'Second place' },
    ],
  },
};

describe('RankingDetail — share button integration', () => {
  beforeEach(() => {
    // Mock clipboard for all tests
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        configurable: true,
      });
    }
  });

  it('renders share buttons and copies entity url when ranking exists', async () => {
    const onCloseMock = vi.fn();

    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    render(
      <RankingDetail
        ranking={mockRanking}
        onClose={onCloseMock}
      />
    );

    // Verify ranking content renders (English as default in test-utils)
    expect(screen.getByRole('heading', { name: mockRanking.en.title })).toBeInTheDocument();

    // Verify share buttons are present
    expect(screen.getByTestId('share-button-copy')).toBeInTheDocument();

    // Click copy button and verify it uses the entity URL
    const copyBtn = screen.getByTestId('share-button-copy');
    copyBtn.click();

    const expectedUrl = `https://jurepi.kr/en/tools/rankings/${mockRanking.slug}`;
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith(expectedUrl);
    });
  });

  it('does not render share buttons when ranking is null', () => {
    const onCloseMock = vi.fn();

    render(
      <RankingDetail
        ranking={null}
        onClose={onCloseMock}
      />
    );

    // Should show select hint, not share buttons
    expect(screen.queryByTestId('share-button-copy')).not.toBeInTheDocument();
  });
});
