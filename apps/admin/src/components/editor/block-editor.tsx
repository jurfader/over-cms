'use client'

import { useState, useCallback, memo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ChevronDown, ChevronUp, Plus, Palette, EyeOff, Monitor, Tablet, Smartphone, PanelRight, Rows3, Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BlockPicker } from './block-picker'
import { BLOCK_EDITOR_MAP, blockPreview } from './block-editors'
import { BlockStyleEditor } from './block-style-editor'
import { BlocksPreview, type PreviewDevice } from './block-preview'
import { InnerBlockEditorCtx } from './block-editor-context'
import { BLOCK_DEF_MAP, createBlock } from './types'
import type { Block, BlockStyle, BlockType } from './types'

// ─── Structural type helpers ────────────────────────────────────────────────

const STRUCTURAL_TYPES: BlockType[] = ['section', 'row', 'column']

const MODULE_TYPES: BlockType[] = (Object.keys(BLOCK_DEF_MAP) as BlockType[]).filter(
  (t) => !STRUCTURAL_TYPES.includes(t),
)

// ─── Tree operations ────────────────────────────────────────────────────────

/** Update a block anywhere in the tree by ID */
function updateInTree(blocks: Block[], id: string, updater: (b: Block) => Block): Block[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b)
    if (b.children?.length) {
      const updatedChildren = updateInTree(b.children, id, updater)
      if (updatedChildren !== b.children) return { ...b, children: updatedChildren }
    }
    return b
  })
}

/** Remove a block anywhere in the tree by ID */
function removeFromTree(blocks: Block[], id: string): Block[] {
  const result: Block[] = []
  for (const b of blocks) {
    if (b.id === id) continue
    if (b.children?.length) {
      const updatedChildren = removeFromTree(b.children, id)
      result.push(updatedChildren !== b.children ? { ...b, children: updatedChildren } : b)
    } else {
      result.push(b)
    }
  }
  // Return same reference if nothing changed (optimization)
  if (result.length === blocks.length && result.every((b, i) => b === blocks[i])) return blocks
  return result
}

/** Add a child block to a parent block by parent ID */
function addChildTo(blocks: Block[], parentId: string, child: Block): Block[] {
  return updateInTree(blocks, parentId, (parent) => ({
    ...parent,
    children: [...(parent.children ?? []), child],
  }))
}

/** Move a child block up or down within its parent's children list */
function moveChildInTree(blocks: Block[], childId: string, direction: 'up' | 'down'): Block[] {
  // Check top-level
  const topIdx = blocks.findIndex((b) => b.id === childId)
  if (topIdx !== -1) {
    const newIdx = direction === 'up' ? topIdx - 1 : topIdx + 1
    if (newIdx < 0 || newIdx >= blocks.length) return blocks
    return arrayMove(blocks, topIdx, newIdx)
  }
  // Search in children
  return blocks.map((b) => {
    if (!b.children?.length) return b
    const childIdx = b.children.findIndex((c) => c.id === childId)
    if (childIdx !== -1) {
      const newIdx = direction === 'up' ? childIdx - 1 : childIdx + 1
      if (newIdx < 0 || newIdx >= b.children.length) return b
      return { ...b, children: arrayMove(b.children, childIdx, newIdx) }
    }
    const updatedChildren = moveChildInTree(b.children, childId, direction)
    if (updatedChildren !== b.children) return { ...b, children: updatedChildren }
    return b
  })
}

// ─── Column children renderer ───────────────────────────────────────────────

interface ColumnChildrenProps {
  column: Block
  onUpdate: (id: string, data: Record<string, unknown>) => void
  onUpdateStyle: (id: string, style: BlockStyle) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onAddToParent: (parentId: string) => void
}

function ColumnChildren({ column, onUpdate, onUpdateStyle, onRemove, onMoveUp, onMoveDown, onAddToParent }: ColumnChildrenProps) {
  const children = column.children ?? []
  const width = column.data.width as number | undefined

  return (
    <div className="flex-1 min-w-0">
      {/* Column header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] rounded-t-[var(--radius)]">
        <Columns3 className="w-3 h-3 text-emerald-500 shrink-0" />
        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
          {width ? `${width}%` : 'Kolumna'}
        </span>
      </div>

      {/* Column modules */}
      <div className="border-x border-b border-[var(--color-border)] rounded-b-[var(--radius)] min-h-[60px]">
        {children.length > 0 ? (
          <div className="space-y-1.5 p-2">
            {children.map((child, idx) => (
              <SortableBlock
                key={child.id}
                block={child}
                index={idx}
                total={children.length}
                onUpdate={onUpdate}
                onUpdateStyle={onUpdateStyle}
                onRemove={onRemove}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onAddToParent={onAddToParent}
                depth={3}
              />
            ))}
          </div>
        ) : (
          <div className="p-3 text-center">
            <p className="text-[10px] text-[var(--color-subtle)] mb-1.5">Brak moduli</p>
          </div>
        )}

        {/* Add module button */}
        <div className="px-2 pb-2">
          <button
            onClick={() => onAddToParent(column.id)}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-[var(--color-primary)] border border-dashed border-[var(--color-primary)]/30 rounded-[var(--radius)] hover:bg-[var(--color-primary-muted)] transition-colors"
          >
            <Plus className="w-3 h-3" />
            Dodaj moduł
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Row children renderer (columns side by side) ───────────────────────────

interface RowChildrenProps {
  row: Block
  onUpdate: (id: string, data: Record<string, unknown>) => void
  onUpdateStyle: (id: string, style: BlockStyle) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onAddToParent: (parentId: string) => void
}

function RowChildren({ row, onUpdate, onUpdateStyle, onRemove, onMoveUp, onMoveDown, onAddToParent }: RowChildrenProps) {
  const columns = (row.children ?? []).filter((c) => c.type === 'column')

  if (columns.length === 0) {
    return (
      <div className="p-3 text-center">
        <p className="text-[10px] text-[var(--color-subtle)]">Wiersz nie ma kolumn</p>
      </div>
    )
  }

  return (
    <div className="flex gap-2 p-2">
      {columns.map((col) => {
        const width = col.data.width as number | undefined
        return (
          <div key={col.id} style={{ flex: width ? `0 0 ${width}%` : '1 1 0%' }} className="min-w-0">
            <ColumnChildren
              column={col}
              onUpdate={onUpdate}
              onUpdateStyle={onUpdateStyle}
              onRemove={onRemove}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onAddToParent={onAddToParent}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Section children renderer ──────────────────────────────────────────────

interface SectionChildrenProps {
  section: Block
  onUpdate: (id: string, data: Record<string, unknown>) => void
  onUpdateStyle: (id: string, style: BlockStyle) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onAddToParent: (parentId: string) => void
  onAddRowTo: (sectionId: string) => void
  onAddModuleTo: (sectionId: string) => void
}

function SectionChildren({
  section, onUpdate, onUpdateStyle, onRemove, onMoveUp, onMoveDown, onAddToParent, onAddRowTo, onAddModuleTo,
}: SectionChildrenProps) {
  const children = section.children ?? []

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="pl-3 border-l-2 border-purple-400/50 ml-2 my-2 mr-2 space-y-2">
        {children.length > 0 ? (
          children.map((child, idx) => (
            <SortableBlock
              key={child.id}
              block={child}
              index={idx}
              total={children.length}
              onUpdate={onUpdate}
              onUpdateStyle={onUpdateStyle}
              onRemove={onRemove}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onAddToParent={onAddToParent}
              depth={1}
            />
          ))
        ) : (
          <div className="py-4 text-center">
            <p className="text-[10px] text-[var(--color-subtle)]">Pusta sekcja</p>
          </div>
        )}
      </div>

      {/* Action buttons for section */}
      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={() => onAddRowTo(section.id)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-purple-600 border border-dashed border-purple-300 rounded-[var(--radius)] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          <Rows3 className="w-3 h-3" />
          Dodaj wiersz
        </button>
        <button
          onClick={() => onAddModuleTo(section.id)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-[var(--color-primary)] border border-dashed border-[var(--color-primary)]/30 rounded-[var(--radius)] hover:bg-[var(--color-primary-muted)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Dodaj moduł
        </button>
      </div>
    </div>
  )
}

// ─── Sortable block row ────────────────────────────────────────────────────────

interface SortableBlockProps {
  block:        Block
  index:        number
  total:        number
  onUpdate:     (id: string, data: Record<string, unknown>) => void
  onUpdateStyle:(id: string, style: BlockStyle) => void
  onRemove:     (id: string) => void
  onMoveUp:     (id: string) => void
  onMoveDown:   (id: string) => void
  onAddToParent?: (parentId: string) => void
  depth?:       number
}

const SortableBlock = memo(function SortableBlock({
  block, index, total, onUpdate, onUpdateStyle, onRemove, onMoveUp, onMoveDown, onAddToParent, depth = 0,
}: SortableBlockProps) {
  const [expanded, setExpanded] = useState(true)
  const [tab,      setTab]      = useState<'content' | 'style'>('content')

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const def    = BLOCK_DEF_MAP[block.type]
  const Icon   = def?.icon
  const Editor = BLOCK_EDITOR_MAP[block.type]
  const blockStyle = block.style ?? {}
  const hasStyle = Object.values(blockStyle).some((v) => v !== undefined && v !== 'none' && v !== 'inherit' && v !== 'left' && v !== 'normal' && v !== false && v !== '')

  const isSection = block.type === 'section'
  const isRow     = block.type === 'row'
  const isColumn  = block.type === 'column'
  const isStructural = isSection || isRow || isColumn

  // Visual border colors for structural blocks
  const borderColorClass = isSection
    ? 'border-l-purple-500'
    : isRow
      ? 'border-l-blue-500'
      : isColumn
        ? 'border-l-emerald-500'
        : ''

  return (
    <div
      ref={setNodeRef}
      style={dndStyle}
      className={cn(
        'rounded-[var(--radius)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-background)] transition-shadow',
        isDragging && 'shadow-2xl opacity-80 z-50 relative',
        blockStyle.hidden && 'opacity-50',
        isStructural && 'border-l-[3px]',
        borderColorClass,
      )}
    >
      {/* Block header */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]',
        isSection && 'bg-purple-50/50 dark:bg-purple-950/20',
        isRow && 'bg-blue-50/50 dark:bg-blue-950/20',
      )}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)] transition-colors touch-none"
          aria-label="Przeciągnij blok"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Block type icon + label */}
        {Icon && <Icon className={cn(
          'w-3.5 h-3.5 shrink-0',
          isSection ? 'text-purple-500' : isRow ? 'text-blue-500' : 'text-[var(--color-subtle)]',
        )} />}
        <span className={cn(
          'text-xs font-semibold shrink-0',
          isSection ? 'text-purple-600 dark:text-purple-400' : isRow ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--color-muted-foreground)]',
        )}>
          {def?.label ?? block.type}
        </span>

        {/* Preview */}
        <span className="text-xs text-[var(--color-subtle)] truncate flex-1 min-w-0">
          {blockPreview(block)}
        </span>

        {/* Children count for structural blocks */}
        {isStructural && (block.children?.length ?? 0) > 0 && (
          <span className="text-[10px] text-[var(--color-subtle)] shrink-0">
            ({block.children!.length})
          </span>
        )}

        {/* Hidden badge */}
        {blockStyle.hidden && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--color-subtle)] shrink-0">
            <EyeOff className="w-3 h-3" /> Ukryty
          </span>
        )}

        {/* Style indicator */}
        {hasStyle && (
          <Palette className="w-3 h-3 text-[var(--color-primary)] shrink-0" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onMoveUp(block.id)}
            disabled={index === 0}
            className="p-1 text-[var(--color-subtle)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition-colors"
            aria-label="Przesuń w górę"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(block.id)}
            disabled={index === total - 1}
            className="p-1 text-[var(--color-subtle)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition-colors"
            aria-label="Przesuń w dół"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 text-[var(--color-subtle)] hover:text-[var(--color-foreground)] transition-colors"
            aria-label={expanded ? 'Zwiń' : 'Rozwiń'}
          >
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
          </button>
          <button
            onClick={() => onRemove(block.id)}
            className="p-1 text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors"
            aria-label="Usuń blok"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      {expanded && (
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <button
            onClick={() => setTab('content')}
            className={cn(
              'px-4 py-1.5 text-xs font-medium border-b-2 transition-colors',
              tab === 'content'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)]',
            )}
          >
            Treść
          </button>
          <button
            onClick={() => setTab('style')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium border-b-2 transition-colors',
              tab === 'style'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)]',
            )}
          >
            <Palette className="w-3 h-3" />
            Styl
            {hasStyle && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
          </button>
        </div>
      )}

      {/* Panel body */}
      {expanded && (
        <div className="p-4">
          {tab === 'content' ? (
            Editor ? (
              <Editor
                data={block.data}
                onChange={(data) => onUpdate(block.id, data)}
              />
            ) : (
              <p className="text-xs text-[var(--color-subtle)]">Brak edytora dla tego bloku.</p>
            )
          ) : (
            <BlockStyleEditor
              style={blockStyle}
              onChange={(s) => onUpdateStyle(block.id, s)}
            />
          )}
        </div>
      )}

      {/* ── Children area for structural blocks ─────────────────────── */}
      {expanded && isSection && onAddToParent && (
        <SectionChildren
          section={block}
          onUpdate={onUpdate}
          onUpdateStyle={onUpdateStyle}
          onRemove={onRemove}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onAddToParent={onAddToParent}
          onAddRowTo={(sectionId) => {
            // Handled by parent BlockEditor via onAddToParent with a special signal
            // We use the addRow callback passed via closure
            onAddToParent(`__row__${sectionId}`)
          }}
          onAddModuleTo={(sectionId) => {
            onAddToParent(sectionId)
          }}
        />
      )}

      {expanded && isRow && onAddToParent && (
        <div className="border-t border-[var(--color-border)]">
          <RowChildren
            row={block}
            onUpdate={onUpdate}
            onUpdateStyle={onUpdateStyle}
            onRemove={onRemove}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onAddToParent={onAddToParent}
          />
        </div>
      )}

      {/* Standalone column (rare case) */}
      {expanded && isColumn && onAddToParent && (block.children?.length ?? 0) > 0 && (
        <div className="border-t border-[var(--color-border)] p-2 space-y-1.5">
          {block.children!.map((child, idx) => (
            <SortableBlock
              key={child.id}
              block={child}
              index={idx}
              total={block.children!.length}
              onUpdate={onUpdate}
              onUpdateStyle={onUpdateStyle}
              onRemove={onRemove}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onAddToParent={onAddToParent}
              depth={depth + 1}
            />
          ))}
          <button
            onClick={() => onAddToParent(block.id)}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-[var(--color-primary)] border border-dashed border-[var(--color-primary)]/30 rounded-[var(--radius)] hover:bg-[var(--color-primary-muted)] transition-colors"
          >
            <Plus className="w-3 h-3" />
            Dodaj moduł
          </button>
        </div>
      )}
    </div>
  )
})

// ─── Block editor ──────────────────────────────────────────────────────────────

interface BlockEditorProps {
  value:    Block[]
  onChange: (blocks: Block[]) => void
  compact?: boolean
}

export function BlockEditor({ value, onChange, compact }: BlockEditorProps) {
  const [pickerOpen,    setPickerOpen]    = useState(false)
  const [preview,       setPreview]       = useState(false)
  const [device,        setDevice]        = useState<PreviewDevice>('desktop')
  // Tracks which parent we're adding a block to (null = top-level)
  const [pickerParentId, setPickerParentId] = useState<string | null>(null)
  // Tracks allowed types for the picker
  const [pickerAllowed,  setPickerAllowed]  = useState<BlockType[] | undefined>(undefined)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((b) => b.id === active.id)
      const newIndex = value.findIndex((b) => b.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(value, oldIndex, newIndex))
      }
    }
  }

  // ── Top-level add (section or module) ─────────────────────────────────────

  const openTopLevelPicker = useCallback(() => {
    setPickerParentId(null)
    setPickerAllowed(undefined) // show all
    setPickerOpen(true)
  }, [])

  // ── Add block to a specific parent ────────────────────────────────────────

  const openPickerForParent = useCallback((parentId: string) => {
    // Special signal: __row__<sectionId> means add a row to a section
    if (parentId.startsWith('__row__')) {
      const sectionId = parentId.slice(7)
      const newRow = createBlock('row')
      onChange(addChildTo(value, sectionId, newRow))
      return
    }

    // Determine allowed types based on parent type
    const parentBlock = findInTree(value, parentId)
    if (!parentBlock) return

    if (parentBlock.type === 'section') {
      // Inside section: allow rows and all module types
      setPickerAllowed(['row', ...MODULE_TYPES])
    } else if (parentBlock.type === 'column' || parentBlock.type === 'row') {
      // Inside column: only module types
      setPickerAllowed([...MODULE_TYPES])
    } else {
      setPickerAllowed(undefined)
    }

    setPickerParentId(parentId)
    setPickerOpen(true)
  }, [value, onChange])

  // ── Pick handler ──────────────────────────────────────────────────────────

  const handlePick = useCallback((type: BlockType) => {
    const newBlock = createBlock(type)

    if (pickerParentId) {
      // Add as child of the target parent
      onChange(addChildTo(value, pickerParentId, newBlock))
    } else {
      // Top-level add
      onChange([...value, newBlock])
    }

    setPickerOpen(false)
    setPickerParentId(null)
    setPickerAllowed(undefined)
  }, [value, onChange, pickerParentId])

  // ── Tree-aware CRUD callbacks ─────────────────────────────────────────────

  const updateBlock = useCallback((id: string, data: Record<string, unknown>) => {
    onChange(updateInTree(value, id, (b) => ({ ...b, data })))
  }, [value, onChange])

  const updateStyle = useCallback((id: string, style: BlockStyle) => {
    onChange(updateInTree(value, id, (b) => ({ ...b, style })))
  }, [value, onChange])

  const removeBlock = useCallback((id: string) => {
    onChange(removeFromTree(value, id))
  }, [value, onChange])

  const moveUp = useCallback((id: string) => {
    onChange(moveChildInTree(value, id, 'up'))
  }, [value, onChange])

  const moveDown = useCallback((id: string) => {
    onChange(moveChildInTree(value, id, 'down'))
  }, [value, onChange])

  return (
    <InnerBlockEditorCtx.Provider value={BlockEditor}>
    <div className="flex flex-col h-full gap-0">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-1 pb-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="border-dashed flex-1"
          onClick={openTopLevelPicker}
        >
          <Plus className="w-4 h-4" />
          Dodaj blok
        </Button>

        {/* Device picker + preview toggle (hidden in compact mode) */}
        {!compact && (
          <>
            {preview && (
              <div className="flex items-center gap-0.5 border border-[var(--color-border)] rounded-[var(--radius)] p-0.5">
                {([
                  { d: 'desktop' as const, Icon: Monitor    },
                  { d: 'tablet'  as const, Icon: Tablet     },
                  { d: 'mobile'  as const, Icon: Smartphone },
                ]).map(({ d, Icon }) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      device === d
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'text-[var(--color-subtle)] hover:text-[var(--color-foreground)]',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}

            <Button
              variant={preview ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreview((v) => !v)}
            >
              <PanelRight className="w-4 h-4" />
              {preview ? 'Edytuj' : 'Podgląd'}
            </Button>
          </>
        )}
      </div>

      {/* Main area */}
      <div className={cn('flex gap-3 flex-1 min-h-0', !compact && preview && 'overflow-hidden')}>

        {/* Editor column */}
        <div className={cn('overflow-y-auto scrollbar-thin space-y-2', !compact && preview ? 'w-[420px] shrink-0' : 'flex-1')}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={value.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {value.map((block, index) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    index={index}
                    total={value.length}
                    onUpdate={updateBlock}
                    onUpdateStyle={updateStyle}
                    onRemove={removeBlock}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                    onAddToParent={openPickerForParent}
                    depth={0}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Empty state */}
          {value.length === 0 && (
            <div className="py-12 text-center rounded-[var(--radius)] border-2 border-dashed border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-subtle)]">Brak bloków</p>
              <p className="text-xs text-[var(--color-subtle)] opacity-60 mt-1">Kliknij "Dodaj blok" aby zacząć</p>
            </div>
          )}
        </div>

        {/* Preview column */}
        {!compact && preview && (
          <div className="flex-1 min-w-0 rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden">
            <BlocksPreview blocks={value} device={device} />
          </div>
        )}
      </div>

      {/* Block picker modal */}
      {pickerOpen && (
        <BlockPicker
          onPick={handlePick}
          onClose={() => {
            setPickerOpen(false)
            setPickerParentId(null)
            setPickerAllowed(undefined)
          }}
          allowedTypes={pickerAllowed}
        />
      )}
    </div>
    </InnerBlockEditorCtx.Provider>
  )
}

// ─── Utility: find block in tree ────────────────────────────────────────────

function findInTree(blocks: Block[], id: string): Block | undefined {
  for (const b of blocks) {
    if (b.id === id) return b
    if (b.children?.length) {
      const found = findInTree(b.children, id)
      if (found) return found
    }
  }
  return undefined
}
