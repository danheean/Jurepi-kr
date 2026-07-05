import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ConversionPanel } from './ConversionPanel';
import type { UseUnitConverterReturn } from './useUnitConverter';

function makeState(overrides: Partial<UseUnitConverterReturn> = {}): UseUnitConverterReturn {
  return {
    category: 'length',
    fromUnit: 'meter',
    toUnit: 'kilometer',
    fromValue: '',
    toValue: null,
    formattedToValue: '',
    precision: 2,
    recents: [],
    error: '',
    setCategory: vi.fn(),
    setFromUnit: vi.fn(),
    setToUnit: vi.fn(),
    setFromValue: vi.fn(),
    setPrecision: vi.fn(),
    swap: vi.fn(),
    clearRecents: vi.fn(),
    restoreRecent: vi.fn(),
    ...overrides,
  };
}

describe('ConversionPanel — result live region (WCAG SC 4.1.3)', () => {
  it('renders a persistent polite status region even before any input', () => {
    render(<ConversionPanel state={makeState()} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    // Empty until there is a result — but present so future updates announce.
    expect(status.textContent).toBe('');
  });

  it('announces the converted value + symbol when a result exists', () => {
    render(
      <ConversionPanel
        state={makeState({ fromValue: '100', toValue: 0.1, formattedToValue: '0.10' })}
      />
    );
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('0.10');
    expect(status.textContent).toContain('km');
  });
});
