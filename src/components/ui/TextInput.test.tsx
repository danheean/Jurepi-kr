import { render, screen } from '@testing-library/react';
import { TextInput } from './TextInput';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('TextInput Component', () => {
  it('renders input field', () => {
    render(
      <TextInput
        placeholder="Enter text"
        value=""
        onChange={() => {}}
      />
    );
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(
      <TextInput
        label="Name"
        placeholder="Enter name"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('enforces maxChars via maxlength attribute', () => {
    render(
      <TextInput
        maxChars={12}
        placeholder="Limited"
        value=""
        onChange={() => {}}
      />
    );
    const input = screen.getByPlaceholderText('Limited') as HTMLInputElement;
    expect(input.maxLength).toBe(12);
  });

  it('shows character counter when at/near limit', async () => {
    const { rerender } = render(
      <TextInput
        maxChars={12}
        showCounter={true}
        placeholder="Count"
        value="123456789012"
        onChange={() => {}}
      />
    );
    expect(screen.getByText('12/12')).toBeInTheDocument();
  });

  it('highlights counter in red at max', async () => {
    render(
      <TextInput
        maxChars={12}
        showCounter={true}
        placeholder="Count"
        value="123456789012"
        onChange={() => {}}
      />
    );
    const counter = screen.getByText('12/12');
    expect(counter).toHaveClass('text-semantic-danger');
  });

  it('calls onChange handler', async () => {
    const onChange = vi.fn();
    render(
      <TextInput
        placeholder="Type here"
        value=""
        onChange={onChange}
      />
    );
    const input = screen.getByPlaceholderText('Type here');
    await userEvent.type(input, 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('has focus-visible ring', () => {
    render(
      <TextInput
        placeholder="Focus"
        value=""
        onChange={() => {}}
      />
    );
    const input = screen.getByPlaceholderText('Focus');
    expect(input).toHaveClass('focus-visible:ring-2');
  });
});
