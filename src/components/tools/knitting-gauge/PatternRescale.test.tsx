import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PatternRescale } from './PatternRescale'
import type { CountResult } from '@/lib/knitting-gauge/gauge'
import { AllTheProviders } from '@/__test__/test-utils'

const mockResult: { stitches: CountResult; rows: CountResult } = {
  stitches: {
    value: 110,
    rounded: 110,
    actual: 50,
    delta: 0,
  },
  rows: {
    value: 90,
    rounded: 90,
    actual: 30,
    delta: 0,
  },
}

describe('PatternRescale', () => {
  it('renders pattern gauge section with stitches and rows inputs', () => {
    const mockChange = vi.fn()
    render(
      <PatternRescale
        patternGaugeStitches={20}
        patternGaugeRows={30}
        patternSwatchWidth={10}
        patternSwatchHeight={10}
        patternCount={100}
        onPatternGaugeStitchesChange={mockChange}
        onPatternGaugeRowsChange={mockChange}
        onPatternSwatchWidthChange={mockChange}
        onPatternSwatchHeightChange={mockChange}
        onPatternCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByLabelText(/^Stitches$/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Rows$/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Swatch Width/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Swatch Height/)).toBeInTheDocument()
  })

  it('renders pattern count input field', () => {
    const mockChange = vi.fn()
    render(
      <PatternRescale
        patternGaugeStitches={20}
        patternGaugeRows={30}
        patternSwatchWidth={10}
        patternSwatchHeight={10}
        patternCount={100}
        onPatternGaugeStitchesChange={mockChange}
        onPatternGaugeRowsChange={mockChange}
        onPatternSwatchWidthChange={mockChange}
        onPatternSwatchHeightChange={mockChange}
        onPatternCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByLabelText(/Pattern Count/)).toBeInTheDocument()
  })

  it('displays all input values', () => {
    const mockChange = vi.fn()
    render(
      <PatternRescale
        patternGaugeStitches={20}
        patternGaugeRows={30}
        patternSwatchWidth={10}
        patternSwatchHeight={10}
        patternCount={100}
        onPatternGaugeStitchesChange={mockChange}
        onPatternGaugeRowsChange={mockChange}
        onPatternSwatchWidthChange={mockChange}
        onPatternSwatchHeightChange={mockChange}
        onPatternCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const stInput = screen.getAllByDisplayValue('20')[0] as HTMLInputElement
    const rwInput = screen.getAllByDisplayValue('30')[0] as HTMLInputElement
    const swInput = screen.getAllByDisplayValue('10')[0] as HTMLInputElement
    const shInput = screen.getAllByDisplayValue('10')[1] as HTMLInputElement
    const ctInput = screen.getByDisplayValue('100') as HTMLInputElement

    expect(stInput.value).toBe('20')
    expect(rwInput.value).toBe('30')
    expect(swInput.value).toBe('10')
    expect(shInput.value).toBe('10')
    expect(ctInput.value).toBe('100')
  })

  it('calls onPatternGaugeStitchesChange with valid number', () => {
    const mockStChange = vi.fn()
    const mockChange = vi.fn()

    render(
      <PatternRescale
        patternGaugeStitches={20}
        patternGaugeRows={30}
        patternSwatchWidth={10}
        patternSwatchHeight={10}
        patternCount={100}
        onPatternGaugeStitchesChange={mockStChange}
        onPatternGaugeRowsChange={mockChange}
        onPatternSwatchWidthChange={mockChange}
        onPatternSwatchHeightChange={mockChange}
        onPatternCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const stInput = screen.getAllByDisplayValue('20')[0] as HTMLInputElement
    fireEvent.change(stInput, { target: { value: '22' } })

    expect(mockStChange).toHaveBeenCalledWith(22)
  })

  it('renders result cards for stitches and rows', () => {
    const mockChange = vi.fn()
    render(
      <PatternRescale
        patternGaugeStitches={20}
        patternGaugeRows={30}
        patternSwatchWidth={10}
        patternSwatchHeight={10}
        patternCount={100}
        onPatternGaugeStitchesChange={mockChange}
        onPatternGaugeRowsChange={mockChange}
        onPatternSwatchWidthChange={mockChange}
        onPatternSwatchHeightChange={mockChange}
        onPatternCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Cast-On Stitches/)).toBeInTheDocument()
    expect(screen.getAllByText(/Rows/).length).toBeGreaterThan(0)
  })

  it('does not call change handlers for invalid input', () => {
    const mockChange = vi.fn()

    render(
      <PatternRescale
        patternGaugeStitches={20}
        patternGaugeRows={30}
        patternSwatchWidth={10}
        patternSwatchHeight={10}
        patternCount={100}
        onPatternGaugeStitchesChange={mockChange}
        onPatternGaugeRowsChange={vi.fn()}
        onPatternSwatchWidthChange={vi.fn()}
        onPatternSwatchHeightChange={vi.fn()}
        onPatternCountChange={vi.fn()}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const stInput = screen.getAllByDisplayValue('20')[0] as HTMLInputElement
    fireEvent.change(stInput, { target: { value: '-5' } })

    expect(mockChange).not.toHaveBeenCalled()
  })

  it('works with english locale (en)', () => {
    const mockChange = vi.fn()
    render(
      <PatternRescale
        patternGaugeStitches={20}
        patternGaugeRows={30}
        patternSwatchWidth={10}
        patternSwatchHeight={10}
        patternCount={100}
        onPatternGaugeStitchesChange={mockChange}
        onPatternGaugeRowsChange={mockChange}
        onPatternSwatchWidthChange={mockChange}
        onPatternSwatchHeightChange={mockChange}
        onPatternCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Pattern Gauge/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Pattern Count/)).toBeInTheDocument()
  })
})
