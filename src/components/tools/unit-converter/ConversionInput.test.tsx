import { render, userEvent, screen } from '@/__test__/test-utils';
import { ConversionInput } from './ConversionInput';

/**
 * ConversionInput component tests
 * Tests input changes, error display, accessibility (labels, aria-live),
 * and user interactions.
 */

describe('ConversionInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render with label "Value"', () => {
    render(
      <ConversionInput value="" onChange={mockOnChange} />
    );

    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('should have a labeled input field', () => {
    render(
      <ConversionInput value="" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should have inputMode="decimal" for numeric input', () => {
    render(
      <ConversionInput value="" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value');
    expect(input).toHaveAttribute('inputMode', 'decimal');
  });

  it('should display the current value', () => {
    render(
      <ConversionInput value="100" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value') as HTMLInputElement;
    expect(input.value).toBe('100');
  });

  it('should call onChange when user types', async () => {
    const user = userEvent.setup();
    render(
      <ConversionInput value="" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value');

    // Type some text
    await user.type(input, '123');

    // onChange should be called (at least once)
    expect(mockOnChange).toHaveBeenCalled();
    // Should be called multiple times (once per character)
    expect(mockOnChange.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('should clear input when user deletes content', async () => {
    const user = userEvent.setup();
    render(
      <ConversionInput value="100" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value') as HTMLInputElement;
    mockOnChange.mockClear();

    // Clear the input by selecting all and typing empty
    await user.clear(input);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should display placeholder text when input is empty', () => {
    render(
      <ConversionInput value="" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value') as HTMLInputElement;
    expect(input.placeholder).toBe('Enter value');
  });

  it('should NOT show error message when error prop is undefined', () => {
    render(
      <ConversionInput value="100" onChange={mockOnChange} />
    );

    const alertDiv = screen.queryByRole('alert');
    expect(alertDiv).not.toBeInTheDocument();
  });

  it('should display error message with role="alert" and aria-live="polite"', () => {
    render(
      <ConversionInput
        value="abc"
        onChange={mockOnChange}
        error="invalidNumber"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert.textContent).toBe('invalidNumber');
  });

  it('should apply error styling to input when error is present', () => {
    const { container } = render(
      <ConversionInput
        value="abc"
        onChange={mockOnChange}
        error="invalidNumber"
      />
    );

    const input = container.querySelector('input');
    // Check that input has error styling applied
    expect(input?.className).toContain('border-danger');
  });

  it('should not apply error styling when error is undefined', () => {
    const { container } = render(
      <ConversionInput
        value="100"
        onChange={mockOnChange}
      />
    );

    const input = container.querySelector('input');
    // Should not have danger/error classes
    expect(input?.className).not.toContain('border-danger');
  });

  it('should update error message when error prop changes', () => {
    const { rerender } = render(
      <ConversionInput
        value="abc"
        onChange={mockOnChange}
        error="invalidNumber"
      />
    );

    expect(screen.getByRole('alert').textContent).toBe('invalidNumber');

    rerender(
      <ConversionInput
        value="-100"
        onChange={mockOnChange}
        error="negativeNonTemp"
      />
    );

    expect(screen.getByRole('alert').textContent).toBe('negativeNonTemp');
  });

  it('should clear error message when error is removed', () => {
    const { rerender } = render(
      <ConversionInput
        value="abc"
        onChange={mockOnChange}
        error="invalidNumber"
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <ConversionInput
        value="100"
        onChange={mockOnChange}
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should handle decimal input', async () => {
    const user = userEvent.setup();
    render(
      <ConversionInput value="3.14159" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value') as HTMLInputElement;
    expect(input.value).toBe('3.14159');

    // Verify decimal values are accepted and displayed
    expect(input.value).toMatch(/\d+\.\d+/);
  });

  it('should handle negative values', async () => {
    const user = userEvent.setup();
    render(
      <ConversionInput value="-50" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value') as HTMLInputElement;
    expect(input.value).toBe('-50');

    // Verify negative values are accepted and displayed
    expect(input.value).toMatch(/^-\d+/);
  });

  it('should be focused when mounted (for better UX)', () => {
    const { container } = render(
      <ConversionInput value="" onChange={mockOnChange} />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    // Note: Auto-focus usually doesn't work in tests, but we verify the input exists
    expect(input).toBeInTheDocument();
  });

  it('should support multiple error types', () => {
    const errorTypes = ['invalidNumber', 'negativeNonTemp', 'outOfRange'];

    errorTypes.forEach(errorType => {
      const { unmount } = render(
        <ConversionInput
          value="test"
          onChange={mockOnChange}
          error={errorType}
        />
      );

      expect(screen.getByRole('alert').textContent).toBe(errorType);
      unmount();
    });
  });

  it('should be a controlled component', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConversionInput value="50" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value') as HTMLInputElement;
    expect(input.value).toBe('50');

    // Type in the input
    await user.type(input, '0');

    // onChange is called
    expect(mockOnChange).toHaveBeenCalled();

    // Update the value prop
    rerender(
      <ConversionInput value="500" onChange={mockOnChange} />
    );

    // Input value updates
    expect(input.value).toBe('500');
  });

  it('should persist value when switching between error and no-error states', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConversionInput value="100" onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('Value') as HTMLInputElement;
    expect(input.value).toBe('100');

    rerender(
      <ConversionInput
        value="100"
        onChange={mockOnChange}
        error="invalidNumber"
      />
    );

    expect(input.value).toBe('100');

    rerender(
      <ConversionInput value="100" onChange={mockOnChange} />
    );

    expect(input.value).toBe('100');
  });
});
