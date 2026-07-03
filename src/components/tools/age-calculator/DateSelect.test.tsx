import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { DateSelect } from './DateSelect';
import messages from '@/i18n/messages/ko.json';

function renderDS(props: Partial<React.ComponentProps<typeof DateSelect>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <NextIntlClientProvider locale="ko" messages={messages as any}>
      <DateSelect
        value={null}
        onChange={onChange}
        idPrefix="test"
        minYear={1990}
        maxYear={2000}
        {...props}
      />
    </NextIntlClientProvider>
  );
  return { onChange, ...utils };
}

describe('DateSelect', () => {
  it('renders year, month and day selects with placeholder options', () => {
    const { container } = renderDS();
    expect(container.querySelector('#test-year')).toBeInTheDocument();
    expect(container.querySelector('#test-month')).toBeInTheDocument();
    expect(container.querySelector('#test-day')).toBeInTheDocument();
    // placeholder options
    expect(screen.getAllByText('연도').length).toBeGreaterThan(0);
  });

  it('lists the year range in descending order within [minYear, maxYear]', () => {
    const { container } = renderDS({ minYear: 1990, maxYear: 2000 });
    const yearOpts = Array.from(container.querySelectorAll('#test-year option'))
      .map((o) => (o as HTMLOptionElement).value)
      .filter(Boolean);
    expect(yearOpts[0]).toBe('2000'); // most recent first
    expect(yearOpts[yearOpts.length - 1]).toBe('1990');
    expect(yearOpts).toHaveLength(11);
  });

  it('emits a zero-padded DateKey once all three parts are chosen', () => {
    // value already has year+month; choosing the day completes it
    const { container, onChange } = renderDS({ value: '2000-03-01' });
    fireEvent.change(container.querySelector('#test-day')!, { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledWith('2000-03-07');
  });

  it('emits null while the selection is incomplete', () => {
    const { container, onChange } = renderDS();
    fireEvent.change(container.querySelector('#test-year')!, { target: { value: '1995' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('clamps the day when the new month has fewer days (Jan 31 → Feb 28)', () => {
    const { container, onChange } = renderDS({ value: '2001-01-31' });
    fireEvent.change(container.querySelector('#test-month')!, { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith('2001-02-28');
  });

  it('offers 29 days for February of a leap year', () => {
    const { container } = renderDS({ value: '2000-02-01' });
    const dayOpts = Array.from(container.querySelectorAll('#test-day option'))
      .map((o) => (o as HTMLOptionElement).value)
      .filter(Boolean);
    expect(dayOpts).toHaveLength(29);
  });
});
