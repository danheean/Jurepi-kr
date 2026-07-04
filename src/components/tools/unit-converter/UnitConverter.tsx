'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useUnitConverter } from './useUnitConverter';
import { CategoryTabs } from './CategoryTabs';
import { ConversionPanel } from './ConversionPanel';
import { ConversionTable } from './ConversionTable';
import { RecentsPanel } from './RecentsPanel';

interface Props {
  locale: string;
}

/**
 * UnitConverter: Main orchestrator component for unit conversion tool.
 * Manages category/from/to/value/precision/recents state via useUnitConverter hook.
 * All interaction is local SPA — no page reload or route navigation.
 */
export function UnitConverter({ locale }: Props) {
  const t = useTranslations('tools.unit-converter');
  const state = useUnitConverter(locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Table shows the user's input expressed across units; fall back to 1 (a
  // reference row) when the field is empty or not a finite number.
  const parsedInput = Number(state.fromValue);
  const tableValue =
    state.fromValue.trim() !== '' && Number.isFinite(parsedInput)
      ? parsedInput
      : undefined;

  return (
    <div className="space-y-8">
      {/* Category tabs */}
      <CategoryTabs
        active={state.category}
        onChange={state.setCategory}
      />

      {/* Conversion panel: input, unit pickers, swap, precision */}
      <ConversionPanel
        state={state}
      />

      {/* Conversion table: `input fromUnit` expressed across every unit.
          Falls back to 1 (reference row) when the input is empty/invalid. */}
      <ConversionTable
        category={state.category}
        fromUnit={state.fromUnit}
        fromValue={tableValue}
        precision={state.precision}
      />

      {/* Recent conversions */}
      {state.recents.length > 0 && (
        <RecentsPanel
          recents={state.recents}
          onRestore={state.restoreRecent}
          onClear={state.clearRecents}
        />
      )}
    </div>
  );
}
