'use client'

import { useVisualBuilderStore } from './vb-store'
import { VBModulePicker } from './vb-module-picker'
import { cn } from '@/lib/utils'

// ─── Tab config ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'modules' as const, label: 'Moduły' },
  { id: 'layers'  as const, label: 'Warstwy' },
] as const

// ─── Component ──────────────────────────────────────────────────────────────

export function VBLeftPanel() {
  const leftPanel = useVisualBuilderStore((s) => s.leftPanel)
  const setLeftPanel = useVisualBuilderStore((s) => s.setLeftPanel)

  return (
    <div className="w-[280px] border-r border-[var(--color-border)] bg-[var(--color-background)] flex flex-col shrink-0 overflow-hidden">

      {/* Tab switcher */}
      <div className="flex border-b border-[var(--color-border)] shrink-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setLeftPanel(id)}
            className={cn(
              'flex-1 px-3 py-2.5 text-xs font-medium transition-colors relative',
              leftPanel === id
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
          >
            {label}
            {/* Active indicator */}
            {leftPanel === id && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--color-primary)]" />
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {leftPanel === 'modules' && <VBModulePicker />}
        {leftPanel === 'layers' && <VBLayersPlaceholder />}
      </div>
    </div>
  )
}

// ─── Placeholder for layers panel (Phase 8) ─────────────────────────────────

function VBLayersPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Panel warstw
      </p>
      <p className="text-xs text-[var(--color-subtle)] mt-1">
        Drzewo bloków strony z przeciąganiem — w kolejnej fazie.
      </p>
    </div>
  )
}
