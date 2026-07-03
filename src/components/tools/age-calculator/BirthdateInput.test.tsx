import { describe, it, expect, vi } from 'vitest';
import { render as customRender, screen, fireEvent } from '@/__test__/test-utils';
import { BirthdateInput } from './BirthdateInput';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/i18n/messages/ko.json';

const allMessages = { ...messages };

function renderWithI18n(component: React.ReactElement) {
  return customRender(
    <NextIntlClientProvider locale="ko" messages={allMessages as any}>
      {component}
    </NextIntlClientProvider>
  );
}

function makeProps(overrides: Partial<React.ComponentProps<typeof BirthdateInput>> = {}) {
  return {
    value: null,
    asOfDate: '',
    useAsOf: false,
    error: null,
    onChange: vi.fn(),
    onAsOfDateChange: vi.fn(),
    onUseAsOfChange: vi.fn(),
    onClearError: vi.fn(),
    ...overrides,
  } as React.ComponentProps<typeof BirthdateInput>;
}

describe('BirthdateInput', () => {
  it('renders year / month / day dropdowns under the 생년월일 legend', () => {
    const props = makeProps();
    const { container } = renderWithI18n(<BirthdateInput {...props} />);

    expect(screen.getByText('생년월일')).toBeInTheDocument();
    expect(container.querySelector('#birthdate-year')).toBeInTheDocument();
    expect(container.querySelector('#birthdate-month')).toBeInTheDocument();
    expect(container.querySelector('#birthdate-day')).toBeInTheDocument();
  });

  it('emits a full DateKey once all three parts are chosen', () => {
    const props = makeProps({ value: '2000-03-01' });
    const { container } = renderWithI18n(<BirthdateInput {...props} />);

    fireEvent.change(container.querySelector('#birthdate-day')!, { target: { value: '15' } });

    expect(props.onChange).toHaveBeenCalledWith('2000-03-15');
  });

  it('emits null while the date is still incomplete', () => {
    const props = makeProps();
    const { container } = renderWithI18n(<BirthdateInput {...props} />);

    fireEvent.change(container.querySelector('#birthdate-year')!, { target: { value: '1990' } });

    expect(props.onChange).toHaveBeenCalledWith(null);
  });

  it('clears the error when the birthdate changes', () => {
    const props = makeProps({ value: '2000-03-01', error: 'future' });
    const { container } = renderWithI18n(<BirthdateInput {...props} />);

    fireEvent.change(container.querySelector('#birthdate-day')!, { target: { value: '15' } });

    expect(props.onClearError).toHaveBeenCalled();
  });

  it('displays the future-date error', () => {
    renderWithI18n(<BirthdateInput {...makeProps({ value: '2100-01-01', error: 'future' })} />);
    expect(screen.getByText('미래 날짜는 입력할 수 없습니다')).toBeInTheDocument();
  });

  it('displays the too-old error', () => {
    renderWithI18n(<BirthdateInput {...makeProps({ value: '1800-01-01', error: 'too-old' })} />);
    expect(screen.getByText('150년 이상 전 날짜는 입력할 수 없습니다')).toBeInTheDocument();
  });

  it('toggles the as-of section and shows its dropdowns', () => {
    const props = makeProps();
    const { rerender, container } = renderWithI18n(<BirthdateInput {...props} />);

    fireEvent.click(screen.getByLabelText('기준일 설정'));
    expect(props.onUseAsOfChange).toHaveBeenCalledWith(true);

    rerender(
      <NextIntlClientProvider locale="ko" messages={allMessages as any}>
        <BirthdateInput {...makeProps({ asOfDate: '2025-01-01', useAsOf: true })} />
      </NextIntlClientProvider>
    );

    expect(container.querySelector('#as-of-year')).toBeInTheDocument();
    expect(container.querySelector('#as-of-day')).toBeInTheDocument();
  });

  it('calls onAsOfDateChange when an as-of dropdown changes', () => {
    const props = makeProps({ asOfDate: '2025-01-01', useAsOf: true });
    const { container } = renderWithI18n(<BirthdateInput {...props} />);

    fireEvent.change(container.querySelector('#as-of-day')!, { target: { value: '31' } });

    expect(props.onAsOfDateChange).toHaveBeenCalledWith('2025-01-31');
  });
});
