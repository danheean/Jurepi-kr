import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useKnittingGauge } from './useKnittingGauge'

describe('useKnittingGauge hook', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('initializes with default gauge', () => {
      const { result } = renderHook(() => useKnittingGauge())

      expect(result.current.gauge).toEqual({
        stitches: 22,
        rows: 30,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      })
    })

    it('initializes with cm unit', () => {
      const { result } = renderHook(() => useKnittingGauge())
      expect(result.current.unit).toBe('cm')
    })

    it('initializes with dimToCounts mode', () => {
      const { result } = renderHook(() => useKnittingGauge())
      expect(result.current.mode).toBe('dimToCounts')
    })

    it('initializes with empty projects and recents', () => {
      const { result } = renderHook(() => useKnittingGauge())
      expect(result.current.projects).toEqual([])
      expect(result.current.recents).toEqual([])
    })
  })

  describe('gauge input', () => {
    it('updates gauge stitches', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setGauge({
          stitches: 24,
          rows: 30,
          swatchW: 10,
          swatchH: 10,
          unit: 'cm',
        })
      })

      expect(result.current.gauge.stitches).toBe(24)
    })

    it('updates gauge rows', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setGauge({
          stitches: 22,
          rows: 32,
          swatchW: 10,
          swatchH: 10,
          unit: 'cm',
        })
      })

      expect(result.current.gauge.rows).toBe(32)
    })

    it('updates unit when gauge changes', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setGauge({
          stitches: 22,
          rows: 30,
          swatchW: 4,
          swatchH: 4,
          unit: 'inch',
        })
      })

      expect(result.current.unit).toBe('inch')
    })
  })

  describe('unit toggle', () => {
    it('toggles from cm to inch', () => {
      const { result } = renderHook(() => useKnittingGauge())

      expect(result.current.unit).toBe('cm')

      act(() => {
        result.current.handleUnitToggle()
      })

      expect(result.current.unit).toBe('inch')
    })

    it('toggles from inch to cm', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.handleUnitToggle()
        result.current.handleUnitToggle()
      })

      expect(result.current.unit).toBe('cm')
    })

    it('converts swatch sizes on unit toggle', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.handleUnitToggle()
      })

      // Default swatch should change from 10cm to 4in
      expect(result.current.gauge.swatchW).toBeCloseTo(4, 1)
      expect(result.current.gauge.swatchH).toBeCloseTo(4, 1)
    })
  })

  describe('mode selection', () => {
    it('changes mode to countsToDim', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setMode('countsToDim')
      })

      expect(result.current.mode).toBe('countsToDim')
    })

    it('changes mode to patternRescale', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setMode('patternRescale')
      })

      expect(result.current.mode).toBe('patternRescale')
    })
  })

  describe('dimToCounts mode', () => {
    it('calculates cast-on stitches correctly', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setMode('dimToCounts')
        result.current.setTargetWidth(50)
        result.current.setTargetLength(30)
      })

      // 22 sts/10cm * 50cm = 110 sts
      expect(result.current.dimToCountsResult.stitches.rounded).toBe(110)
    })

    it('calculates rows correctly', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setMode('dimToCounts')
        result.current.setTargetWidth(50)
        result.current.setTargetLength(30)
      })

      // 30 rows/10cm * 30cm = 90 rows
      expect(result.current.dimToCountsResult.rows.rounded).toBe(90)
    })

    it('shows value and delta values', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setMode('dimToCounts')
        result.current.setTargetWidth(50)
        result.current.setTargetLength(30)
      })

      expect(result.current.dimToCountsResult.stitches.value).toBeDefined()
      expect(result.current.dimToCountsResult.stitches.delta).toBeDefined()
      expect(result.current.dimToCountsResult.stitches.actual).toBeDefined()
    })
  })

  describe('countsToDim mode', () => {
    it('calculates finished width', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setMode('countsToDim')
        result.current.setStitchCount(110)
      })

      // 110 sts / (22 sts/10cm) = 50cm
      expect(result.current.countsToDimResult.width).toBeCloseTo(50, 1)
    })

    it('calculates finished length', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setMode('countsToDim')
        result.current.setRowCount(90)
      })

      // 90 rows / (30 rows/10cm) = 30cm
      expect(result.current.countsToDimResult.length).toBeCloseTo(30, 1)
    })
  })

  describe('patternRescale mode', () => {
    it('rescales pattern stitches', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setMode('patternRescale')
        // Pattern 20 sts/10cm = 2.0 sts/cm, count 100
        // Your gauge 22 sts/10cm = 2.2 sts/cm
        result.current.setPatternGaugeStitches(20)
        result.current.setPatternSwatchWidth(10)
        result.current.setPatternCount(100)
      })

      // 100 * (2.2 / 2.0) = 110
      expect(result.current.patternRescaleResult.stitches.rounded).toBe(110)
    })
  })

  describe('projects persistence', () => {
    it('saves project and persists to localStorage', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.handleSaveProject('Sweater')
      })

      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0].name).toBe('Sweater')

      // Verify stored in localStorage (saved immediately for projects)
      const stored = localStorage.getItem('jurepi-knitting-gauge')
      expect(stored).toBeTruthy()
    })

    it('loads projects from localStorage on mount', () => {
      // Pre-populate localStorage
      const store = {
        version: 1,
        projects: [
          {
            name: 'Sweater',
            gauge: { stitches: 22, rows: 30, swatchW: 10, swatchH: 10, unit: 'cm' as const },
          },
        ],
        recents: [],
        meta: { createdAt: Date.now() },
      }
      localStorage.setItem('jurepi-knitting-gauge', JSON.stringify(store))

      const { result } = renderHook(() => useKnittingGauge())

      // Wait for mount effect
      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0].name).toBe('Sweater')
    })

    it('applies project gauge', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.handleSaveProject('Custom')
        // Change gauge
        result.current.setGauge({
          stitches: 24,
          rows: 32,
          swatchW: 10,
          swatchH: 10,
          unit: 'cm',
        })
      })

      // Apply project (reverts to saved gauge)
      act(() => {
        result.current.handleApplyProject('Custom')
      })

      expect(result.current.gauge.stitches).toBe(22)
      expect(result.current.gauge.rows).toBe(30)
    })

    it('removes project', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.handleSaveProject('Sweater')
      })

      expect(result.current.projects).toHaveLength(1)

      act(() => {
        result.current.handleRemoveProject('Sweater')
      })

      expect(result.current.projects).toHaveLength(0)
    })
  })

  describe('recents persistence', () => {
    it('adds gauge to recents', () => {
      const { result } = renderHook(() => useKnittingGauge())

      expect(result.current.recents).toHaveLength(0)

      act(() => {
        result.current.handleAddRecent()
      })

      expect(result.current.recents).toHaveLength(1)
    })

    it('maintains MRU order in recents', () => {
      const { result } = renderHook(() => useKnittingGauge())

      // Add first gauge
      act(() => {
        result.current.handleAddRecent()
      })

      expect(result.current.recents).toHaveLength(1)
      expect(result.current.recents[0].stitches).toBe(22)

      // Change gauge and add again
      act(() => {
        result.current.setGauge({
          stitches: 24,
          rows: 32,
          swatchW: 10,
          swatchH: 10,
          unit: 'cm',
        })
      })

      act(() => {
        result.current.handleAddRecent()
      })

      expect(result.current.recents).toHaveLength(2)
      expect(result.current.recents[0].stitches).toBe(24) // Most recent first
      expect(result.current.recents[1].stitches).toBe(22) // Previous second
    })
  })

  describe('localStorage debouncing', () => {
    it('debounces save for 300ms', async () => {
      const { result } = renderHook(() => useKnittingGauge())

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

      act(() => {
        result.current.setTargetWidth(40)
        result.current.setTargetWidth(45)
        result.current.setTargetWidth(50)
      })

      // Before debounce expires, no save should occur
      expect(setItemSpy).not.toHaveBeenCalled()

      // After debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(setItemSpy).toHaveBeenCalled()

      setItemSpy.mockRestore()
    })

    it('saves immediately for project changes (not debounced)', () => {
      const { result } = renderHook(() => useKnittingGauge())

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

      act(() => {
        result.current.handleSaveProject('Sweater')
      })

      // Project save should happen immediately
      expect(setItemSpy).toHaveBeenCalled()

      setItemSpy.mockRestore()
    })
  })

  describe('edge cases', () => {
    it('handles null localStorage gracefully', () => {
      // Simulate private mode or quota exceeded
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      const { result } = renderHook(() => useKnittingGauge())

      expect(result.current.gauge).toBeDefined()
      expect(result.current.projects).toEqual([])

      Storage.prototype.setItem = originalSetItem
    })

    it('preserves gauge unit across setGauge calls', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setGauge({
          stitches: 24,
          rows: 32,
          swatchW: 4,
          swatchH: 4,
          unit: 'inch',
        })
      })

      expect(result.current.unit).toBe('inch')
    })

    it('calculates correct results even with non-default gauge', () => {
      const { result } = renderHook(() => useKnittingGauge())

      act(() => {
        result.current.setGauge({
          stitches: 21,
          rows: 33,
          swatchW: 10,
          swatchH: 10,
          unit: 'cm',
        })
        result.current.setMode('dimToCounts')
        result.current.setTargetWidth(33)
      })

      // 21 sts/10cm * 33cm = 69.3 → rounds to 69
      expect(result.current.dimToCountsResult.stitches.rounded).toBe(69)
      expect(result.current.dimToCountsResult.stitches.delta).toBeCloseTo(-0.142, 2)
    })
  })
})

describe('useKnittingGauge — leader gate regressions', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('converts target dimensions EXACTLY (÷2.54) on unit toggle, not proportionally', () => {
    const { result } = renderHook(() => useKnittingGauge())

    act(() => {
      result.current.setTargetWidth(50)
      result.current.setTargetLength(30)
    })
    act(() => {
      result.current.handleUnitToggle()
    })

    // 50cm = 19.685in → 19.69 (NOT 20 from the 10→4 proportional shortcut)
    expect(result.current.targetWidth).toBeCloseTo(19.69, 2)
    expect(result.current.targetLength).toBeCloseTo(11.81, 2)
  })

  it('persists the current gauge and restores it on remount (SPEC scenario 4)', () => {
    const { result, unmount } = renderHook(() => useKnittingGauge())

    act(() => {
      result.current.setGauge({
        stitches: 24,
        rows: 32,
        swatchW: 10,
        swatchH: 10,
        unit: 'cm',
      })
    })
    act(() => {
      vi.advanceTimersByTime(400) // flush debounced save
    })
    unmount()

    const { result: result2 } = renderHook(() => useKnittingGauge())
    act(() => {}) // flush mount effect
    expect(result2.current.gauge.stitches).toBe(24)
    expect(result2.current.gauge.rows).toBe(32)
  })

  it('saving a project does not wipe recents on disk (composed immediate save)', () => {
    const { result } = renderHook(() => useKnittingGauge())

    act(() => {
      result.current.handleAddRecent()
    })
    act(() => {
      result.current.handleSaveProject('목도리')
    })

    const raw = localStorage.getItem('jurepi-knitting-gauge')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.projects).toHaveLength(1)
    expect(parsed.recents).toHaveLength(1)
  })
})
