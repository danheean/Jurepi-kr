import { render, userEvent, screen } from '@/__test__/test-utils';
import { SwapButton } from './SwapButton';

/**
 * SwapButton component tests
 * Tests button click handler, accessibility (aria-label, title),
 * visual feedback, and keyboard support.
 */

describe('SwapButton', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('should render a button with swap icon', () => {
    render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should have aria-label "Swap units"', () => {
    render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = screen.getByLabelText('Swap units');
    expect(button).toBeInTheDocument();
  });

  it('should have title attribute "Swap units"', () => {
    render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Swap units');
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible with Enter key', async () => {
    const user = userEvent.setup();
    render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible with Space key', async () => {
    const user = userEvent.setup();
    render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard(' ');

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should have minimum touch target size (44px)', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('min-h-[44px]');
    expect(button?.className).toContain('min-w-[44px]');
  });

  it('should have focus-visible ring for accessibility', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('focus-visible');
  });

  it('should have hover styling', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('hover:');
  });

  it('should display animation classes', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('transition');
  });

  it('should have border styling', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('border');
  });

  it('should support different unit combinations', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SwapButton fromUnit="kilogram" toUnit="pound" onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);

    rerender(
      <SwapButton fromUnit="celsius" toUnit="fahrenheit" onClick={mockOnClick} />
    );

    const newButton = screen.getByRole('button');
    await user.click(newButton);

    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  it('should have icon inside the button', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should be part of a flex layout for centering', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('flex');
    expect(button?.className).toContain('items-center');
    expect(button?.className).toContain('justify-center');
  });

  it('should handle rapid clicks', async () => {
    const user = userEvent.setup();
    render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = screen.getByRole('button');

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(3);
  });

  it('should maintain accessibility during animation', async () => {
    const user = userEvent.setup();
    render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = screen.getByLabelText('Swap units');

    // Should still be accessible during animation
    await user.click(button);

    expect(button).toHaveAttribute('aria-label', 'Swap units');
  });

  it('should have appropriate styling and visual feedback', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = container.querySelector('button');
    // Button should have background styling
    expect(button?.className).toContain('bg-');
  });

  it('should be a functional component with no side effects', () => {
    const { rerender } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button1 = screen.getByRole('button');

    rerender(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button2 = screen.getByRole('button');

    expect(button1).toBe(button2);
  });

  it('should have a clean visual hierarchy', () => {
    const { container } = render(
      <SwapButton fromUnit="meter" toUnit="kilometer" onClick={mockOnClick} />
    );

    const button = container.querySelector('button');
    // Should have background and border
    expect(button?.className).toContain('bg-');
    expect(button?.className).toContain('border');
  });
});
