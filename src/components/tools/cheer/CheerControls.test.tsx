import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { CheerControls } from './CheerControls';
import { DEFAULT_SETTINGS } from '@/lib/cheer';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';

function renderWithIntl(component: React.ReactNode, locale: 'ko' | 'en' = 'ko') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages as never}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('CheerControls', () => {
  const mockOnSettingsChange = vi.fn();
  const mockOnEnterFullscreen = vi.fn().mockResolvedValue(undefined);
  const mockOnExitFullscreen = vi.fn().mockResolvedValue(undefined);
  const mockOnToggleWakeLock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockOnSettingsChange.mockClear();
    mockOnEnterFullscreen.mockClear();
    mockOnExitFullscreen.mockClear();
    mockOnToggleWakeLock.mockClear();
  });

  it('renders effect selector (ko)', () => {
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    expect(screen.getByText(/효과/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /정적/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /스크롤/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /점멸/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /네온/ })).toBeInTheDocument();
  });

  it('calls onSettingsChange when effect is clicked', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    const flashButton = screen.getByRole('button', { name: /점멸/ });
    await user.click(flashButton);

    expect(mockOnSettingsChange).toHaveBeenCalledWith({ effect: 'flash' });
  });

  it('shows speed selector when effect is scroll', () => {
    renderWithIntl(
      <CheerControls
        settings={{ ...DEFAULT_SETTINGS, effect: 'scroll' }}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    expect(screen.getByText(/속도/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /느림/ })).toBeInTheDocument();
  });

  it('hides speed selector when effect is static', () => {
    renderWithIntl(
      <CheerControls
        settings={{ ...DEFAULT_SETTINGS, effect: 'static' }}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    // Speed label should not be visible for static effect
    const speedButtons = screen.queryAllByRole('button', { name: /느림|보통|빠름/ });
    // Filter out those that are part of effect selector
    const speedOnlyButtons = speedButtons.filter(
      (btn) => btn.textContent === '느림' || btn.textContent === '보통' || btn.textContent === '빠름'
    );
    expect(speedOnlyButtons.length).toBeLessThan(3);
  });

  it('renders color swatches', () => {
    const { container } = renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    expect(screen.getByText(/글자색/)).toBeInTheDocument();
    expect(screen.getByText(/배경색/)).toBeInTheDocument();

    // Should have color buttons
    const colorButtons = container.querySelectorAll('button[style*="background-color"]');
    expect(colorButtons.length).toBeGreaterThan(0);
  });

  it('shows low contrast warning', () => {
    renderWithIntl(
      <CheerControls
        settings={{
          ...DEFAULT_SETTINGS,
          textColor: 'white',
          bgColor: 'white',
        }}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    expect(screen.getByText(/대비가 낮아요/)).toBeInTheDocument();
  });

  it('renders size selector', () => {
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    expect(screen.getByText(/크기/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'S' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'L' })).toBeInTheDocument();
  });

  it('renders landscape toggle', () => {
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    const landscapeButton = screen.getByRole('button', { name: /가로 회전/ });
    expect(landscapeButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates landscape on click', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    const landscapeButton = screen.getByRole('button', { name: /가로 회전/ });
    await user.click(landscapeButton);

    expect(mockOnSettingsChange).toHaveBeenCalledWith({ landscape: true });
  });

  it('hides fullscreen button when unsupported', () => {
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={false}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    expect(
      screen.queryByRole('button', { name: /전체화면/ })
    ).not.toBeInTheDocument();
  });

  it('shows fullscreen button when supported', () => {
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    expect(
      screen.getByRole('button', { name: /전체화면/ })
    ).toBeInTheDocument();
  });

  it('hides keep-awake button when unsupported', () => {
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={false}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    expect(
      screen.queryByRole('button', { name: /화면 켜짐 유지/ })
    ).not.toBeInTheDocument();
  });

  it('shows keep-awake button when supported', () => {
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    const awakeButton = screen.getByRole('button', { name: /화면 켜짐 유지/ });
    expect(awakeButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows keep-awake as active when locked', () => {
    renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={true}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    const awakeButton = screen.getByRole('button', { name: /화면 켜짐 유지/ });
    expect(awakeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('has accessible focus-visible styles', () => {
    const { container } = renderWithIntl(
      <CheerControls
        settings={DEFAULT_SETTINGS}
        onSettingsChange={mockOnSettingsChange}
        isFullscreenSupported={true}
        isWakeLockSupported={true}
        isWakeLocked={false}
        onEnterFullscreen={mockOnEnterFullscreen}
        onExitFullscreen={mockOnExitFullscreen}
        onToggleWakeLock={mockOnToggleWakeLock}
      />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.className).toMatch(/focus-visible:ring-focus-ring/);
    });
  });
});
