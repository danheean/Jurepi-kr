import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CountsToDim } from './CountsToDim'
import { AllTheProviders } from '@/__test__/test-utils'

const mockResult = {
  width: 45.45,
  length: 30,
}

describe('CountsToDim', () => {
  it('renders stitch count and row count input fields', () => {
    const mockChange = vi.fn()
    render(
      <CountsToDim
        stitchCount={100}
        rowCount={90}
        onStitchCountChange={mockChange}
        onRowCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByLabelText(/Stitch Count/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Row Count/)).toBeInTheDocument()
  })

  it('displays input values', () => {
    const mockChange = vi.fn()
    render(
      <CountsToDim
        stitchCount={100}
        rowCount={90}
        onStitchCountChange={mockChange}
        onRowCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const stitchInput = screen.getByLabelText(/Stitch Count/) as HTMLInputElement
    const rowInput = screen.getByLabelText(/Row Count/) as HTMLInputElement

    expect(stitchInput.value).toBe('100')
    expect(rowInput.value).toBe('90')
  })

  it('calls onStitchCountChange with valid number', () => {
    const mockStitchChange = vi.fn()
    const mockRowChange = vi.fn()

    render(
      <CountsToDim
        stitchCount={100}
        rowCount={90}
        onStitchCountChange={mockStitchChange}
        onRowCountChange={mockRowChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const stitchInput = screen.getByLabelText(/Stitch Count/) as HTMLInputElement
    fireEvent.change(stitchInput, { target: { value: '110' } })

    expect(mockStitchChange).toHaveBeenCalledWith(110)
  })

  it('renders width and length results', () => {
    const mockChange = vi.fn()
    render(
      <CountsToDim
        stitchCount={100}
        rowCount={90}
        onStitchCountChange={mockChange}
        onRowCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText("Width")).toBeInTheDocument()
    expect(screen.getByText("Length")).toBeInTheDocument()
  })

  it('displays calculated width and length', () => {
    const mockChange = vi.fn()
    render(
      <CountsToDim
        stitchCount={100}
        rowCount={90}
        onStitchCountChange={mockChange}
        onRowCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/45.45/)).toBeInTheDocument()
    expect(screen.getByText(/30/)).toBeInTheDocument()
  })

  it('does not call change handlers for invalid input', () => {
    const mockStitchChange = vi.fn()
    const mockRowChange = vi.fn()

    render(
      <CountsToDim
        stitchCount={100}
        rowCount={90}
        onStitchCountChange={mockStitchChange}
        onRowCountChange={mockRowChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const stitchInput = screen.getByLabelText(/Stitch Count/) as HTMLInputElement
    fireEvent.change(stitchInput, { target: { value: '0' } })

    expect(mockStitchChange).not.toHaveBeenCalled()
  })

  it('works with english locale (en)', () => {
    const mockChange = vi.fn()
    render(
      <CountsToDim
        stitchCount={100}
        rowCount={90}
        onStitchCountChange={mockChange}
        onRowCountChange={mockChange}
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByLabelText(/Stitch Count/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Row Count/)).toBeInTheDocument()
  })
})
