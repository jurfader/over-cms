'use client'

import { cn } from '@/lib/utils'

// ─── Layout definitions ────────────────────────────────────────────────────────

export interface ColumnLayout {
  id:     string
  widths: number[]   // suma = 100
}

export const COLUMN_LAYOUTS: ColumnLayout[] = [
  // 1 kolumna
  { id: '100',                widths: [100]                          },
  // 2 kolumny
  { id: '50-50',              widths: [50, 50]                       },
  { id: '33-67',              widths: [33, 67]                       },
  { id: '67-33',              widths: [67, 33]                       },
  { id: '25-75',              widths: [25, 75]                       },
  { id: '75-25',              widths: [75, 25]                       },
  { id: '30-70',              widths: [30, 70]                       },
  { id: '70-30',              widths: [70, 30]                       },
  // 3 kolumny
  { id: '33-33-33',           widths: [33, 34, 33]                   },
  { id: '25-50-25',           widths: [25, 50, 25]                   },
  { id: '25-25-50',           widths: [25, 25, 50]                   },
  { id: '50-25-25',           widths: [50, 25, 25]                   },
  { id: '20-60-20',           widths: [20, 60, 20]                   },
  { id: '16-67-16',           widths: [16, 68, 16]                   },
  // 4 kolumny
  { id: '25-25-25-25',        widths: [25, 25, 25, 25]               },
  { id: '40-20-20-20',        widths: [40, 20, 20, 20]               },
  { id: '20-20-20-40',        widths: [20, 20, 20, 40]               },
  { id: '20-20-40-20',        widths: [20, 20, 40, 20]               },
  // 5 kolumn
  { id: '20-20-20-20-20',     widths: [20, 20, 20, 20, 20]           },
  { id: '16-16-40-16-16',     widths: [16, 16, 36, 16, 16]           },
  // 6 kolumn
  { id: '16-16-16-16-16-16',  widths: [17, 17, 16, 17, 17, 16]      },
  // inne asymetryczne
  { id: '60-20-20',           widths: [60, 20, 20]                   },
  { id: '20-20-60',           widths: [20, 20, 60]                   },
  { id: '40-40-20',           widths: [40, 40, 20]                   },
  { id: '20-40-40',           widths: [20, 40, 40]                   },
]

// ─── Visual preview of a single layout ────────────────────────────────────────

function LayoutPreview({ layout, size = 'md', active = false }: {
  layout: ColumnLayout; size?: 'sm' | 'md'; active?: boolean
}) {
  const h = size === 'sm' ? 'h-3' : 'h-8'
  return (
    <div className={`flex gap-[3px] w-full ${h}`}>
      {layout.widths.map((w, i) => (
        <div
          key={i}
          className={cn(
            'rounded-[3px] transition-opacity',
            active ? 'bg-white opacity-90' : 'bg-[var(--color-primary)]',
          )}
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  )
}

// ─── Picker modal ─────────────────────────────────────────────────────────────

interface ColumnLayoutPickerProps {
  current?: string
  onPick:   (layout: ColumnLayout) => void
  onClose:  () => void
}

export function ColumnLayoutPicker({ current, onPick, onClose }: ColumnLayoutPickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-lg)] w-full max-w-xs overflow-hidden shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <h2 className="text-sm font-semibold">Układ kolumn</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--color-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)] transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Flat grid — no section headers, just tiles like in reference */}
        <div className="p-3 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-3 gap-2">
            {COLUMN_LAYOUTS.map((layout) => {
              const isActive = current === layout.id
              return (
                <button
                  key={layout.id}
                  onClick={() => { onPick(layout); onClose() }}
                  title={layout.widths.map((w) => `${w}%`).join(' + ')}
                  className={cn(
                    'p-2.5 rounded-[var(--radius)] border-2 transition-all duration-150 group',
                    isActive
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                      : 'border-transparent bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-muted)]',
                  )}
                >
                  <LayoutPreview layout={layout} active={isActive} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Inline trigger button (shows current layout) ─────────────────────────────

interface LayoutTriggerProps {
  layout?: ColumnLayout
  onClick: () => void
}

export function LayoutTrigger({ layout, onClick }: LayoutTriggerProps) {
  const current = layout ?? COLUMN_LAYOUTS.find((l) => l.id === '50-50')!
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface-elevated)] transition-all duration-150 group"
    >
      <div className="flex-1">
        <LayoutPreview layout={current} size="sm" />
      </div>
      <span className="text-xs text-[var(--color-subtle)] group-hover:text-[var(--color-primary)] shrink-0 transition-colors font-medium">
        Zmień układ ›
      </span>
    </button>
  )
}
