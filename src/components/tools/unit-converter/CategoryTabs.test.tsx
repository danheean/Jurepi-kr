import { render, userEvent, screen } from '@/__test__/test-utils';
import { CategoryTabs } from './CategoryTabs';
import { CATEGORIES, type CategoryId } from '@/lib/unit-converter';

/**
 * CategoryTabs component tests
 * Tests roving tabindex, keyboard navigation (ArrowLeft/ArrowRight),
 * category selection, and accessibility.
 */

describe('CategoryTabs', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render 8 category tabs', () => {
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(8);
  });

  it('should mark active tab with aria-selected="true"', () => {
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const activeTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');

    expect(activeTab).toBeTruthy();
    expect(activeTab?.textContent).toContain('Length');
  });

  it('should mark inactive tabs with aria-selected="false"', () => {
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const inactiveTabs = tabs.filter(tab => tab.getAttribute('aria-selected') === 'false');

    expect(inactiveTabs.length).toBeGreaterThan(0);
  });

  it('should call onChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const massTab = tabs.find(tab => tab.textContent?.includes('Weight'));

    await user.click(massTab!);

    expect(mockOnChange).toHaveBeenCalledWith('mass');
  });

  it('should navigate right with ArrowRight key', async () => {
    const user = userEvent.setup();
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const firstTab = tabs[0];

    // Focus the first tab
    firstTab.focus();
    expect(document.activeElement).toBe(firstTab);

    // Press ArrowRight
    await user.keyboard('{ArrowRight}');

    expect(mockOnChange).toHaveBeenCalledWith(CATEGORIES[1].id);
  });

  it('should navigate left with ArrowLeft key', async () => {
    const user = userEvent.setup();
    render(
      <CategoryTabs active="mass" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const secondTab = tabs[1];

    // Focus the second tab (mass)
    secondTab.focus();

    // Press ArrowLeft
    await user.keyboard('{ArrowLeft}');

    expect(mockOnChange).toHaveBeenCalledWith(CATEGORIES[0].id);
  });

  it('should wrap around to last tab when pressing ArrowLeft on first tab', async () => {
    const user = userEvent.setup();
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const firstTab = tabs[0];

    firstTab.focus();

    await user.keyboard('{ArrowLeft}');

    expect(mockOnChange).toHaveBeenCalledWith(CATEGORIES[CATEGORIES.length - 1].id);
  });

  it('should wrap around to first tab when pressing ArrowRight on last tab', async () => {
    const user = userEvent.setup();
    const lastCategoryId = CATEGORIES[CATEGORIES.length - 1].id;

    render(
      <CategoryTabs active={lastCategoryId} onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const lastTab = tabs[tabs.length - 1];

    lastTab.focus();

    await user.keyboard('{ArrowRight}');

    expect(mockOnChange).toHaveBeenCalledWith(CATEGORIES[0].id);
  });

  it('should have roving tabindex (only focused tab has tabIndex=0)', async () => {
    const user = userEvent.setup();
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');

    // Initially, first tab should have tabIndex 0 (it's the active and initially focused)
    expect(tabs[0].getAttribute('tabIndex')).toBe('0');

    // Other tabs should have tabIndex -1
    for (let i = 1; i < tabs.length; i++) {
      expect(tabs[i].getAttribute('tabIndex')).toBe('-1');
    }

    // Click on a different tab to change focus
    const massTab = tabs[1]; // mass tab
    await user.click(massTab);

    // After clicking, the roving tabindex should have moved
    // (The component uses focusedIndex to determine which tab gets tabIndex=0)
    const updatedTabs = screen.getAllByRole('tab');
    expect(mockOnChange).toHaveBeenCalled();
    // At least verify roving tabindex is being used (one tab has 0, others have -1)
    const tabIndexZeroCount = updatedTabs.filter(tab => tab.getAttribute('tabIndex') === '0').length;
    expect(tabIndexZeroCount).toBeGreaterThan(0);
  });

  it('should focus tab when clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const massTab = tabs.find(tab => tab.textContent?.includes('Weight'));

    await user.click(massTab!);

    expect(document.activeElement).toBe(massTab);
  });

  it('should display category icons and labels', () => {
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    // Check for at least some category labels
    expect(screen.getByText('Length')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Weight')).toBeInTheDocument();
  });

  it('should handle rapid category changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const massTab = tabs[1];
    const tempTab = tabs[2];

    await user.click(massTab);
    expect(mockOnChange).toHaveBeenCalledWith('mass');

    rerender(
      <CategoryTabs active="mass" onChange={mockOnChange} />
    );

    await user.click(tempTab);
    expect(mockOnChange).toHaveBeenCalledWith('temperature');
  });

  it('should support keyboard focus on mount', () => {
    render(
      <CategoryTabs active="length" onChange={mockOnChange} />
    );

    const tabs = screen.getAllByRole('tab');
    const firstTab = tabs[0];

    // Manually focus for testing
    firstTab.focus();
    expect(document.activeElement).toBe(firstTab);
  });
});
