import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ResultCard } from './ResultCard'
import type { CountResult } from '@/lib/knitting-gauge/gauge'
import { AllTheProviders } from '@/__test__/test-utils'

const mockResult: CountResult = {
  value: 110.5,
  rounded: 111,
  actual: 50.45,
  delta: 0.45,
}

const mockNullResult = null

describe('ResultCard', () => {
  it('renders label and null result as dash', () => {
    render(
      <ResultCard
        label="Test Label"
        result={mockNullResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders rounded value prominently', () => {
    render(
      <ResultCard
        label="Cast-On Stitches"
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText('111')).toBeInTheDocument()
  })

  it('renders exact value with label', () => {
    render(
      <ResultCard
        label="Test"
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Exact/)).toBeInTheDocument()
    expect(screen.getByText(/110\.5/)).toBeInTheDocument()
  })

  it('renders exact value with label (en)', () => {
    render(
      <ResultCard
        label="Test"
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Exact/)).toBeInTheDocument()
  })

  it('renders actual size with delta', () => {
    render(
      <ResultCard
        label="Test"
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Actual Size/)).toBeInTheDocument()
    expect(screen.getByText(/50\.45cm/)).toBeInTheDocument()
    expect(screen.getByText(/\+0\.45cm/)).toBeInTheDocument()
  })

  it('renders copy button when copySummary is provided', () => {
    render(
      <ResultCard
        label="Test"
        result={mockResult}
        unitLabel="cm"
        copySummary="111 stitches"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText(/Copy/)).toBeInTheDocument()
  })

  it('does not render copy button when copySummary is not provided', () => {
    render(
      <ResultCard
        label="Test"
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('copies summary to clipboard on button click', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    }
    Object.assign(navigator, { clipboard: mockClipboard })

    render(
      <ResultCard
        label="Test"
        result={mockResult}
        unitLabel="cm"
        copySummary="111 stitches"
      />,
      { wrapper: AllTheProviders }
    )

    const copyButton = screen.getByRole('button')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('111 stitches')
    })
  })

  it('shows copied feedback after copy', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    }
    Object.assign(navigator, { clipboard: mockClipboard })

    render(
      <ResultCard
        label="Test"
        result={mockResult}
        unitLabel="cm"
        copySummary="111 stitches"
      />,
      { wrapper: AllTheProviders }
    )

    const copyButton = screen.getByRole('button')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(screen.getByText(/Copied/)).toBeInTheDocument()
    })
  })

  it('formats numbers with locale awareness (ko)', () => {
    const result: CountResult = {
      value: 123.456,
      rounded: 123,
      actual: 123.4,
      delta: 0.4,
    }

    render(
      <ResultCard
        label="Test"
        result={result}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    // Korean locale formatting
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  it('handles negative delta correctly', () => {
    const result: CountResult = {
      value: 109.5,
      rounded: 110,
      actual: 49.55,
      delta: -0.45,
    }

    render(
      <ResultCard
        label="Test"
        result={result}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/-0\.45cm/)).toBeInTheDocument()
  })

  it('uses tabular-nums for result number', () => {
    render(
      <ResultCard
        label="Test"
        result={mockResult}
        unitLabel="cm"
      />,
      { wrapper: AllTheProviders }
    )

    const resultNumber = screen.getByText('111')
    expect(resultNumber).toHaveStyle({ fontVariantNumeric: 'tabular-nums' })
  })
})
