import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { TagTabs } from './TagTabs';
import type { Tag } from './useDevPeopleCatalog';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

function renderKo(
  selectedTag: Tag | undefined = undefined,
  onSelectTag = vi.fn()
) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo as never}>
      <TagTabs selectedTag={selectedTag} onSelectTag={onSelectTag} />
    </NextIntlClientProvider>
  );
}

function renderEn(
  selectedTag: Tag | undefined = undefined,
  onSelectTag = vi.fn()
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messagesEn as never}>
      <TagTabs selectedTag={selectedTag} onSelectTag={onSelectTag} />
    </NextIntlClientProvider>
  );
}

describe('TagTabs', () => {
  it('renders as a labelled filter group (not a fake tablist)', () => {
    renderKo();

    const group = screen.getByTestId('tag-tabs');
    expect(group).toHaveAttribute('role', 'group');
    expect(group).toHaveAttribute('aria-label', '인물 필터');
  });

  it('renders "All" toggle with undefined id', () => {
    renderKo();

    const allTab = screen.getByTestId('tag-tab-undefined');
    expect(allTab).toBeInTheDocument();
    expect(allTab).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders tag tabs with i18n labels', () => {
    renderKo();

    // Expect at least some common tags to be rendered
    expect(screen.getByTestId('tag-tab-ai')).toBeInTheDocument();
    expect(screen.getByTestId('tag-tab-python')).toBeInTheDocument();
  });

  it('sets aria-pressed=true for active toggle', () => {
    renderKo('ai');

    const aiTab = screen.getByTestId('tag-tab-ai');
    expect(aiTab).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets aria-pressed=false for inactive toggles', () => {
    renderKo('ai');

    const pythonTab = screen.getByTestId('tag-tab-python');
    expect(pythonTab).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onSelectTag when tab is clicked', async () => {
    const onSelectTag = vi.fn();
    const user = userEvent.setup();

    renderKo(undefined, onSelectTag);

    const aiTab = screen.getByTestId('tag-tab-ai');
    await user.click(aiTab);

    expect(onSelectTag).toHaveBeenCalledWith('ai');
  });

  it('calls onSelectTag with undefined when All tab is clicked', async () => {
    const onSelectTag = vi.fn();
    const user = userEvent.setup();

    renderKo('ai', onSelectTag);

    const allTab = screen.getByTestId('tag-tab-undefined');
    await user.click(allTab);

    expect(onSelectTag).toHaveBeenCalledWith(undefined);
  });

  it('applies active styling to selected tab', () => {
    renderKo('ai');

    const aiTab = screen.getByTestId('tag-tab-ai');
    expect(aiTab).toHaveClass('bg-brand', 'text-on-brand');
  });

  it('applies inactive styling to unselected tabs', () => {
    renderKo('ai');

    const pythonTab = screen.getByTestId('tag-tab-python');
    expect(pythonTab).toHaveClass('bg-surface-muted', 'text-text-secondary');
  });

  it('has data-testid on each tab button', () => {
    renderKo();

    const allTab = screen.getByTestId('tag-tab-undefined');
    expect(allTab).toBeInTheDocument();

    const aiTab = screen.getByTestId('tag-tab-ai');
    expect(aiTab).toBeInTheDocument();
  });

  it('renders English labels for en locale', () => {
    renderEn();

    expect(screen.getByTestId('tag-tab-undefined')).toHaveTextContent('All');
    expect(screen.getByTestId('tag-tab-ai')).toBeInTheDocument();
  });

  it('has focus ring on focus', async () => {
    renderKo();
    const user = userEvent.setup();

    const aiTab = screen.getByTestId('tag-tab-ai');
    await user.click(aiTab);

    // Tab should be focused
    expect(aiTab).toHaveFocus();
  });
});
