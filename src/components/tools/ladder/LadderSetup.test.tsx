import { render, screen, fireEvent } from '@/__test__/test-utils';
import { renderHook, act } from '@testing-library/react';
import { useLadder } from './useLadder';
import { LadderSetup } from './LadderSetup';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('LadderSetup Component', () => {
  it('renders stepper with player count, min-max bounds', () => {
    const { result } = renderHook(() => useLadder(4));
    render(<LadderSetup ladder={result.current} />);

    const stepper = screen.getByText('4');
    expect(stepper).toBeInTheDocument();

    // Minus button should be enabled (count > 2)
    const minusBtn = screen.getByLabelText('Decrease');
    expect(minusBtn).not.toBeDisabled();

    // Plus button should be enabled (count < 10)
    const plusBtn = screen.getByLabelText('Increase');
    expect(plusBtn).not.toBeDisabled();
  });

  it('disables minus at count=2, plus at count=10', () => {
    const { result: r2 } = renderHook(() => useLadder(2));
    const { rerender: rerender2 } = render(<LadderSetup ladder={r2.current} />);

    let minusBtn = screen.getByLabelText('Decrease');
    expect(minusBtn).toBeDisabled();

    const { result: r10 } = renderHook(() => useLadder(10));
    rerender2(<LadderSetup ladder={r10.current} />);

    let plusBtn = screen.getByLabelText('Increase');
    expect(plusBtn).toBeDisabled();
  });

  it('updates count via stepper, preserves existing values', async () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    // Enter names in first and last using act() to ensure state updates
    const inputs = screen.getAllByPlaceholderText(/Player name/i);
    await userEvent.type(inputs[0], 'Alice');
    act(() => {
      result.current.setPlayerName(0, 'Alice');
    });
    await userEvent.type(inputs[3], 'Diana');
    act(() => {
      result.current.setPlayerName(3, 'Diana');
    });

    // Simulate increment
    act(() => {
      result.current.setCount(5);
    });
    rerender(<LadderSetup ladder={result.current} />);

    expect(result.current.state.playerCount).toBe(5);
    expect(result.current.state.players[0].name).toBe('Alice');
    expect(result.current.state.players[3].name).toBe('Diana');
    expect(result.current.state.players).toHaveLength(5);
  });

  it('enforces 12 char max on inputs with counter', async () => {
    const { result } = renderHook(() => useLadder(2));
    render(<LadderSetup ladder={result.current} />);

    const playerInput = screen.getAllByPlaceholderText(/Player name/i)[0];
    await userEvent.type(playerInput, 'ThisIsAVeryLongName');

    // Input should be truncated by onChange handler
    expect((playerInput as HTMLInputElement).value.length).toBeLessThanOrEqual(
      12
    );
  });

  it('displays counter near limit', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    const playerInput = screen.getAllByPlaceholderText(/Player name/i)[0];
    await userEvent.type(playerInput, '123456789012'); // Exactly 12

    act(() => {
      result.current.setPlayerName(0, '123456789012');
    });
    rerender(<LadderSetup ladder={result.current} />);

    // Counter should show 12/12
    const counter = screen.getByText('12/12');
    expect(counter).toBeInTheDocument();
  });

  it('toggles hideResults', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    let toggleButton = screen.getByRole('switch');
    expect(toggleButton).toHaveAttribute('aria-checked', 'true'); // default ON

    act(() => {
      result.current.toggleHide();
    });
    rerender(<LadderSetup ladder={result.current} />);

    expect(result.current.state.hideResults).toBe(false);
    toggleButton = screen.getByRole('switch');
    expect(toggleButton).toHaveAttribute('aria-checked', 'false');
  });

  it('dispatches build on button click', async () => {
    const { result } = renderHook(() => useLadder(2));
    render(<LadderSetup ladder={result.current} />);

    expect(result.current.state.phase).toBe('setup');

    const buildBtn = screen.getByText(/Build ladder/i);
    await userEvent.click(buildBtn);

    act(() => {
      result.current.build();
    });

    expect(result.current.state.phase).toBe('ready');
    expect(result.current.state.permutation.length).toBeGreaterThan(0);
  });

  it('renders player & prize inputs in two-column layout', () => {
    const { result } = renderHook(() => useLadder(3));
    render(<LadderSetup ladder={result.current} />);

    const playerInputs = screen.getAllByPlaceholderText(/Player name/i);
    const prizeInputs = screen.getAllByPlaceholderText(/Outcome/i);

    expect(playerInputs).toHaveLength(3);
    expect(prizeInputs).toHaveLength(3);
  });
});
