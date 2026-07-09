import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('Button Component', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText('Primary');
    expect(btn).toHaveClass('bg-brand');
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByText('Secondary');
    expect(btn).toHaveClass('bg-surface-muted');
  });

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByText('Ghost');
    expect(btn).toHaveClass('bg-surface');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByText('Disabled') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByText('...') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('calls onClick handler', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    const btn = screen.getByText('Click');
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it('has focus-visible ring', () => {
    render(<Button>Focus</Button>);
    const btn = screen.getByText('Focus');
    expect(btn).toHaveClass('focus-visible:ring-2');
  });

  it('has a motion-safe active:scale-95 transform (gated for reduced motion)', () => {
    render(<Button>Scale</Button>);
    const btn = screen.getByText('Scale');
    expect(btn).toHaveClass('motion-safe:active:scale-95');
  });
});
