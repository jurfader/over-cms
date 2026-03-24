'use client'

import { useState, useCallback } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { BLOCK_DEFS, BLOCK_CATEGORIES } from '@/components/editor/types'
import type { BlockDef, BlockCategory } from '@/components/editor/types'
import { useVisualBuilderStore } from './vb-store'
import { cn } from '@/lib/utils'

// ─── Filter out column (auto-created inside rows) ───────────────────────────

const PICKABLE_BLOCKS = BLOCK_DEFS.filter((d) => d.type !== 'column')

// ─── Grouped by category ────────────────────────────────────────────────────

function groupByCategory(defs: BlockDef[]): Map<BlockCategory, BlockDef[]> {
  const map = new Map<BlockCategory, BlockDef[]>()
  for (const def of defs) {
    const group = map.get(def.category) ?? []
    group.push(def)
    map.set(def.category, group)
  }
  return map
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VBModulePicker() {
  const startDrag = useVisualBuilderStore((s) => s.startDrag)
  const endDrag = useVisualBuilderStore((s) => s.endDrag)

  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<BlockCategory>>(new Set())

  // ── Filter ──────────────────────────────────────────────────────────────

  const needle = search.toLowerCase().trim()
  const filtered = needle
    ? PICKABLE_BLOCKS.filter(
        (d) =>
          d.label.toLowerCase().includes(needle) ||
          d.description.toLowerCase().includes(needle) ||
          d.type.toLowerCase().includes(needle),
      )
    : PICKABLE_BLOCKS

  const grouped = groupByCategory(filtered)

  // ── Toggle category ─────────────────────────────────────────────────────

  const toggleCategory = useCallback((cat: BlockCategory) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // ── Drag handlers ──────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, def: BlockDef) => {
      e.dataTransfer.setData('text/plain', def.type)
      e.dataTransfer.effectAllowed = 'copy'
      startDrag(def.type)
    },
    [startDrag],
  )

  const handleDragEnd = useCallback(() => {
    endDrag()
  }, [endDrag])

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-subtle)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj modułu..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 space-y-1">
        {BLOCK_CATEGORIES.map(({ id, label }) => {
          const defs = grouped.get(id)
          if (!defs?.length) return null

          const isCollapsed = collapsed.has(id)

          return (
            <div key={id}>
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(id)}
                className="w-full flex items-center justify-between py-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
              >
                <span>{label}</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    isCollapsed && '-rotate-90',
                  )}
                />
              </button>

              {/* Block cards */}
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-1.5">
                  {defs.map((def) => (
                    <BlockCard
                      key={def.type}
                      def={def}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs text-[var(--color-subtle)]">
            Brak modułów pasujących do &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Block card ─────────────────────────────────────────────────────────────

function BlockCard({
  def,
  onDragStart,
  onDragEnd,
}: {
  def: BlockDef
  onDragStart: (e: React.DragEvent, def: BlockDef) => void
  onDragEnd: () => void
}) {
  const Icon = def.icon

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, def)}
      onDragEnd={onDragEnd}
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 cursor-grab active:cursor-grabbing transition-colors group"
      title={def.description}
    >
      <Icon className="w-5 h-5 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors" />
      <span className="text-[10px] font-medium text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] transition-colors text-center leading-tight">
        {def.label}
      </span>
    </div>
  )
}
