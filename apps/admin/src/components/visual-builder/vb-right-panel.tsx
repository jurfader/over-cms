'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { useVisualBuilderStore } from './vb-store'
import { findInTree, getBlockPath } from './vb-tree-ops'
import { BLOCK_DEF_MAP, type BlockType } from '@/components/editor/types'
import { BLOCK_EDITOR_MAP } from '@/components/editor/block-editors'
import { BlockStyleEditor } from '@/components/editor/block-style-editor'
import type { BlockStyle } from '@overcms/core'
import { cn } from '@/lib/utils'

// ─── Tab config ─────────────────────────────────────────────────────────────

type PanelTab = 'content' | 'style'

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'content', label: 'Treść' },
  { id: 'style',   label: 'Styl'  },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function VBRightPanel() {
  const blocks = useVisualBuilderStore((s) => s.blocks)
  const selectedBlockId = useVisualBuilderStore((s) => s.selectedBlockId)
  const updateBlockData = useVisualBuilderStore((s) => s.updateBlockData)
  const updateBlockStyle = useVisualBuilderStore((s) => s.updateBlockStyle)
  const selectBlock = useVisualBuilderStore((s) => s.selectBlock)

  const [tab, setTab] = useState<PanelTab>('content')

  // Reset tab to 'content' when a different block is selected
  const prevSelectedId = useRef(selectedBlockId)
  if (prevSelectedId.current !== selectedBlockId) {
    prevSelectedId.current = selectedBlockId
    if (tab !== 'content') setTab('content')
  }

  // Find the selected block
  const block = selectedBlockId ? findInTree(blocks, selectedBlockId) : null

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleDataChange = useCallback(
    (data: Record<string, unknown>) => {
      if (selectedBlockId) updateBlockData(selectedBlockId, data)
    },
    [selectedBlockId, updateBlockData],
  )

  const handleStyleChange = useCallback(
    (style: BlockStyle) => {
      if (selectedBlockId) updateBlockStyle(selectedBlockId, style)
    },
    [selectedBlockId, updateBlockStyle],
  )

  const handleClose = useCallback(() => {
    selectBlock(null)
  }, [selectBlock])

  // ── Breadcrumbs ─────────────────────────────────────────────────────────

  const breadcrumbs = useMemo(() => {
    if (!selectedBlockId) return []
    const path = getBlockPath(blocks, selectedBlockId)
    return path.map((id) => {
      const b = findInTree(blocks, id)
      if (!b) return { id, label: '?' }
      const d = BLOCK_DEF_MAP[b.type as BlockType]
      return { id, label: d?.label ?? b.type }
    })
  }, [blocks, selectedBlockId])

  // ── Derived ─────────────────────────────────────────────────────────────

  const def = block ? BLOCK_DEF_MAP[block.type as BlockType] : null
  const Editor = block ? BLOCK_EDITOR_MAP[block.type as BlockType] : null
  const Icon = def?.icon

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="w-[320px] h-full border-l border-[var(--color-border)] bg-[var(--color-background)] flex flex-col shrink-0 overflow-hidden">
      {block ? (
        <>
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border)] shrink-0">
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              )}
              <span className="text-sm font-semibold text-[var(--color-foreground)] flex-1 truncate">
                {def?.label ?? block.type}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 1 && (
              <div className="flex items-center gap-0.5 mt-1.5 flex-wrap">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.id} className="flex items-center gap-0.5">
                    {i > 0 && (
                      <ChevronRight className="w-2.5 h-2.5 text-[var(--color-subtle)] shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => selectBlock(crumb.id)}
                      className={cn(
                        'text-[10px] leading-tight transition-colors',
                        i === breadcrumbs.length - 1
                          ? 'text-[var(--color-primary)] font-medium'
                          : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                      )}
                    >
                      {crumb.label}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-[var(--color-border)] shrink-0">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'flex-1 px-3 py-2.5 text-xs font-medium transition-colors relative',
                  tab === id
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                )}
              >
                {label}
                {tab === id && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--color-primary)]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            {tab === 'content' && Editor && (
              <Editor
                data={block.data}
                onChange={handleDataChange}
              />
            )}
            {tab === 'style' && (
              <BlockStyleEditor
                style={block.style ?? {}}
                onChange={handleStyleChange}
              />
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-xs text-[var(--color-subtle)]">
            Wybierz blok, aby edytować
          </p>
        </div>
      )}
    </div>
  )
}
