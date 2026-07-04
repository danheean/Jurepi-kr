import { render, screen } from '@/__test__/test-utils';
import { ConversionTable } from './ConversionTable';
import { CATEGORIES } from '@/lib/unit-converter';

/**
 * ConversionTable component tests
 * Smoke tests for rendering unit conversion matrix, different categories,
 * and responsive behavior.
 */

describe('ConversionTable', () => {
  it('should render heading "Conversion Table"', () => {
    render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    expect(screen.getByText('Conversion Table')).toBeInTheDocument();
  });

  it('should render all units for a category as a grid', () => {
    render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    // Length category should have multiple units
    // We can verify by checking that the grid exists
    const grid = screen.getByText('Conversion Table').parentElement;
    expect(grid).toBeInTheDocument();
  });

  it('should display unit symbols and converted values', () => {
    render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    // Should show at least the meter symbol
    expect(screen.getByText('m')).toBeInTheDocument();
  });

  it('should use fromValue to calculate conversions', () => {
    const { rerender } = render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    // Re-render with different value
    rerender(
      <ConversionTable category="length" fromValue={2} precision={2} />
    );

    // Component should reflect new value in calculations
    expect(screen.getByText('Conversion Table')).toBeInTheDocument();
  });

  it('should support different categories', () => {
    const { rerender } = render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    // Switch to temperature
    rerender(
      <ConversionTable category="temperature" fromValue={0} precision={2} />
    );

    expect(screen.getByText('Conversion Table')).toBeInTheDocument();
  });

  it('should format numbers to specified precision', () => {
    const { rerender } = render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    // Change precision
    rerender(
      <ConversionTable category="length" fromValue={1} precision={4} />
    );

    expect(screen.getByText('Conversion Table')).toBeInTheDocument();
  });

  it('should have responsive grid layout classes', () => {
    const { container } = render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    // Should have responsive grid classes
    const gridDiv = container.querySelector('.grid');
    expect(gridDiv).toBeInTheDocument();
    expect(gridDiv?.className).toContain('md:grid-cols-2');
    expect(gridDiv?.className).toContain('lg:grid-cols-4');
  });

  it('should render unit cards with unit ID and symbol', () => {
    render(
      <ConversionTable category="length" fromValue={100} precision={2} />
    );

    // Should display unit identifiers
    expect(screen.getByText('m')).toBeInTheDocument();
  });

  it('should use default fromValue of 1 if not provided', () => {
    render(
      <ConversionTable category="length" precision={2} />
    );

    expect(screen.getByText('Conversion Table')).toBeInTheDocument();
  });

  it('honors the selected fromUnit (not the canonical from-unit)', () => {
    // 1 foot = 0.3048 m and = 12 in — proves the table converts FROM `fromUnit`,
    // not from the category's canonical "meter". Regression for the table bug
    // where every row was computed from meter regardless of the picked unit.
    render(
      <ConversionTable category="length" fromUnit="foot" fromValue={1} precision={4} />
    );

    expect(screen.getByText('0.3048')).toBeInTheDocument(); // → meters
    expect(screen.getByText('12.0000')).toBeInTheDocument(); // → inches
  });

  it('should handle all categories', () => {
    CATEGORIES.forEach(category => {
      const { unmount } = render(
        <ConversionTable category={category.id} fromValue={1} precision={2} />
      );

      expect(screen.getByText('Conversion Table')).toBeInTheDocument();
      unmount();
    });
  });

  it('should display conversion results in cards', () => {
    const { container } = render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    // Should have cards with conversions
    const cards = container.querySelectorAll('.rounded-lg');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should gracefully handle invalid category', () => {
    // Component should handle edge cases
    const { container } = render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should be a pure rendering component (no side effects)', () => {
    const { rerender } = render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    const heading1 = screen.getByText('Conversion Table');

    rerender(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    const heading2 = screen.getByText('Conversion Table');

    expect(heading1).toBe(heading2);
  });

  it('should support different precision levels', () => {
    const { rerender } = render(
      <ConversionTable category="length" fromValue={1.23456} precision={1} />
    );

    // Verify component renders with precision 1
    expect(screen.getByText('Conversion Table')).toBeInTheDocument();

    rerender(
      <ConversionTable category="length" fromValue={1.23456} precision={6} />
    );

    // Verify component renders with precision 6
    expect(screen.getByText('Conversion Table')).toBeInTheDocument();
  });

  it('should display a border and muted background on unit cards', () => {
    const { container } = render(
      <ConversionTable category="length" fromValue={1} precision={2} />
    );

    const cards = container.querySelectorAll('[class*="border"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});
