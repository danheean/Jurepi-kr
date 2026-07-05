import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SavedProjects } from './SavedProjects'
import type { Gauge } from '@/lib/knitting-gauge/schema'
import { AllTheProviders } from '@/__test__/test-utils'

const mockGauge: Gauge = {
  stitches: 22,
  rows: 30,
  swatchW: 10,
  swatchH: 10,
  unit: 'cm',
}

const mockProjects = [
  { name: '스웨터 앞판', gauge: mockGauge },
  { name: '양말', gauge: { ...mockGauge, stitches: 20 } },
]

describe('SavedProjects', () => {
  it('renders title and empty state', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={[]}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Saved Gauges/)).toBeInTheDocument()
    expect(screen.getByText(/No saved gauges/)).toBeInTheDocument()
  })

  it('renders input field and save button', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={[]}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByPlaceholderText(/Enter gauge name/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument()
  })

  it('calls onSave when save button is clicked with input', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={[]}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    const input = screen.getByPlaceholderText(/Enter gauge name/) as HTMLInputElement
    const saveBtn = screen.getByRole('button', { name: /Save/ })

    fireEvent.change(input, { target: { value: '새로운 게이지' } })
    fireEvent.click(saveBtn)

    expect(mockSave).toHaveBeenCalledWith('새로운 게이지')
  })

  it('clears input after save', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={[]}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    const input = screen.getByPlaceholderText(/Enter gauge name/) as HTMLInputElement
    const saveBtn = screen.getByRole('button', { name: /Save/ })

    fireEvent.change(input, { target: { value: '새로운 게이지' } })
    fireEvent.click(saveBtn)

    expect(input.value).toBe('')
  })

  it('renders saved projects list', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={mockProjects}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText('스웨터 앞판')).toBeInTheDocument()
    expect(screen.getByText('양말')).toBeInTheDocument()
  })

  it('renders apply and delete buttons for each project', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={mockProjects}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    const applyBtns = screen.getAllByRole('button', { name: /Apply/ })
    const deleteBtns = screen.getAllByRole('button', { name: /Delete/ })

    expect(applyBtns).toHaveLength(2)
    expect(deleteBtns).toHaveLength(2)
  })

  it('calls onApply when apply button is clicked', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={mockProjects}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    const applyBtns = screen.getAllByRole('button', { name: /Apply/ })
    fireEvent.click(applyBtns[0])

    expect(mockApply).toHaveBeenCalledWith('스웨터 앞판')
  })

  it('calls onRemove when delete button is clicked', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={mockProjects}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    const deleteBtns = screen.getAllByRole('button', { name: /Delete/ })
    fireEvent.click(deleteBtns[0])

    expect(mockRemove).toHaveBeenCalledWith('스웨터 앞판')
  })

  it('disables save button when full (50 projects)', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    const fullProjects = Array.from({ length: 50 }, (_, i) => ({
      name: `프로젝트 ${i + 1}`,
      gauge: mockGauge,
    }))

    render(
      <SavedProjects
        projects={fullProjects}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    const saveBtn = screen.getByRole('button', { name: /Save/ }) as HTMLButtonElement
    expect(saveBtn.disabled).toBe(true)
  })

  it('works with english locale (en)', () => {
    const mockSave = vi.fn()
    const mockApply = vi.fn()
    const mockRemove = vi.fn()

    render(
      <SavedProjects
        projects={[]}
        onSave={mockSave}
        onApply={mockApply}
        onRemove={mockRemove}
      />,
      { wrapper: AllTheProviders }
    )

    expect(screen.getByText(/Saved Gauges/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter gauge name/)).toBeInTheDocument()
  })
})
