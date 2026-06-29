import { render, screen } from '@testing-library/react';
import { Toggle } from './Toggle';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('Toggle Component', () => {
  it('renders with aria-switch role', () => {
    render(<Toggle checked={false} onChange={() => {}} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('reflects checked state in aria-checked', () => {
    const { rerender } = render(<Toggle checked={true} onChange={() => {}} />);
    let toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    rerender(<Toggle checked={false} onChange={() => {}} />);
    toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when clicked', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch');
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('displays label when provided', () => {
    render(
      <Toggle checked={false} onChange={() => {}} label="Enable feature" />
    );
    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  it('disables toggle when disabled=true', () => {
    render(<Toggle checked={false} onChange={() => {}} disabled />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
  });

  it('does not call onChange when disabled', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} disabled />);
    const toggle = screen.getByRole('switch');
    await userEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
