import { render, screen } from '@testing-library/react';
import { Stepper } from './Stepper';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('Stepper Component', () => {
  it('renders initial value', () => {
    render(<Stepper value={5} onValueChange={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('has label when provided', () => {
    render(<Stepper value={5} onValueChange={() => {}} label="Count" />);
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('disables minus button at min', () => {
    render(<Stepper value={1} onValueChange={() => {}} min={1} max={10} />);
    const minusBtn = screen.getByLabelText('Decrease');
    expect(minusBtn).toBeDisabled();
  });

  it('disables plus button at max', () => {
    render(<Stepper value={10} onValueChange={() => {}} min={1} max={10} />);
    const plusBtn = screen.getByLabelText('Increase');
    expect(plusBtn).toBeDisabled();
  });

  it('calls onValueChange on plus click', async () => {
    const onChange = vi.fn();
    render(<Stepper value={5} onValueChange={onChange} min={1} max={10} />);
    const plusBtn = screen.getByLabelText('Increase');
    await userEvent.click(plusBtn);
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('calls onValueChange on minus click', async () => {
    const onChange = vi.fn();
    render(<Stepper value={5} onValueChange={onChange} min={1} max={10} />);
    const minusBtn = screen.getByLabelText('Decrease');
    await userEvent.click(minusBtn);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('respects custom min/max bounds', () => {
    const onChange = vi.fn();
    render(<Stepper value={2} onValueChange={onChange} min={2} max={10} />);
    const minusBtn = screen.getByLabelText('Decrease');
    expect(minusBtn).toBeDisabled();
  });
});
