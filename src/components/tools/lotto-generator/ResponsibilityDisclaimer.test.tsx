import { render, screen } from '@testing-library/react';
import { AllTheProviders } from '@/__test__/test-utils';
import { ResponsibilityDisclaimer } from './ResponsibilityDisclaimer';

function renderWithIntl(component: React.ReactElement) {
  return render(component, {
    wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
  });
}

describe('ResponsibilityDisclaimer', () => {
  it('displays heading and text', () => {
    renderWithIntl(<ResponsibilityDisclaimer />);

    expect(screen.getByText(/Important Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/These numbers are randomly generated/i)).toBeInTheDocument();
  });

  it('has warning styling via a full tinted border, not a side-stripe accent', () => {
    const { container } = renderWithIntl(<ResponsibilityDisclaimer />);

    const disclaimerDiv = container.firstChild;
    expect(disclaimerDiv).toHaveClass('bg-warning/10', 'border', 'border-warning/30');
    // Regression: a colored border-left/border-right as an "accent" is a
    // banned pattern (impeccable design system) — the tint + icon carry
    // the "important" signal instead.
    expect(disclaimerDiv).not.toHaveClass('border-l-4');
    expect(disclaimerDiv).not.toHaveClass('border-warning');
  });

  it('uses the AA-contrast-safe ink token for warning text, not the raw fill color', () => {
    const { container } = renderWithIntl(<ResponsibilityDisclaimer />);

    // text-warning (#f59e0b) is ~2.15:1 on white — fails WCAG AA (4.5:1).
    // text-warning-ink is the darkened variant meant for text on light surfaces.
    expect(container.querySelector('.text-warning')).toBeNull();
    expect(container.querySelectorAll('.text-warning-ink').length).toBeGreaterThan(0);
  });

  it('is always visible (not optional)', () => {
    renderWithIntl(<ResponsibilityDisclaimer />);

    const disclaimer = screen.getByText(/Important Notice/i).closest('div');
    expect(disclaimer).toBeVisible();
  });
});
