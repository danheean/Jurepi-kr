import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { CheerDisplay } from './CheerDisplay';
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

describe('CheerDisplay', () => {
  const baseSettings: CheerSettings = {
    ...DEFAULT_SETTINGS,
    text: '우리 팀 우승!',
  };

  it('renders with default settings (ko)', () => {
    renderWithIntl(<CheerDisplay settings={baseSettings} />);
    const banner = screen.getByRole('img');
    expect(banner).toBeInTheDocument();
    expect(screen.getByText('우리 팀 우승!')).toBeInTheDocument();
  });

  it('renders with default settings (en)', () => {
    renderWithIntl(
      <CheerDisplay settings={{ ...baseSettings, text: 'Go team!' }} />,
      'en'
    );
    expect(screen.getByText('Go team!')).toBeInTheDocument();
  });

  it('shows placeholder when text is empty (ko)', () => {
    const settings = { ...baseSettings, text: '' };
    renderWithIntl(<CheerDisplay settings={settings} />);
    expect(screen.getByText(/여기에 응원 문구가/)).toBeInTheDocument();
  });

  it('shows placeholder when text is empty (en)', () => {
    const settings = { ...baseSettings, text: '' };
    renderWithIntl(<CheerDisplay settings={settings} />, 'en');
    expect(screen.getByText(/Your cheer message will appear/)).toBeInTheDocument();
  });

  it('applies correct text color class', () => {
    const settings = { ...baseSettings, textColor: 'coral' as const };
    const { container } = renderWithIntl(<CheerDisplay settings={settings} />);
    const banner = container.querySelector('[role="img"]');
    expect(banner).toHaveClass('text-accent-coral');
  });

  it('applies correct background color class', () => {
    const settings = { ...baseSettings, bgColor: 'black' as const };
    const { container } = renderWithIntl(<CheerDisplay settings={settings} />);
    const banner = container.querySelector('[role="img"]');
    expect(banner).toHaveClass('bg-black');
  });

  it('never applies a rotation class (orientation is automatic)', () => {
    const { container } = renderWithIntl(<CheerDisplay settings={baseSettings} />);
    const banner = container.querySelector('[role="img"]');
    expect(banner?.className).not.toMatch(/rotate-90/);
  });

  it('inline variant is an aspect-video card', () => {
    const { container } = renderWithIntl(<CheerDisplay settings={baseSettings} />);
    const banner = container.querySelector('[role="img"]');
    expect(banner).toHaveClass('aspect-video');
    expect(banner).toHaveClass('rounded-lg');
  });

  it('stage variant fills its parent (no aspect ratio, no rounding)', () => {
    const { container } = renderWithIntl(
      <CheerDisplay settings={baseSettings} variant="stage" />
    );
    const banner = container.querySelector('[role="img"]');
    expect(banner).toHaveClass('h-full');
    expect(banner).toHaveClass('rounded-none');
    expect(banner?.className).not.toMatch(/aspect-video/);
  });

  it('renders static effect without animation', () => {
    const settings = { ...baseSettings, effect: 'static' as const };
    const { container } = renderWithIntl(<CheerDisplay settings={settings} />);
    expect(container.textContent).toContain('우리 팀 우승!');
  });

  it('scroll effect uses the shared class + speed-driven duration (no per-render <style>)', () => {
    const settings = { ...baseSettings, effect: 'scroll' as const, speed: 'slow' as const };
    const { container } = renderWithIntl(<CheerDisplay settings={settings} />);
    // Keyframes are global now — the component must NOT inject a <style> tag.
    expect(container.querySelector('style')).toBeNull();
    const marquee = container.querySelector('.cheer-scroll') as HTMLElement;
    expect(marquee).not.toBeNull();
    expect(marquee.style.animationDuration).toBe('12000ms');
  });

  it('neon glow is derived from the selected text token (not a drifting map)', () => {
    // grape → --accent-grape #e0912b → rgb(224,145,43). The glow must match.
    const settings = { ...baseSettings, effect: 'neon' as const, textColor: 'grape' as const };
    const { container } = renderWithIntl(<CheerDisplay settings={settings} />);
    const glow = container.querySelector('[style*="text-shadow"]') as HTMLElement;
    expect(glow).not.toBeNull();
    expect(glow.style.textShadow).toContain('rgba(224, 145, 43');
  });

  it('has accessible aria-label', () => {
    const settings = { ...baseSettings, text: '응원' };
    renderWithIntl(<CheerDisplay settings={settings} />);
    const banner = screen.getByRole('img');
    expect(banner).toHaveAttribute('aria-label', expect.stringContaining('응원'));
  });

  it('has correct role attribute', () => {
    renderWithIntl(<CheerDisplay settings={baseSettings} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
