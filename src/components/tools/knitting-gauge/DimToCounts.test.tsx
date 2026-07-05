import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DimToCounts } from './DimToCounts'
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

describe('DimToCounts', () => {
  it('renders target width and length input fields', () => {
    const mockChange = vi.fn()
    render(
      <DimToCounts
        targetWidth={50}
        targetLength={30}
        onTargetWidthChange={mockChange}
        onTargetLengthChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByLabelText(/Target Width/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Target Length/)).toBeInTheDocument()
  })

  it('displays input values', () => {
    const mockChange = vi.fn()
    render(
      <DimToCounts
        targetWidth={50}
        targetLength={30}
        onTargetWidthChange={mockChange}
        onTargetLengthChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const widthInput = screen.getByLabelText(/Target Width/) as HTMLInputElement
    const lengthInput = screen.getByLabelText(/Target Length/) as HTMLInputElement

    expect(widthInput.value).toBe('50')
    expect(lengthInput.value).toBe('30')
  })

  it('calls onTargetWidthChange with valid number', () => {
    const mockWidthChange = vi.fn()
    const mockLengthChange = vi.fn()

    render(
      <DimToCounts
        targetWidth={50}
        targetLength={30}
        onTargetWidthChange={mockWidthChange}
        onTargetLengthChange={mockLengthChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const widthInput = screen.getByLabelText(/Target Width/) as HTMLInputElement
    fireEvent.change(widthInput, { target: { value: '55' } })

    expect(mockWidthChange).toHaveBeenCalledWith(55)
  })

  it('renders both result cards for stitches and rows', () => {
    const mockChange = vi.fn()
    render(
      <DimToCounts
        targetWidth={50}
        targetLength={30}
        onTargetWidthChange={mockChange}
        onTargetLengthChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Cast-On Stitches/)).toBeInTheDocument()
    expect(screen.getAllByText(/^Rows$/).length).toBeGreaterThan(0)
  })

  it('renders rounded stitch count prominently', () => {
    const mockChange = vi.fn()
    render(
      <DimToCounts
        targetWidth={50}
        targetLength={30}
        onTargetWidthChange={mockChange}
        onTargetLengthChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText('110')).toBeInTheDocument()
  })

  it('does not call change handlers for invalid input', () => {
    const mockWidthChange = vi.fn()
    const mockLengthChange = vi.fn()

    render(
      <DimToCounts
        targetWidth={50}
        targetLength={30}
        onTargetWidthChange={mockWidthChange}
        onTargetLengthChange={mockLengthChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const widthInput = screen.getByLabelText(/Target Width/) as HTMLInputElement
    fireEvent.change(widthInput, { target: { value: '-10' } })

    expect(mockWidthChange).not.toHaveBeenCalled()
  })

  it('works with english locale (en)', () => {
    const mockChange = vi.fn()
    render(
      <DimToCounts
        targetWidth={50}
        targetLength={30}
        onTargetWidthChange={mockChange}
        onTargetLengthChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByLabelText(/Target Width/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Target Length/)).toBeInTheDocument()
  })
})
