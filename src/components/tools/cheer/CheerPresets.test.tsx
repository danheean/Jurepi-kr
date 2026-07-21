import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { CheerPresets } from './CheerPresets';
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

describe('CheerPresets', () => {
  const mockOnApply = vi.fn();

  beforeEach(() => {
    mockOnApply.mockClear();
  });

  it('renders situation tabs (ko)', () => {
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    expect(screen.getByText(/콘서트/)).toBeInTheDocument();
    expect(screen.getByText(/스포츠/)).toBeInTheDocument();
    expect(screen.getByText(/생일/)).toBeInTheDocument();
    expect(screen.getByText(/이벤트/)).toBeInTheDocument();
  });

  it('renders situation tabs (en)', () => {
    renderWithIntl(<CheerPresets onApply={mockOnApply} />, 'en');

    expect(screen.getByText(/Concert/)).toBeInTheDocument();
    expect(screen.getByText(/Sports/)).toBeInTheDocument();
    expect(screen.getByText(/Birthday/)).toBeInTheDocument();
    expect(screen.getByText(/Event/)).toBeInTheDocument();
  });

  it('defaults to concert tab', () => {
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);
    const concertTab = screen.getByRole('tab', { name: /콘서트/ });
    expect(concertTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    const sportsTab = screen.getByRole('tab', { name: /스포츠/ });
    await user.click(sportsTab);

    expect(sportsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('displays preset chips for active tab', () => {
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    // Concert presets should be visible by default
    const concertChips = screen.getByRole('button', { name: /응원/ });
    expect(concertChips).toBeInTheDocument();
  });

  it('calls onApply when preset chip is clicked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    // Click a concert preset — onApply receives the resolved localized phrase
    const encoreChip = screen.getByRole('button', { name: '앵콜!' });
    await user.click(encoreChip);

    expect(mockOnApply).toHaveBeenCalledWith('앵콜!');
  });

  it('navigates tabs with arrow keys', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    const concertTab = screen.getByRole('tab', { name: /콘서트/ });
    concertTab.focus();

    // Press right arrow to go to sports
    await user.keyboard('{ArrowRight}');

    const sportsTab = screen.getByRole('tab', { name: /스포츠/ });
    expect(sportsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps around when navigating past last tab', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    // Start at event tab
    const eventTab = screen.getByRole('tab', { name: /이벤트/ });
    await user.click(eventTab);
    eventTab.focus();

    // Press right arrow to wrap to concert
    await user.keyboard('{ArrowRight}');

    const concertTab = screen.getByRole('tab', { name: /콘서트/ });
    expect(concertTab).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates backward with left arrow', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    const sportsTab = screen.getByRole('tab', { name: /스포츠/ });
    await user.click(sportsTab);
    sportsTab.focus();

    // Press left arrow to go to concert
    await user.keyboard('{ArrowLeft}');

    const concertTab = screen.getByRole('tab', { name: /콘서트/ });
    expect(concertTab).toHaveAttribute('aria-selected', 'true');
  });

  it('uses a valid tablist/tab/tabpanel structure (aria-selected only on real tabs)', () => {
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    // A labeled tablist with four tabs
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);

    // The active tab controls a tabpanel that is labelled back by the tab
    const concertTab = screen.getByRole('tab', { name: /콘서트/ });
    const panel = screen.getByRole('tabpanel');
    expect(concertTab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', concertTab.id);
  });

  it('active tab uses the readable ink token, not low-contrast text-brand', () => {
    // `text-brand` (honey #f5a623) is ~2:1 on white — fails WCAG AA for label text.
    // The active tab must use `text-brand-ink` (#9a6400, 5:1 on white).
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);
    const activeTab = screen.getByRole('tab', { name: /콘서트/ });
    expect(activeTab.className).toMatch(/text-brand-ink/);
    expect(activeTab.className).not.toMatch(/text-brand(?!-ink)/);
  });

  it('has accessible focus-visible style on tabs', () => {
    const { container } = renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    const tabs = container.querySelectorAll('button');
    tabs.forEach((tab) => {
      expect(tab.className).toMatch(/focus-visible:ring-focus-ring/);
    });
  });
});
