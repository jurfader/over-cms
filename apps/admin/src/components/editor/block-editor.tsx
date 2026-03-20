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
import { GripVertical, Trash2, ChevronDown, ChevronUp, Plus, Palette, EyeOff, Monitor, Tablet, Smartphone, PanelRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BlockPicker } from './block-picker'
import { BLOCK_EDITOR_MAP, blockPreview } from './block-editors'
import { BlockStyleEditor } from './block-style-editor'
import { BlocksPreview, type PreviewDevice } from './block-preview'
import { InnerBlockEditorCtx } from './block-editor-context'
import { BLOCK_DEF_MAP } from './types'
import type { Block, BlockStyle, BlockType } from './types'

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
}

const SortableBlock = memo(function SortableBlock({ block, index, total, onUpdate, onUpdateStyle, onRemove, onMoveUp, onMoveDown }: SortableBlockProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={dndStyle}
      className={cn(
        'rounded-[var(--radius)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-background)] transition-shadow',
        isDragging && 'shadow-2xl opacity-80 z-50 relative',
        blockStyle.hidden && 'opacity-50',
      )}
    >
      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]">
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
        {Icon && <Icon className="w-3.5 h-3.5 text-[var(--color-subtle)] shrink-0" />}
        <span className="text-xs font-semibold text-[var(--color-muted-foreground)] shrink-0">
          {def?.label ?? block.type}
        </span>

        {/* Preview */}
        <span className="text-xs text-[var(--color-subtle)] truncate flex-1 min-w-0">
          {blockPreview(block)}
        </span>

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
  const [pickerOpen,  setPickerOpen]  = useState(false)
  const [preview,     setPreview]     = useState(false)
  const [device,      setDevice]      = useState<PreviewDevice>('desktop')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((b) => b.id === active.id)
      const newIndex = value.findIndex((b) => b.id === over.id)
      onChange(arrayMove(value, oldIndex, newIndex))
    }
  }

  const addBlock = useCallback((type: BlockType) => {
    const { defaultData } = BLOCK_DEF_MAP[type]
    onChange([
      ...value,
      { id: crypto.randomUUID(), type, data: { ...defaultData }, style: {} },
    ])
  }, [value, onChange])

  const updateBlock = useCallback((id: string, data: Record<string, unknown>) => {
    onChange(value.map((b) => b.id === id ? { ...b, data } : b))
  }, [value, onChange])

  const updateStyle = useCallback((id: string, style: BlockStyle) => {
    onChange(value.map((b) => b.id === id ? { ...b, style } : b))
  }, [value, onChange])

  const removeBlock = useCallback((id: string) => {
    onChange(value.filter((b) => b.id !== id))
  }, [value, onChange])

  const moveUp = useCallback((id: string) => {
    const i = value.findIndex((b) => b.id === id)
    if (i > 0) onChange(arrayMove(value, i, i - 1))
  }, [value, onChange])

  const moveDown = useCallback((id: string) => {
    const i = value.findIndex((b) => b.id === id)
    if (i < value.length - 1) onChange(arrayMove(value, i, i + 1))
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
          onClick={() => setPickerOpen(true)}
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
          onPick={addBlock}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
    </InnerBlockEditorCtx.Provider>
  )
}
