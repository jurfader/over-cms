'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BLOCK_DEFS, BLOCK_CATEGORIES, type BlockType } from './types'

interface BlockPickerProps {
  onPick:  (type: BlockType) => void
  onClose: () => void
  allowedTypes?: BlockType[]
}

export function BlockPicker({ onPick, onClose, allowedTypes }: BlockPickerProps) {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState<string>('all')

  const filtered = BLOCK_DEFS.filter((d) => {
    if (allowedTypes && !allowedTypes.includes(d.type)) return false
    const matchesCat = category === 'all' || d.category === category
    const matchesQ   = !query || d.label.toLowerCase().includes(query.toLowerCase())
    return matchesCat && matchesQ
  })

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-lg)] w-full max-w-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-elevated)]">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Dodaj blok</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-border)] text-[var(--color-subtle)] hover:text-[var(--color-foreground)] transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 bg-[var(--color-background)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-subtle)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj bloku..."
              className="pl-9 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto bg-[var(--color-background)]">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              category === 'all'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-elevated)]',
            )}
          >
            Wszystkie
          </button>
          {BLOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                category === cat.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-elevated)]',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Block grid */}
        <div className="px-4 pb-4 max-h-72 overflow-y-auto scrollbar-thin bg-[var(--color-background)]">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-subtle)]">Brak wyników</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filtered.map((def) => {
                const Icon = def.icon
                return (
                  <button
                    key={def.type}
                    onClick={() => { onPick(def.type); onClose() }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-muted)] transition-all duration-150 group"
                  >
                    <Icon className="w-5 h-5 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors" />
                    <span className="text-[11px] font-medium text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] text-center leading-tight">
                      {def.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Anuluj</Button>
        </div>
      </div>
    </div>
  )
}
