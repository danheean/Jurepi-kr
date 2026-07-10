import { render, screen, userEvent } from '@/__test__/test-utils';
import { vi } from 'vitest';
import { CategoryFilter } from './CategoryFilter';
import type { CategoryOption } from '@/lib/tool-search';

describe('CategoryFilter', () => {
  const mockCategories: CategoryOption[] = [
    { id: 'all', labelKey: 'categories.all' },
    { id: 'text', labelKey: 'categories.text' },
    { id: 'converter', labelKey: 'categories.converter' },
  ];

  it('renders category pills', () => {
    const handleChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        active="all"
        onChange={handleChange}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Converter')).toBeInTheDocument();
  });

  it('marks active category with aria-pressed', () => {
    const handleChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        active="text"
        onChange={handleChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    const textButton = buttons.find(btn => btn.textContent?.includes('Text'));
    expect(textButton).toHaveAttribute('aria-pressed', 'true');

    const allButton = buttons.find(btn => btn.textContent?.includes('All'));
    expect(allButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with category id when pill is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        active="all"
        onChange={handleChange}
      />
    );

    const converterButton = screen.getByText('Converter').closest('button');
    if (converterButton) {
      await user.click(converterButton);
    }

    expect(handleChange).toHaveBeenCalledWith('converter');
  });

  it('renders trailing element if provided', () => {
    const handleChange = vi.fn();
    const trailingElement = <div data-testid="trailing">Trailing</div>;

    render(
      <CategoryFilter
        categories={mockCategories}
        active="all"
        onChange={handleChange}
        trailing={trailingElement}
      />
    );

    expect(screen.getByTestId('trailing')).toBeInTheDocument();
  });

  it('does not render trailing element if not provided', () => {
    const handleChange = vi.fn();

    render(
      <CategoryFilter
        categories={mockCategories}
        active="all"
        onChange={handleChange}
      />
    );

    expect(screen.queryByTestId('trailing')).not.toBeInTheDocument();
  });

  it('applies active styling to active category', () => {
    const handleChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        active="converter"
        onChange={handleChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    const converterButton = buttons.find(btn => btn.textContent?.includes('Converter'));

    expect(converterButton).toHaveClass('bg-brand');
    expect(converterButton).toHaveClass('text-on-brand');
    expect(converterButton).toHaveClass('shadow-card');
    expect(converterButton).toHaveClass('font-semibold');
  });

  it('applies inactive styling to inactive categories', () => {
    const handleChange = vi.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        active="converter"
        onChange={handleChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    const allButton = buttons.find(btn => btn.textContent?.includes('All'));

    expect(allButton).toHaveClass('bg-surface-muted');
    expect(allButton).toHaveClass('text-text-secondary');
    expect(allButton).toHaveClass('font-medium');
    expect(allButton).toHaveClass('hover:bg-hairline-strong');
  });
});
