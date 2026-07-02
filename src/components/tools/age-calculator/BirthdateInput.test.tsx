import { describe, it, expect, vi } from 'vitest';
import { render as customRender, screen, fireEvent } from '@/__test__/test-utils';
import { BirthdateInput } from './BirthdateInput';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/i18n/messages/ko.json';

const allMessages = {
  ...messages,
};

function renderWithI18n(component: React.ReactElement) {
  return customRender(
    <NextIntlClientProvider locale="ko" messages={allMessages as any}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('BirthdateInput', () => {
  const mockOnChange = vi.fn();
  const mockOnAsOfDateChange = vi.fn();
  const mockOnUseAsOfChange = vi.fn();
  const mockOnClearError = vi.fn();

  it('renders birthdate input field', () => {
    renderWithI18n(
      <BirthdateInput
        value={null}
        asOfDate=""
        useAsOf={false}
        error={null}
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByLabelText('생년월일')).toBeInTheDocument();
  });

  it('calls onChange when birthdate input changes', () => {
    renderWithI18n(
      <BirthdateInput
        value={null}
        asOfDate=""
        useAsOf={false}
        error={null}
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    const input = screen.getByLabelText('생년월일') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2000-03-15' } });

    expect(mockOnChange).toHaveBeenCalledWith('2000-03-15');
  });

  it('displays error message', () => {
    renderWithI18n(
      <BirthdateInput
        value="2025-01-01"
        asOfDate=""
        useAsOf={false}
        error="future"
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('미래 날짜는 입력할 수 없습니다')).toBeInTheDocument();
  });

  it('displays help text when no error', () => {
    renderWithI18n(
      <BirthdateInput
        value={null}
        asOfDate=""
        useAsOf={false}
        error={null}
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('예: 2000-03-15')).toBeInTheDocument();
  });

  it('toggles as-of date section', () => {
    const { rerender } = renderWithI18n(
      <BirthdateInput
        value={null}
        asOfDate=""
        useAsOf={false}
        error={null}
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    const toggleButton = screen.getByLabelText('기준일 설정');
    fireEvent.click(toggleButton);

    expect(mockOnUseAsOfChange).toHaveBeenCalledWith(true);

    rerender(
      <NextIntlClientProvider locale="ko" messages={allMessages as any}>
        <BirthdateInput
          value={null}
          asOfDate="2025-01-01"
          useAsOf={true}
          error={null}
          onChange={mockOnChange}
          onAsOfDateChange={mockOnAsOfDateChange}
          onUseAsOfChange={mockOnUseAsOfChange}
          onClearError={mockOnClearError}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByLabelText('기준일')).toBeInTheDocument();
  });

  it('calls onAsOfDateChange when as-of date input changes', () => {
    renderWithI18n(
      <BirthdateInput
        value={null}
        asOfDate="2025-01-01"
        useAsOf={true}
        error={null}
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    const asOfInput = screen.getByLabelText('기준일');
    fireEvent.change(asOfInput, { target: { value: '2025-12-31' } });

    expect(mockOnAsOfDateChange).toHaveBeenCalledWith('2025-12-31');
  });

  it('clears error when input changes', () => {
    renderWithI18n(
      <BirthdateInput
        value="2025-01-01"
        asOfDate=""
        useAsOf={false}
        error="future"
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    const input = screen.getByLabelText('생년월일');
    fireEvent.change(input, { target: { value: '2000-03-15' } });

    expect(mockOnClearError).toHaveBeenCalled();
  });

  it('calls onChange(null) when input is cleared', () => {
    renderWithI18n(
      <BirthdateInput
        value="2000-03-15"
        asOfDate=""
        useAsOf={false}
        error={null}
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    const input = screen.getByLabelText('생년월일');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('displays "too-old" error message', () => {
    renderWithI18n(
      <BirthdateInput
        value="1800-01-01"
        asOfDate=""
        useAsOf={false}
        error="too-old"
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('150년 이상 전 날짜는 입력할 수 없습니다')).toBeInTheDocument();
  });

  it('displays "invalid" error message', () => {
    renderWithI18n(
      <BirthdateInput
        value="2000-13-01"
        asOfDate=""
        useAsOf={false}
        error="invalid"
        onChange={mockOnChange}
        onAsOfDateChange={mockOnAsOfDateChange}
        onUseAsOfChange={mockOnUseAsOfChange}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('유효한 날짜를 입력해주세요 (YYYY-MM-DD)')).toBeInTheDocument();
  });
});
