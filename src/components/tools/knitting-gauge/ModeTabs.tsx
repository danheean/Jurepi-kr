'use client'

import { useTranslations } from 'next-intl'
import type { Mode } from '@/lib/knitting-gauge/schema'

interface ModeTabsProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
}

const MODES: Array<{ id: Mode; labelKey: string }> = [
  { id: 'dimToCounts', labelKey: 'tools.knitting-gauge.modes.dimToCounts' },
  { id: 'countsToDim', labelKey: 'tools.knitting-gauge.modes.countsToDim' },
  { id: 'patternRescale', labelKey: 'tools.knitting-gauge.modes.patternRescale' },
]

export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  const t = useTranslations()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

    const currentIndex = MODES.findIndex((m) => m.id === mode)
    let nextIndex = currentIndex

    if (e.key === 'ArrowLeft') {
      nextIndex = currentIndex === 0 ? MODES.length - 1 : currentIndex - 1
    } else if (e.key === 'ArrowRight') {
      nextIndex = currentIndex === MODES.length - 1 ? 0 : currentIndex + 1
    }

    onModeChange(MODES[nextIndex].id)
    e.preventDefault()
  }

  return (
    <div
      role="tablist"
      className="flex gap-1 border-b border-hairline overflow-x-auto scroll-smooth"
      onKeyDown={handleKeyDown}
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          role="tab"
          aria-selected={mode === m.id}
          onClick={() => onModeChange(m.id)}
          className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            mode === m.id
              ? 'text-text'
              : 'text-text-secondary hover:text-text/80'
          }`}
        >
          {t(m.labelKey)}
          {mode === m.id && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-accent-sun" />
          )}
        </button>
      ))}
    </div>
  )
}
