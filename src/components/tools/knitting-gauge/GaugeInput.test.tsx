import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GaugeInput } from './GaugeInput'
import type { Gauge } from '@/lib/knitting-gauge/schema'
import { AllTheProviders } from '@/__test__/test-utils'

const mockGauge: Gauge = {
  stitches: 22,
  rows: 30,
  swatchW: 10,
  swatchH: 10,
  unit: 'cm',
}

const mockGaugeInch: Gauge = {
  stitches: 22,
  rows: 30,
  swatchW: 4,
  swatchH: 4,
  unit: 'inch',
}

describe('GaugeInput', () => {
  it('renders all input fields with labels', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByLabelText(/Stitches/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Rows/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Swatch Width/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Swatch Height/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Needle Size/)).toBeInTheDocument()
  })

  it('populates fields with current gauge values', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByLabelText(/Stitches/)).toHaveValue('22')
    expect(screen.getByLabelText(/Rows/)).toHaveValue('30')
    const swatchInputs = screen.getAllByDisplayValue('10')
    expect(swatchInputs).toHaveLength(2) // swatchW and swatchH
  })

  it('calls onGaugeChange when stitches input changes to valid value', async () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const stitchesInput = screen.getByLabelText(/Stitches/)
    fireEvent.change(stitchesInput, { target: { value: '24' } })

    await waitFor(() => {
      expect(handleGaugeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          stitches: 24,
        })
      )
    })
  })

  it('shows error for invalid stitches input', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const stitchesInput = screen.getByLabelText(/Stitches/)
    fireEvent.change(stitchesInput, { target: { value: '-5' } })

    expect(screen.getByText(/Please enter positive numbers/)).toBeInTheDocument()
  })

  it('shows error for zero swatch size', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const swatchWInput = screen.getByLabelText(/Swatch Width/)
    fireEvent.change(swatchWInput, { target: { value: '0' } })

    expect(screen.getByText(/Swatch size must be greater than 0/)).toBeInTheDocument()
  })

  it('accepts decimal values', async () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const stitchesInput = screen.getByLabelText(/Stitches/)
    fireEvent.change(stitchesInput, { target: { value: '21.5' } })

    await waitFor(() => {
      expect(handleGaugeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          stitches: 21.5,
        })
      )
    })
  })

  it('does not call onGaugeChange for invalid input', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const stitchesInput = screen.getByLabelText(/Stitches/)
    fireEvent.change(stitchesInput, { target: { value: 'abc' } })

    expect(handleGaugeChange).not.toHaveBeenCalled()
  })

  it('calls onUnitToggle when unit button is clicked', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    // Clicking the inactive unit switches; clicking the active one is a no-op
    fireEvent.click(screen.getByRole('button', { name: 'inch' }))
    expect(handleUnitToggle).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'cm' }))
    expect(handleUnitToggle).toHaveBeenCalledTimes(1)
  })

  it('shows unit label matching the unit prop (cm)', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByRole('button', { name: 'cm' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'inch' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows unit label matching the unit prop (inch)', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGaugeInch}
        unit="inch"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByRole('button', { name: 'inch' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'cm' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('accepts optional note value', async () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    const gaugeWithNote = { ...mockGauge, note: 'Merino wool' }

    render(
      <GaugeInput
        gauge={gaugeWithNote}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const noteInput = screen.getByDisplayValue('Merino wool')
    fireEvent.change(noteInput, { target: { value: 'Cotton blend' } })

    await waitFor(() => {
      expect(handleGaugeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'Cotton blend',
        })
      )
    })
  })

  it('clears note when input is emptied', async () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    const gaugeWithNote = { ...mockGauge, note: 'Merino wool' }

    render(
      <GaugeInput
        gauge={gaugeWithNote}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const noteInput = screen.getByDisplayValue('Merino wool')
    fireEvent.change(noteInput, { target: { value: '' } })

    await waitFor(() => {
      expect(handleGaugeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          note: undefined,
        })
      )
    })
  })

  it('renders in english (en locale)', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }) }
    )

    expect(screen.getByLabelText(/Stitches/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Rows/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Swatch Width/)).toBeInTheDocument()
  })

  it('maintains draft input even with error', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const stitchesInput = screen.getByLabelText(/Stitches/) as HTMLInputElement
    fireEvent.change(stitchesInput, { target: { value: '-5' } })

    // Input value should still show the draft value
    expect(stitchesInput.value).toBe('-5')
  })

  it('requires positive numbers for all fields', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const rows = screen.getByLabelText(/Rows/)
    fireEvent.change(rows, { target: { value: '0' } })

    expect(screen.getByText(/Please enter positive numbers/)).toBeInTheDocument()
  })

  it('has inputmode="decimal" for all numeric inputs', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()

    render(
      <GaugeInput
        gauge={mockGauge}
        unit="cm"
        onGaugeChange={handleGaugeChange}
        onUnitToggle={handleUnitToggle}
      />,
      { wrapper: AllTheProviders }
    )

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      if (input.id.includes('swatch') || input.id.includes('stitches') || input.id.includes('rows')) {
        expect(input).toHaveAttribute('inputmode', 'decimal')
      }
    })
  })
})

describe('GaugeInput — external prop sync (leader gate regression)', () => {
  it('reflects an externally changed gauge (project apply / storage restore) in the inputs', () => {
    const handleGaugeChange = vi.fn()
    const handleUnitToggle = vi.fn()
    const gaugeA: Gauge = { stitches: 22, rows: 30, swatchW: 10, swatchH: 10, unit: 'cm' }
    const gaugeB: Gauge = { stitches: 24, rows: 32, swatchW: 10, swatchH: 10, unit: 'cm' }

    const { rerender } = render(
      <GaugeInput gauge={gaugeA} unit="cm" onGaugeChange={handleGaugeChange} onUnitToggle={handleUnitToggle} />,
      { wrapper: AllTheProviders }
    )
    expect((screen.getByLabelText(/^Stitches/) as HTMLInputElement).value).toBe('22')

    rerender(
      <GaugeInput gauge={gaugeB} unit="cm" onGaugeChange={handleGaugeChange} onUnitToggle={handleUnitToggle} />
    )
    expect((screen.getByLabelText(/^Stitches/) as HTMLInputElement).value).toBe('24')
    expect((screen.getByLabelText(/^Rows/) as HTMLInputElement).value).toBe('32')
  })
})
