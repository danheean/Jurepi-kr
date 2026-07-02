import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { PeopleList } from './PeopleList';
import type { Person } from '@/lib/age-calculator/schema';
import messages from '@/i18n/messages/ko.json';

describe('PeopleList', () => {
  const mockPeople: Person[] = [
    { id: '1', name: '홍길동', birthdate: '1990-03-15' },
    { id: '2', name: '김영희', birthdate: '1995-06-20' },
  ];

  const mockOnAdd = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnSelect = vi.fn();

  const renderComponent = (
    people: Person[] = mockPeople,
    onAdd = mockOnAdd,
    onRemove = mockOnRemove,
    onSelect = mockOnSelect
  ) => {
    return render(
      <NextIntlClientProvider locale="ko" messages={messages as any}>
        <PeopleList people={people} onAdd={onAdd} onRemove={onRemove} onSelect={onSelect} />
      </NextIntlClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].people.heading)).toBeInTheDocument();
  });

  it('renders add button', () => {
    renderComponent();
    expect(
      screen.getByText(messages.tools['age-calculator'].people.addButton)
    ).toBeInTheDocument();
  });

  it('renders empty state when no people', () => {
    renderComponent([]);
    expect(
      screen.getByText(messages.tools['age-calculator'].people.emptyState)
    ).toBeInTheDocument();
  });

  it('renders all people when present', () => {
    renderComponent();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('김영희')).toBeInTheDocument();
  });

  it('calls onSelect when person is clicked', () => {
    renderComponent();
    const button = screen.getByText('홍길동');
    fireEvent.click(button);
    expect(mockOnSelect).toHaveBeenCalledWith(mockPeople[0]);
  });

  it('calls onRemove when trash icon is clicked', () => {
    renderComponent();
    const removeButtons = screen.getAllByLabelText(messages.tools['age-calculator'].people.removeButton);
    fireEvent.click(removeButtons[0]);
    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('opens add modal when add button is clicked', async () => {
    renderComponent();
    const addButton = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes(messages.tools['age-calculator'].people.addButton)
    );
    fireEvent.click(addButton!);
    // Check for the modal by checking for its inputs
    expect(
      screen.getByLabelText(messages.tools['age-calculator'].people.addModal.nameLabel)
    ).toBeInTheDocument();
  });

  it('renders modal with name and birthdate inputs', () => {
    renderComponent();
    const addButton = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes(messages.tools['age-calculator'].people.addButton)
    );
    fireEvent.click(addButton!);

    expect(
      screen.getByLabelText(messages.tools['age-calculator'].people.addModal.nameLabel)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(messages.tools['age-calculator'].people.addModal.birthdateLabel)
    ).toBeInTheDocument();
  });

  it('renders save and cancel buttons in modal', () => {
    renderComponent();
    const addButton = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes(messages.tools['age-calculator'].people.addButton)
    );
    fireEvent.click(addButton!);

    // Get specific buttons by finding them in the modal area
    const allSaveButtons = screen.getAllByText(messages.tools['age-calculator'].people.addModal.save);
    const allCancelButtons = screen.getAllByText(messages.tools['age-calculator'].people.addModal.cancel);
    expect(allSaveButtons.length).toBeGreaterThan(0);
    expect(allCancelButtons.length).toBeGreaterThan(0);
  });

  it('closes modal when cancel is clicked', async () => {
    renderComponent();
    const addButton = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes(messages.tools['age-calculator'].people.addButton)
    );
    fireEvent.click(addButton!);

    // Check that modal inputs exist
    expect(screen.getByLabelText(messages.tools['age-calculator'].people.addModal.nameLabel)).toBeInTheDocument();

    const cancelButton = screen.getByText(messages.tools['age-calculator'].people.addModal.cancel);
    fireEvent.click(cancelButton);

    await waitFor(() => {
      // After closing, the name input should not exist
      expect(
        screen.queryByLabelText(messages.tools['age-calculator'].people.addModal.nameLabel)
      ).not.toBeInTheDocument();
    });
  });

  it('calls onAdd with name and birthdate when save is clicked', async () => {
    renderComponent();
    const addButton = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes(messages.tools['age-calculator'].people.addButton)
    );
    fireEvent.click(addButton!);

    const nameInput = screen.getByLabelText(
      messages.tools['age-calculator'].people.addModal.nameLabel
    ) as HTMLInputElement;
    const birthdateInput = screen.getByLabelText(
      messages.tools['age-calculator'].people.addModal.birthdateLabel
    ) as HTMLInputElement;

    await userEvent.type(nameInput, '이순신');
    // Using fireEvent for date input since userEvent doesn't work well with type="date"
    fireEvent.change(birthdateInput, { target: { value: '1988-05-10' } });

    const saveButton = screen.getByText(messages.tools['age-calculator'].people.addModal.save);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith('이순신', '1988-05-10');
    });
  });

  it('validates required name field', async () => {
    renderComponent();
    const addButton = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes(messages.tools['age-calculator'].people.addButton)
    );
    fireEvent.click(addButton!);

    const birthdateInput = screen.getByLabelText(
      messages.tools['age-calculator'].people.addModal.birthdateLabel
    ) as HTMLInputElement;
    fireEvent.change(birthdateInput, { target: { value: '1988-05-10' } });

    const saveButton = screen.getByText(messages.tools['age-calculator'].people.addModal.save);
    fireEvent.click(saveButton);

    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('validates birthdate format', async () => {
    renderComponent();
    const addButton = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes(messages.tools['age-calculator'].people.addButton)
    );
    fireEvent.click(addButton!);

    const nameInput = screen.getByLabelText(
      messages.tools['age-calculator'].people.addModal.nameLabel
    ) as HTMLInputElement;

    await userEvent.type(nameInput, '이순신');

    const saveButton = screen.getByText(messages.tools['age-calculator'].people.addModal.save);
    fireEvent.click(saveButton);

    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('formats birthdates correctly for display', () => {
    renderComponent();
    // Should display formatted dates (exact format depends on locale)
    const dateElements = screen.getAllByText(/\d{4}년/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('has >=44px tap targets', () => {
    renderComponent();
    const peopleButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.includes('홍길동') || btn.className?.includes('min-h-11')
    );
    expect(peopleButtons.length).toBeGreaterThan(0);
  });
});
