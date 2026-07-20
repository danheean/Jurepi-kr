import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { CheerInput } from './CheerInput';
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

describe('CheerInput', () => {
  const mockOnChange = vi.fn();
  const mockOnSelectRecent = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSelectRecent.mockClear();
  });

  it('renders input with label (ko)', () => {
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />
    );
    expect(screen.getByLabelText(/응원 문구/)).toBeInTheDocument();
  });

  it('renders input with label (en)', () => {
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />,
      'en'
    );
    expect(screen.getByLabelText(/Cheer message/)).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '응원!');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('displays clear button when text is not empty', () => {
    renderWithIntl(
      <CheerInput
        text="응원"
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    const clearButton = screen.getByRole('button', { name: /지우기/ });
    expect(clearButton).toBeInTheDocument();
  });

  it('hides clear button when text is empty', () => {
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    const clearButton = screen.queryByRole('button', { name: /지우기/ });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('calls onChange with empty string when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CheerInput
        text="응원"
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    const clearButton = screen.getByRole('button', { name: /지우기/ });
    await user.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('displays recent messages as chips', () => {
    const recents = ['응원 1', '응원 2'];
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={recents}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    expect(screen.getByText('응원 1')).toBeInTheDocument();
    expect(screen.getByText('응원 2')).toBeInTheDocument();
  });

  it('calls onSelectRecent when a recent chip is clicked', async () => {
    const user = userEvent.setup();
    const recents = ['응원'];
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={recents}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    const chip = screen.getByRole('button', { name: '응원' });
    await user.click(chip);

    expect(mockOnSelectRecent).toHaveBeenCalledWith('응원');
  });

  it('shows no recents message when list is empty', () => {
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    expect(screen.getByText(/없어요/)).toBeInTheDocument();
  });

  it('hides no recents message when recents are available', () => {
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={['응원']}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    expect(screen.queryByText(/없어요/)).not.toBeInTheDocument();
  });

  it('has accessible focus-visible style', () => {
    const { container } = renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    const input = container.querySelector('input');
    expect(input).toHaveClass('focus-visible:ring-focus-ring');
  });

  it('has max length attribute', () => {
    renderWithIntl(
      <CheerInput
        text=""
        onChange={mockOnChange}
        recents={[]}
        onSelectRecent={mockOnSelectRecent}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '80');
  });
});
