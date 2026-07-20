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
    const concertTab = screen.getByRole('button', { name: /콘서트/ });
    expect(concertTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    const sportsTab = screen.getByRole('button', { name: /스포츠/ });
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

    const concertTab = screen.getByRole('button', { name: /콘서트/ });
    concertTab.focus();

    // Press right arrow to go to sports
    await user.keyboard('{ArrowRight}');

    const sportsTab = screen.getByRole('button', { name: /스포츠/ });
    expect(sportsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps around when navigating past last tab', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    // Start at event tab
    const eventTab = screen.getByRole('button', { name: /이벤트/ });
    await user.click(eventTab);
    eventTab.focus();

    // Press right arrow to wrap to concert
    await user.keyboard('{ArrowRight}');

    const concertTab = screen.getByRole('button', { name: /콘서트/ });
    expect(concertTab).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates backward with left arrow', async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    const sportsTab = screen.getByRole('button', { name: /스포츠/ });
    await user.click(sportsTab);
    sportsTab.focus();

    // Press left arrow to go to concert
    await user.keyboard('{ArrowLeft}');

    const concertTab = screen.getByRole('button', { name: /콘서트/ });
    expect(concertTab).toHaveAttribute('aria-selected', 'true');
  });

  it('has accessible focus-visible style on tabs', () => {
    const { container } = renderWithIntl(<CheerPresets onApply={mockOnApply} />);

    const tabs = container.querySelectorAll('button');
    tabs.forEach((tab) => {
      expect(tab.className).toMatch(/focus-visible:ring-focus-ring/);
    });
  });
});
