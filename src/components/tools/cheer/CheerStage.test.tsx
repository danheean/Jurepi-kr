import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { CheerStage } from './CheerStage';
import { DEFAULT_SETTINGS, CheerSettings } from '@/lib/cheer';
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

const baseSettings: CheerSettings = { ...DEFAULT_SETTINGS, text: '우리 팀 우승!' };

describe('CheerStage', () => {
  it('renders a full-viewport overlay that fills the screen (dvw/dvh)', () => {
    renderWithIntl(
      <CheerStage
        settings={baseSettings}
        onClose={vi.fn()}
        enterFullscreen={vi.fn().mockResolvedValue(undefined)}
        isFullscreenSupported={false}
      />
    );

    const overlay = screen.getByTestId('cheer-stage');
    expect(overlay).toHaveClass('fixed');
    expect(overlay.className).toMatch(/w-\[100dvw\]/);
    expect(overlay.className).toMatch(/h-\[100dvh\]/);
    // The banner text is shown inside the overlay.
    expect(screen.getByText('우리 팀 우승!')).toBeInTheDocument();
  });

  it('requests native fullscreen on mount when supported', () => {
    const enterFullscreen = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <CheerStage
        settings={baseSettings}
        onClose={vi.fn()}
        enterFullscreen={enterFullscreen}
        isFullscreenSupported={true}
      />
    );

    expect(enterFullscreen).toHaveBeenCalledTimes(1);
    // Called with the overlay element.
    expect(enterFullscreen.mock.calls[0][0]).toBe(screen.getByTestId('cheer-stage'));
  });

  it('does NOT request fullscreen when unsupported (iOS) but still renders overlay', () => {
    const enterFullscreen = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <CheerStage
        settings={baseSettings}
        onClose={vi.fn()}
        enterFullscreen={enterFullscreen}
        isFullscreenSupported={false}
      />
    );

    expect(enterFullscreen).not.toHaveBeenCalled();
    expect(screen.getByTestId('cheer-stage')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithIntl(
      <CheerStage
        settings={baseSettings}
        onClose={onClose}
        enterFullscreen={vi.fn().mockResolvedValue(undefined)}
        isFullscreenSupported={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /전체화면 닫기/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithIntl(
      <CheerStage
        settings={baseSettings}
        onClose={onClose}
        enterFullscreen={vi.fn().mockResolvedValue(undefined)}
        isFullscreenSupported={false}
      />
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
