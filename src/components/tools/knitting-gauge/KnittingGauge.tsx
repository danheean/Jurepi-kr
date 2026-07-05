'use client'

import { useTranslations } from 'next-intl'
import { useKnittingGauge } from './useKnittingGauge'
import { GaugeInput } from './GaugeInput'
import { ModeTabs } from './ModeTabs'
import { DimToCounts } from './DimToCounts'
import { CountsToDim } from './CountsToDim'
import { PatternRescale } from './PatternRescale'
import { SavedProjects } from './SavedProjects'

/**
 * KnittingGauge Orchestrator
 * Manages the complete knitting gauge calculator state and layout.
 * Owns useKnittingGauge() hook and wires all child components.
 */
export function KnittingGauge() {
  const t = useTranslations()
  const hook = useKnittingGauge()

  return (
    <div className="space-y-6">
      {/* Gauge input section */}
      <GaugeInput
        gauge={hook.gauge}
        unit={hook.unit}
        onGaugeChange={hook.setGauge}
        onUnitToggle={hook.handleUnitToggle}
      />

      {/* Mode tabs */}
      <ModeTabs mode={hook.mode} onModeChange={hook.setMode} />

      {/* Mode-specific panels */}
      {hook.mode === 'dimToCounts' && (
        <DimToCounts
          targetWidth={hook.targetWidth}
          targetLength={hook.targetLength}
          onTargetWidthChange={hook.setTargetWidth}
          onTargetLengthChange={hook.setTargetLength}
          result={hook.dimToCountsResult}
          unitLabel={
            hook.unit === 'cm' ? t('tools.knitting-gauge.units.cm') : t('tools.knitting-gauge.units.inch')
          }
        />
      )}

      {hook.mode === 'countsToDim' && (
        <CountsToDim
          stitchCount={hook.stitchCount}
          rowCount={hook.rowCount}
          onStitchCountChange={hook.setStitchCount}
          onRowCountChange={hook.setRowCount}
          result={hook.countsToDimResult}
          unitLabel={
            hook.unit === 'cm' ? t('tools.knitting-gauge.units.cm') : t('tools.knitting-gauge.units.inch')
          }
        />
      )}

      {hook.mode === 'patternRescale' && (
        <PatternRescale
          patternGaugeStitches={hook.patternGaugeStitches}
          patternGaugeRows={hook.patternGaugeRows}
          patternSwatchWidth={hook.patternSwatchWidth}
          patternSwatchHeight={hook.patternSwatchHeight}
          patternCount={hook.patternCount}
          onPatternGaugeStitchesChange={hook.setPatternGaugeStitches}
          onPatternGaugeRowsChange={hook.setPatternGaugeRows}
          onPatternSwatchWidthChange={hook.setPatternSwatchWidth}
          onPatternSwatchHeightChange={hook.setPatternSwatchHeight}
          onPatternCountChange={hook.setPatternCount}
          result={hook.patternRescaleResult}
          unitLabel={
            hook.unit === 'cm' ? t('tools.knitting-gauge.units.cm') : t('tools.knitting-gauge.units.inch')
          }
        />
      )}

      {/* Saved projects section */}
      <SavedProjects
        projects={hook.projects}
        onSave={hook.handleSaveProject}
        onApply={hook.handleApplyProject}
        onRemove={hook.handleRemoveProject}
      />
    </div>
  )
}
