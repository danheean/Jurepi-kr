'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Gauge, STORE_VERSION, Store } from '@/lib/knitting-gauge/schema'
import {
  castOnStitches,
  rowsNeeded,
  finishedWidth,
  finishedLength,
  rescalePatternCount,
  CountResult,
} from '@/lib/knitting-gauge/gauge'
import {
  loadStoreFromStorage,
  saveStoreToStorage,
  saveProject,
  removeProject,
  pushRecent,
} from '@/lib/knitting-gauge/store'
import {
  toBaseCm,
  fromBaseCm,
  convertSwatchSizeOnUnitToggle,
} from '@/lib/knitting-gauge/units'

const STORAGE_KEY = 'jurepi-knitting-gauge'
const SAVE_DEBOUNCE_MS = 300

const DEFAULT_GAUGE: Gauge = {
  stitches: 22,
  rows: 30,
  swatchW: 10,
  swatchH: 10,
  unit: 'cm',
}

/** Round for display after unit conversion (2 decimals) */
const round2 = (n: number): number => Math.round(n * 100) / 100

/** Exact cm↔inch conversion of a user-entered length (2.54, then display rounding) */
const convertLength = (value: number, from: 'cm' | 'inch', to: 'cm' | 'inch'): number =>
  round2(fromBaseCm(toBaseCm(value, from), to))

/**
 * Mode results for the three calculation modes
 */
export interface DimToCountsResult {
  stitches: CountResult
  rows: CountResult
}

export interface CountsToDimResult {
  width: number
  length: number
}

export interface PatternRescaleResult {
  stitches: CountResult
  rows: CountResult
}

/**
 * Hook for knitting gauge calculator
 * Manages gauge input, mode selection, unit toggle, and localStorage persistence.
 *
 * Gauge mutations go through a synchronous ref (single source of truth at
 * callback time) so batched calls (e.g., double unit toggle in one event
 * batch) never read stale state.
 */
export function useKnittingGauge() {
  // Core state — gauge owns the current unit (gauge.unit); no duplicated unit state
  const [gauge, setGaugeState] = useState<Gauge>(DEFAULT_GAUGE)
  const gaugeRef = useRef(gauge)

  const [mode, setMode] = useState<'dimToCounts' | 'countsToDim' | 'patternRescale'>(
    'dimToCounts'
  )

  // UI state for each mode
  const [targetWidth, setTargetWidth] = useState(50)
  const [targetLength, setTargetLength] = useState(30)
  const [stitchCount, setStitchCount] = useState(110)
  const [rowCount, setRowCount] = useState(90)
  const [patternGaugeStitches, setPatternGaugeStitches] = useState(20)
  const [patternGaugeRows, setPatternGaugeRows] = useState(30)
  const [patternSwatchWidth, setPatternSwatchWidth] = useState(10)
  const [patternSwatchHeight, setPatternSwatchHeight] = useState(10)
  const [patternCount, setPatternCount] = useState(100)

  // Persistence state
  const [projects, setProjects] = useState<Array<{ name: string; gauge: Gauge }>>([])
  const [recents, setRecents] = useState<Gauge[]>([])

  // Synchronous refs so immediate saves compose the full store (a project
  // save must never wipe recents on disk, and vice versa)
  const projectsRef = useRef(projects)
  const recentsRef = useRef(recents)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    recentsRef.current = recents
  }, [recents])

  /** Single place that mutates gauge: keeps ref and state in sync */
  const setGauge = useCallback((newGauge: Gauge) => {
    gaugeRef.current = newGauge
    setGaugeState(newGauge)
  }, [])

  const composeStore = useCallback(
    (): Store => ({
      version: STORE_VERSION,
      projects: projectsRef.current,
      recents: recentsRef.current,
      current: gaugeRef.current,
      meta: { createdAt: Date.now() },
    }),
    []
  )

  // Initialize from localStorage on mount (SSR-safe: initial state is constant)
  useEffect(() => {
    const store = loadStoreFromStorage(STORAGE_KEY)
    projectsRef.current = store.projects
    recentsRef.current = store.recents
    setProjects(store.projects)
    setRecents(store.recents)
    if (store.current) {
      gaugeRef.current = store.current
      setGaugeState(store.current)
    }
  }, [])

  // Debounced save of continuous state (gauge edits); projects/recents ops
  // also save immediately in their handlers below
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      saveStoreToStorage(STORAGE_KEY, composeStore())
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [gauge, projects, recents, composeStore])

  // Calculate results for each mode (pure domain functions; null-safety inside)
  const dimToCountsResult: DimToCountsResult = {
    stitches: castOnStitches(targetWidth, gauge),
    rows: rowsNeeded(targetLength, gauge),
  }

  const countsToDimResult: CountsToDimResult = {
    width: finishedWidth(stitchCount, gauge),
    length: finishedLength(rowCount, gauge),
  }

  const patternRescaleResult: PatternRescaleResult = {
    stitches: rescalePatternCount(
      patternCount,
      patternGaugeStitches / patternSwatchWidth,
      gauge.stitches / gauge.swatchW
    ),
    rows: rescalePatternCount(
      patternCount,
      patternGaugeRows / patternSwatchHeight,
      gauge.rows / gauge.swatchH
    ),
  }

  // Unit toggle: reads the synchronous ref (never a stale closure), converts
  // swatch sizes (default 10↔4 snap, custom values exact ×÷2.54) and target
  // dimensions (always exact ×÷2.54 — the 2.54 contract).
  const handleUnitToggle = useCallback(() => {
    const prev = gaugeRef.current
    const from = prev.unit
    const to = from === 'cm' ? 'inch' : 'cm'

    setGauge({
      ...prev,
      unit: to,
      swatchW: convertSwatchSizeOnUnitToggle(prev.swatchW, from, to),
      swatchH: convertSwatchSizeOnUnitToggle(prev.swatchH, from, to),
    })

    // Pure functional updaters (StrictMode-safe): exact conversion
    setTargetWidth((w) => convertLength(w, from, to))
    setTargetLength((l) => convertLength(l, from, to))
  }, [setGauge])

  // Project management: discrete user state → immediate persist (no debounce),
  // composing the FULL store from refs so nothing else gets wiped
  const handleSaveProject = useCallback(
    (name: string) => {
      const newStore = saveProject(composeStore(), name, gaugeRef.current)
      projectsRef.current = newStore.projects
      setProjects(newStore.projects)
      saveStoreToStorage(STORAGE_KEY, newStore)
    },
    [composeStore]
  )

  const handleApplyProject = useCallback(
    (name: string) => {
      const project = projectsRef.current.find((p) => p.name === name)
      if (project) {
        setGauge(project.gauge)
      }
    },
    [setGauge]
  )

  const handleRemoveProject = useCallback(
    (name: string) => {
      const newStore = removeProject(composeStore(), name)
      projectsRef.current = newStore.projects
      setProjects(newStore.projects)
      saveStoreToStorage(STORAGE_KEY, newStore)
    },
    [composeStore]
  )

  const handleAddRecent = useCallback(() => {
    const newStore = pushRecent(composeStore(), gaugeRef.current)
    recentsRef.current = newStore.recents
    setRecents(newStore.recents)
    saveStoreToStorage(STORAGE_KEY, newStore)
  }, [composeStore])

  return {
    // Gauge input
    gauge,
    setGauge,
    unit: gauge.unit,
    handleUnitToggle,

    // Mode selection
    mode,
    setMode,

    // Mode-specific inputs
    targetWidth,
    setTargetWidth,
    targetLength,
    setTargetLength,
    stitchCount,
    setStitchCount,
    rowCount,
    setRowCount,
    patternGaugeStitches,
    setPatternGaugeStitches,
    patternGaugeRows,
    setPatternGaugeRows,
    patternSwatchWidth,
    setPatternSwatchWidth,
    patternSwatchHeight,
    setPatternSwatchHeight,
    patternCount,
    setPatternCount,

    // Results
    dimToCountsResult,
    countsToDimResult,
    patternRescaleResult,

    // Projects and recents
    projects,
    recents,
    handleSaveProject,
    handleApplyProject,
    handleRemoveProject,
    handleAddRecent,
  }
}

export type UseKnittingGaugeReturn = ReturnType<typeof useKnittingGauge>
