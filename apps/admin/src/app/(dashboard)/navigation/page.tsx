'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Plus, Trash2, ChevronDown, ChevronRight,
  Save, Loader2, ExternalLink, Link,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id:       string
  label:    string
  url:      string
  target:   '_self' | '_blank'
  children: NavItem[]
}

const MENUS = [
  { id: 'main',   label: 'Główne' },
  { id: 'footer', label: 'Stopka' },
  { id: 'mobile', label: 'Mobile' },
] as const

type MenuId = typeof MENUS[number]['id']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newItem(): NavItem {
  return { id: crypto.randomUUID(), label: '', url: '/', target: '_self', children: [] }
}

// ─── Child Item Row ───────────────────────────────────────────────────────────

interface ChildItemProps {
  item:     NavItem
  onChange: (updated: NavItem) => void
  onDelete: () => void
}

function ChildItemRow({ item, onChange, onDelete }: ChildItemProps) {
  return (
    <div className="flex items-center gap-2 pl-6 py-1.5 border-t border-[var(--color-border)]">
      <Link className="w-3.5 h-3.5 text-[var(--color-subtle)] shrink-0" />
      <Input
        value={item.label}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        placeholder="Etykieta"
        className="h-7 text-sm flex-1"
      />
      <Input
        value={item.url}
        onChange={(e) => onChange({ ...item, url: e.target.value })}
        placeholder="/podstrona"
        className="h-7 text-sm flex-1 font-mono"
      />
      <button onClick={onDelete} className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Sortable Item Row ────────────────────────────────────────────────────────

interface SortableItemProps {
  item:     NavItem
  onChange: (updated: NavItem) => void
  onDelete: () => void
}

function SortableItem({ item, onChange, onDelete }: SortableItemProps) {
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function updateChild(index: number, updated: NavItem) {
    const children = [...item.children]
    children[index] = updated
    onChange({ ...item, children })
  }

  function removeChild(index: number) {
    onChange({ ...item, children: item.children.filter((_, i) => i !== index) })
  }

  function addChild() {
    onChange({ ...item, children: [...item.children, newItem()] })
    setExpanded(true)
  }

  return (
    <div ref={setNodeRef} style={style} className="glass-card rounded-[var(--radius)] overflow-hidden mb-2">
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)] shrink-0 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Expand children */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)] shrink-0"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
          }
        </button>

        <Input
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
          placeholder="Etykieta (np. O nas)"
          className="h-8 text-sm flex-1"
        />

        <Input
          value={item.url}
          onChange={(e) => onChange({ ...item, url: e.target.value })}
          placeholder="/strona lub https://..."
          className="h-8 text-sm flex-1 font-mono"
        />

        {/* External link toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ExternalLink className="w-3.5 h-3.5 text-[var(--color-subtle)]" />
          <Switch
            checked={item.target === '_blank'}
            onCheckedChange={(v) => onChange({ ...item, target: v ? '_blank' : '_self' })}
          />
        </div>

        {/* Child count badge */}
        {item.children.length > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
            {item.children.length}
          </Badge>
        )}

        {/* Add child */}
        <button
          onClick={addChild}
          title="Dodaj pod-element"
          className="text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Children */}
      {expanded && item.children.length > 0 && (
        <div className="bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)]">
          {item.children.map((child, i) => (
            <ChildItemRow
              key={child.id}
              item={child}
              onChange={(u) => updateChild(i, u)}
              onDelete={() => removeChild(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Menu Editor ──────────────────────────────────────────────────────────────

interface MenuEditorProps {
  menuId: MenuId
}

function MenuEditor({ menuId }: MenuEditorProps) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['nav', menuId],
    queryFn: () => api.get<{ data: NavItem[] }>(`/api/settings/navigation/${menuId}`),
    select: (r) => (Array.isArray(r.data) ? r.data : []) as NavItem[],
  })

  const [items, setItems] = useState<NavItem[] | null>(null)
  const current = items ?? data ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const mutation = useMutation({
    mutationFn: (nav: NavItem[]) =>
      api.put<{ data: NavItem[] }>(`/api/settings/navigation/${menuId}`, nav),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nav', menuId] })
      setItems(null)
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = current.findIndex((i) => i.id === active.id)
    const newIndex = current.findIndex((i) => i.id === over.id)
    setItems(arrayMove(current, oldIndex, newIndex))
  }

  function updateItem(index: number, updated: NavItem) {
    const next = [...current]
    next[index] = updated
    setItems(next)
  }

  function removeItem(index: number) {
    setItems(current.filter((_, i) => i !== index))
  }

  function addItem() {
    setItems([...current, newItem()])
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Column headers */}
      <div className="grid grid-cols-[36px_36px_1fr_1fr_auto] gap-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">
        <span />
        <span />
        <span>Etykieta</span>
        <span>URL</span>
        <span className="pr-8">Nowe okno</span>
      </div>

      {/* DnD list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={current.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {current.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              onChange={(u) => updateItem(index, u)}
              onDelete={() => removeItem(index)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {current.length === 0 && (
        <div className="glass-card rounded-[var(--radius-lg)] py-12 text-center">
          <p className="text-sm text-[var(--color-subtle)]">Menu jest puste</p>
          <p className="text-xs text-[var(--color-subtle)] opacity-60 mt-1">Kliknij "Dodaj element" aby zacząć</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" />
          Dodaj element
        </Button>
        <Button
          size="sm"
          onClick={() => mutation.mutate(current)}
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Save className="w-3.5 h-3.5" />
          }
          Zapisz menu
        </Button>
        {mutation.isSuccess && (
          <span className="text-xs text-[var(--color-success)]">Zapisano</span>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NavigationPage() {
  const [activeMenu, setActiveMenu] = useState<MenuId>('main')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Nawigacja</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Buduj menu używane przez szablony frontendu
        </p>
      </div>

      {/* Menu selector */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        {MENUS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveMenu(id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeMenu === id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <MenuEditor key={activeMenu} menuId={activeMenu} />
    </div>
  )
}
