'use client';

import { useTranslations } from 'next-intl';
import { UNITS_BY_CATEGORY } from '@/lib/unit-converter';
import { ConversionInput } from './ConversionInput';
import { UnitPicker } from './UnitPicker';
import { SwapButton } from './SwapButton';
import { PrecisionSlider } from './PrecisionSlider';
import { UseUnitConverterReturn } from './useUnitConverter';

interface Props {
  state: UseUnitConverterReturn;
}

/**
 * ConversionPanel: Grid layout for input, unit pickers, swap, precision.
 * Desktop: 4 columns; tablet/mobile: stack vertically.
 */
export function ConversionPanel({ state }: Props) {
  const t = useTranslations('tools.unit-converter');

  return (
    <div className="space-y-6">
      {/* Main conversion area: input + pickers */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
        {/* From input */}
        <div>
          <ConversionInput
            value={state.fromValue}
            onChange={state.setFromValue}
            error={state.error ? t(`errors.${state.error}`) : undefined}
          />
        </div>

        {/* From unit picker */}
        <div>
          <label htmlFor="from-unit" className="block text-sm font-medium text-text mb-2">
            {t('fromUnit.label')}
          </label>
          <UnitPicker
            id="from-unit"
            ariaLabel={t('fromUnit.label')}
            category={state.category}
            selectedId={state.fromUnit}
            onChange={state.setFromUnit}
          />
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <SwapButton
            fromUnit={state.fromUnit}
            toUnit={state.toUnit}
            onClick={state.swap}
          />
        </div>

        {/* To unit picker */}
        <div>
          <label htmlFor="to-unit" className="block text-sm font-medium text-text mb-2">
            {t('toUnit.label')}
          </label>
          <UnitPicker
            id="to-unit"
            ariaLabel={t('toUnit.label')}
            category={state.category}
            selectedId={state.toUnit}
            onChange={state.setToUnit}
          />
        </div>
      </div>

      {/* To value display */}
      {state.fromValue && (
        <div className="p-4 bg-surface-muted rounded-lg border border-hairline">
          <div className="text-2xl font-semibold text-text">
            {state.formattedToValue || '—'}
            {state.toValue !== null &&
              ` ${UNITS_BY_CATEGORY[state.category]?.[state.toUnit]?.symbol ?? state.toUnit}`}
          </div>
        </div>
      )}

      {/* Precision slider */}
      <PrecisionSlider
        value={state.precision}
        onChange={state.setPrecision}
      />
    </div>
  );
}
