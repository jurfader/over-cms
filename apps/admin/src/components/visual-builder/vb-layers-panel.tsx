'use client'

import { useState, useCallback } from 'react'
import {
  ChevronRight, ChevronDown, Eye, EyeOff,
  LayoutTemplate, Rows3, Columns3,
} from 'lucide-react'
import { useVisualBuilderStore } from './vb-store'
import { BLOCK_DEF_MAP, type BlockType, type Block } from '@/components/editor/types'
import { cn } from '@/lib/utils'

// ─── Color config per block type ─────────────────────────────────────────────

const TYPE_COLORS: Record<string, { text: string; bg: string; icon: string }> = {
  section: { text: 'text-purple-400', bg: 'bg-purple-500/10', icon: 'text-purple-400' },
  row:     { text: 'text-blue-400',   bg: 'bg-blue-500/10',   icon: 'text-blue-400'   },
  column:  { text: 'text-emerald-400',bg: 'bg-emerald-500/10',icon: 'text-emerald-400' },
}

const DEFAULT_COLOR = { text: 'text-[var(--color-muted-foreground)]', bg: 'bg-[var(--color-surface-elevated)]', icon: 'text-[var(--color-muted-foreground)]' }

function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? DEFAULT_COLOR
}

// ─── Type icons ──────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  section: LayoutTemplate,
  row: Rows3,
  column: Columns3,
}

function getTypeIcon(type: string): React.ElementType {
  if (TYPE_ICONS[type]) return TYPE_ICONS[type]
  const def = BLOCK_DEF_MAP[type as BlockType]
  return def?.icon ?? LayoutTemplate
}

// ─── Preview text ────────────────────────────────────────────────────────────

function getPreviewText(block: Block): string {
  const d = block.data
  const raw = (d.text ?? d.title ?? d.label ?? d.name ?? d.html ?? d.code ?? '') as string
  if (!raw) return ''
  const clean = raw.replace(/<[^>]*>/g, '').trim()
  return clean.length > 28 ? clean.slice(0, 28) + '...' : clean
}

// ─── Structural types that can collapse ──────────────────────────────────────

const COLLAPSIBLE = new Set(['section', 'row'])

// ─── Component ──────────────────────────────────────────────────────────────

export function VBLayersPanel() {
  const blocks = useVisualBuilderStore((s) => s.blocks)
  const selectedBlockId = useVisualBuilderStore((s) => s.selectedBlockId)
  const selectBlock = useVisualBuilderStore((s) => s.selectBlock)
  const updateBlockStyle = useVisualBuilderStore((s) => s.updateBlockStyle)

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleVisibility = useCallback(
    (id: string, currentlyHidden: boolean) => {
      updateBlockStyle(id, { hidden: !currentlyHidden })
    },
    [updateBlockStyle],
  )

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Brak bloków
        </p>
        <p className="text-xs text-[var(--color-subtle)] mt-1">
          Dodaj pierwszy moduł z zakładki Moduły.
        </p>
      </div>
    )
  }

  return (
    <div className="py-1">
      {blocks.map((block) => (
        <LayerNode
          key={block.id}
          block={block}
          depth={0}
          selectedBlockId={selectedBlockId}
          collapsed={collapsed}
          onSelect={selectBlock}
          onToggleCollapse={toggleCollapse}
          onToggleVisibility={toggleVisibility}
        />
      ))}
    </div>
  )
}

// ─── Recursive tree node ─────────────────────────────────────────────────────

interface LayerNodeProps {
  block: Block
  depth: number
  selectedBlockId: string | null
  collapsed: Set<string>
  onSelect: (id: string | null) => void
  onToggleCollapse: (id: string) => void
  onToggleVisibility: (id: string, currentlyHidden: boolean) => void
}

function LayerNode({
  block,
  depth,
  selectedBlockId,
  collapsed,
  onSelect,
  onToggleCollapse,
  onToggleVisibility,
}: LayerNodeProps) {
  const isSelected = block.id === selectedBlockId
  const isCollapsed = collapsed.has(block.id)
  const isHidden = !!(block.style?.hidden)
  const hasChildren = !!(block.children?.length)
  const canCollapse = COLLAPSIBLE.has(block.type) && hasChildren

  const color = getTypeColor(block.type)
  const Icon = getTypeIcon(block.type)
  const def = BLOCK_DEF_MAP[block.type as BlockType]
  const label = def?.label ?? block.type
  const preview = getPreviewText(block)

  return (
    <>
      {/* Node row */}
      <div
        className={cn(
          'group flex items-center gap-1 pr-1.5 py-[3px] cursor-pointer transition-colors text-xs',
          isSelected
            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
            : 'hover:bg-[var(--color-surface-elevated)] text-[var(--color-foreground)]',
          isHidden && 'opacity-40',
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => onSelect(block.id)}
      >
        {/* Collapse toggle */}
        {canCollapse ? (
          <button
            type="button"
            className="w-4 h-4 flex items-center justify-center shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(block.id)
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Icon */}
        <span className={cn('shrink-0', color.icon)}>
          <Icon className="w-3.5 h-3.5" />
        </span>

        {/* Label */}
        <span className={cn('font-medium truncate', isSelected ? 'text-[var(--color-primary)]' : color.text)}>
          {label}
        </span>

        {/* Preview text */}
        {preview && (
          <span className="text-[10px] text-[var(--color-subtle)] truncate ml-0.5 flex-1 min-w-0">
            {preview}
          </span>
        )}
        {!preview && <span className="flex-1" />}

        {/* Visibility toggle */}
        <button
          type="button"
          className={cn(
            'w-4 h-4 flex items-center justify-center shrink-0 transition-colors',
            isHidden
              ? 'text-[var(--color-muted-foreground)]'
              : 'text-[var(--color-subtle)] opacity-0 group-hover:opacity-100',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(block.id, isHidden)
          }}
          title={isHidden ? 'Pokaż' : 'Ukryj'}
        >
          {isHidden ? (
            <EyeOff className="w-3 h-3" />
          ) : (
            <Eye className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Children (if not collapsed) */}
      {hasChildren && !isCollapsed && block.children!.map((child) => (
        <LayerNode
          key={child.id}
          block={child}
          depth={depth + 1}
          selectedBlockId={selectedBlockId}
          collapsed={collapsed}
          onSelect={onSelect}
          onToggleCollapse={onToggleCollapse}
          onToggleVisibility={onToggleVisibility}
        />
      ))}
    </>
  )
}
