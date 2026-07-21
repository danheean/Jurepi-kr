import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AllTheProviders } from '@/__test__/test-utils';
import { LottoGenerator } from './LottoGenerator';

function renderWithIntl(component: React.ReactElement) {
  return render(component, {
    wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
  });
}

describe('LottoGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders after mount with disclaimer visible', async () => {
    renderWithIntl(<LottoGenerator />);

    // Wait for mount - check for the heading element containing "Important Notice"
    await waitFor(() => {
      expect(screen.getByText(/Important Notice/i)).toBeInTheDocument();
    });
  });

  it('renders settings panel', async () => {
    renderWithIntl(<LottoGenerator />);

    await waitFor(() => {
      expect(screen.getByText('Number of Games')).toBeInTheDocument();
      expect(screen.getByText('Always Include (up to 5)')).toBeInTheDocument();
      expect(screen.getByText('Never Include (up to 39)')).toBeInTheDocument();
    });
  });

  it('renders generate button and history panel', async () => {
    renderWithIntl(<LottoGenerator />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /GENERATE/i })).toBeInTheDocument();
      expect(screen.getByText(/History/i)).toBeInTheDocument();
    });
  });

  it('generates games on button click', () => {
    // Mount effect runs synchronously inside render()'s act(); no waitFor
    // (which deadlocks under fake timers). Pending animation timers are
    // discarded by afterEach's useRealTimers().
    vi.useFakeTimers();

    renderWithIntl(<LottoGenerator />);

    const generateButton = screen.getByRole('button', { name: /GENERATE/i });
    fireEvent.click(generateButton);

    // Results title appears immediately (rolling phase sets games synchronously)
    expect(screen.getByText('Generated Numbers')).toBeInTheDocument();
  });

  it('keeps generate enabled for valid inputs (feasibility always satisfiable within caps)', () => {
    // With EXCLUDED_MAX=39 and FIXED_MAX=5, (45 - excluded) >= (6 - fixed)
    // always holds — the UI can never reach an infeasible config, so generate
    // stays enabled. Adding valid fixed numbers must not disable it.
    renderWithIntl(<LottoGenerator />);

    const generateButton = screen.getByRole('button', { name: /GENERATE/i });
    expect(generateButton).toBeEnabled();

    // Add the maximum 5 fixed numbers via the fixed input
    const fixedInput = screen.getAllByPlaceholderText('e.g. 7, 13, 21')[0];
    for (let i = 1; i <= 5; i++) {
      fireEvent.change(fixedInput, { target: { value: i.toString() } });
      const addButtons = screen.getAllByRole('button', { name: /Add Number/i });
      fireEvent.click(addButtons[0]);
    }

    // Still feasible → generate stays enabled
    expect(generateButton).toBeEnabled();
  });

  it('does not misuse aria-live on the Generate button itself', async () => {
    // Regression: aria-live sat on the button, which announces nothing —
    // a button's own label text isn't dynamic content a screen reader needs
    // to be told about.
    renderWithIntl(<LottoGenerator />);

    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /GENERATE/i });
      expect(generateButton).not.toHaveAttribute('aria-live');
    });
  });

  it('announces the final result via a dedicated status region once generation completes', () => {
    vi.useFakeTimers();

    renderWithIntl(<LottoGenerator />);

    const generateButton = screen.getByRole('button', { name: /GENERATE/i });
    fireEvent.click(generateButton);

    const status = screen.getByRole('status');
    // Mid-animation (rolling/locking), nothing should be announced yet —
    // otherwise a screen reader would read out the flickering placeholder
    // numbers instead of the settled result.
    expect(status).toHaveTextContent('');

    // Bounded advance, not runAllTimers(): BallDisplay's rolling-flicker
    // setInterval never "runs out" on its own, so runAllTimers() would spin
    // until it hits its infinite-loop safety abort. Default animation timing
    // is ~1000ms rolling + ~1500ms locking (6 balls); 3000ms comfortably
    // covers the full sequence.
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(status.textContent).toMatch(/Game 1:/);

    vi.useRealTimers();
  });

  it('respects Enter key to generate', () => {
    vi.useFakeTimers();

    renderWithIntl(<LottoGenerator />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByText('Generated Numbers')).toBeInTheDocument();
  });
});
