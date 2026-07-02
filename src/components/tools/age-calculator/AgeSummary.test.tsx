import { describe, it, expect } from "vitest";
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AgeSummary } from './AgeSummary';
import type { AgeResult } from '@/lib/age-calculator/age';
import messages from '@/i18n/messages/ko.json';

describe('AgeSummary', () => {
  const mockAge: AgeResult = {
    manNai: 25,
    yeonNai: 26,
    seeneunNai: 27,
    dayOfWeek: 3,
    daysLived: 9131,
    breakdown: { years: 25, months: 2, days: 15 },
    nextBirthdayCountdown: 50,
    zodiacKey: 'tiger',
    starSignKey: 'aries',
  };

  const renderComponent = (age: AgeResult = mockAge) => {
    return render(
      <NextIntlClientProvider locale="ko" messages={messages as any}>
        <AgeSummary age={age} />
      </NextIntlClientProvider>
    );
  };

  it('renders title', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].ageSummary.title)).toBeInTheDocument();
  });

  it('renders all three age cards with correct values', () => {
    renderComponent();

    // Check manNai
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(
      screen.getByText(messages.tools['age-calculator'].ageSummary.manNai.label)
    ).toBeInTheDocument();

    // Check yeonNai
    expect(screen.getByText('26')).toBeInTheDocument();
    expect(
      screen.getByText(messages.tools['age-calculator'].ageSummary.yeonNai.label)
    ).toBeInTheDocument();

    // Check seeneunNai
    expect(screen.getByText('27')).toBeInTheDocument();
    expect(
      screen.getByText(messages.tools['age-calculator'].ageSummary.seeneunNai.label)
    ).toBeInTheDocument();
  });

  it('renders units for each age type', () => {
    renderComponent();
    const units = screen.getAllByText(messages.tools['age-calculator'].ageSummary.manNai.unit);
    expect(units.length).toBeGreaterThan(0);
  });

  it('renders explanations for each age type', () => {
    renderComponent();
    expect(
      screen.getByText(messages.tools['age-calculator'].ageSummary.manNai.explanation)
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.tools['age-calculator'].ageSummary.yeonNai.explanation)
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.tools['age-calculator'].ageSummary.seeneunNai.explanation)
    ).toBeInTheDocument();
  });

  it('renders the 2023 unification note on seeneunNai card', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].ageSummary.note)).toBeInTheDocument();
  });

  it('renders with different age values', () => {
    const customAge: AgeResult = {
      ...mockAge,
      manNai: 30,
      yeonNai: 31,
      seeneunNai: 32,
    };
    renderComponent(customAge);

    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
  });
});
