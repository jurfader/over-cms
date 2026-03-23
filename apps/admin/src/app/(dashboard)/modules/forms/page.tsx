'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, ArrowLeft, Trash2, Loader2, FileText, GripVertical,
  Settings, Mail, Phone, Hash, AlignLeft, List, CheckSquare,
  Circle, Type, Pilcrow, Minus, ChevronDown, Eye, Send,
  User, Calendar, Save, Download,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api }      from '@/lib/api'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge }    from '@/components/ui/badge'
import { Switch }   from '@/components/ui/switch'
import { Label }    from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { FormFieldDef, FormFieldType, FormDefinition, FormSettings } from '@overcms/core'

// ─── Field palette config ──────────────────────────────────────────────────────

const FIELD_PALETTE: { type: FormFieldType; label: string; icon: React.ReactNode; group: string }[] = [
  { type: 'text',      label: 'Tekst',       icon: <Type className="w-4 h-4" />,       group: 'Pola' },
  { type: 'email',     label: 'Email',       icon: <Mail className="w-4 h-4" />,       group: 'Pola' },
  { type: 'phone',     label: 'Telefon',     icon: <Phone className="w-4 h-4" />,      group: 'Pola' },
  { type: 'number',    label: 'Liczba',      icon: <Hash className="w-4 h-4" />,       group: 'Pola' },
  { type: 'textarea',  label: 'Długi tekst', icon: <AlignLeft className="w-4 h-4" />,  group: 'Pola' },
  { type: 'select',    label: 'Lista',       icon: <List className="w-4 h-4" />,       group: 'Wybór' },
  { type: 'radio',     label: 'Radio',       icon: <Circle className="w-4 h-4" />,     group: 'Wybór' },
  { type: 'checkbox',  label: 'Checkbox',    icon: <CheckSquare className="w-4 h-4" />,group: 'Wybór' },
  { type: 'heading',   label: 'Nagłówek',    icon: <Type className="w-4 h-4" />,       group: 'Układ' },
  { type: 'paragraph', label: 'Paragraf',    icon: <Pilcrow className="w-4 h-4" />,    group: 'Układ' },
  { type: 'divider',   label: 'Separator',   icon: <Minus className="w-4 h-4" />,      group: 'Układ' },
]

const paletteGroups = ['Pola', 'Wybór', 'Układ']

function fieldIcon(type: FormFieldType) {
  return FIELD_PALETTE.find(p => p.type === type)?.icon ?? <Type className="w-4 h-4" />
}

function fieldLabel(type: FormFieldType) {
  return FIELD_PALETTE.find(p => p.type === type)?.label ?? type
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function makeField(type: FormFieldType): FormFieldDef {
  const name = `${type}_${generateId()}`
  return {
    id:    generateId(),
    type,
    label: fieldLabel(type),
    name,
    required: false,
    width: 'full',
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Submission {
  id:        string
  formId:    string
  name:      string | null
  email:     string | null
  data:      Record<string, unknown>
  ip:        string | null
  createdAt: string
}

// ─── Sortable field row ────────────────────────────────────────────────────────

function SortableField({
  field,
  selected,
  onSelect,
  onDelete,
}: {
  field:    FormFieldDef
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius)] border cursor-pointer transition-colors
        ${selected
          ? 'border-[var(--color-primary)] bg-[color-mix(in_oklch,var(--color-primary)_8%,transparent)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]'
        }`}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-[var(--color-subtle)] cursor-grab active:cursor-grabbing shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <span className="text-[var(--color-primary)] shrink-0">{fieldIcon(field.type)}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{field.label}</p>
        <p className="text-[11px] text-[var(--color-subtle)]">{fieldLabel(field.type)}</p>
      </div>

      {field.required && (
        <Badge variant="outline" className="text-[10px] shrink-0">Wymagane</Badge>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 shrink-0 text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Field properties panel ────────────────────────────────────────────────────

function FieldProperties({
  field,
  onChange,
}: {
  field:    FormFieldDef
  onChange: (f: FormFieldDef) => void
}) {
  const isLayout = field.type === 'heading' || field.type === 'paragraph' || field.type === 'divider'
  const hasOptions = field.type === 'select' || field.type === 'radio'

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-subtle)]">
        Właściwości pola
      </p>

      {/* Label */}
      <div className="space-y-1.5">
        <Label className="text-xs">Etykieta</Label>
        <Input
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          placeholder="Etykieta pola"
        />
      </div>

      {/* Name */}
      {!isLayout && (
        <div className="space-y-1.5">
          <Label className="text-xs">Nazwa (key)</Label>
          <Input
            value={field.name}
            onChange={(e) => onChange({ ...field, name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
            placeholder="nazwa_pola"
            className="font-mono text-xs"
          />
        </div>
      )}

      {/* Placeholder */}
      {!isLayout && field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'select' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder ?? ''}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value || undefined })}
            placeholder="Tekst pomocniczy..."
          />
        </div>
      )}

      {/* Width */}
      {!isLayout && (
        <div className="space-y-1.5">
          <Label className="text-xs">Szerokość</Label>
          <div className="flex gap-1">
            {(['full', 'half', 'third'] as const).map((w) => (
              <button
                key={w}
                onClick={() => onChange({ ...field, width: w })}
                className={`flex-1 py-1.5 text-xs rounded-[var(--radius-sm)] border transition-colors
                  ${field.width === w
                    ? 'border-[var(--color-primary)] bg-[color-mix(in_oklch,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
                  }`}
              >
                {w === 'full' ? 'Pełna' : w === 'half' ? '1/2' : '1/3'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Required */}
      {!isLayout && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Wymagane</Label>
          <Switch
            checked={!!field.required}
            onCheckedChange={(v) => onChange({ ...field, required: v })}
          />
        </div>
      )}

      {/* Options (select / radio) */}
      {hasOptions && (
        <div className="space-y-1.5">
          <Label className="text-xs">Opcje (każda w nowej linii)</Label>
          <Textarea
            value={(field.options ?? []).join('\n')}
            onChange={(e) => onChange({
              ...field,
              options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean),
            })}
            placeholder={'Opcja 1\nOpcja 2\nOpcja 3'}
            rows={4}
            className="text-xs font-mono"
          />
        </div>
      )}

      {/* Validation */}
      {(field.type === 'text' || field.type === 'textarea' || field.type === 'email') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Walidacja</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-[var(--color-subtle)]">Min. znaków</Label>
              <Input
                type="number"
                value={field.validation?.minLength ?? ''}
                onChange={(e) => onChange({ ...field, validation: { ...field.validation, minLength: e.target.value ? parseInt(e.target.value) : undefined } })}
                placeholder="0"
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] text-[var(--color-subtle)]">Max. znaków</Label>
              <Input
                type="number"
                value={field.validation?.maxLength ?? ''}
                onChange={(e) => onChange({ ...field, validation: { ...field.validation, maxLength: e.target.value ? parseInt(e.target.value) : undefined } })}
                placeholder="∞"
                className="text-xs mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {field.type === 'number' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Zakres</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-[var(--color-subtle)]">Min</Label>
              <Input
                type="number"
                value={field.validation?.min ?? ''}
                onChange={(e) => onChange({ ...field, validation: { ...field.validation, min: e.target.value ? parseInt(e.target.value) : undefined } })}
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] text-[var(--color-subtle)]">Max</Label>
              <Input
                type="number"
                value={field.validation?.max ?? ''}
                onChange={(e) => onChange({ ...field, validation: { ...field.validation, max: e.target.value ? parseInt(e.target.value) : undefined } })}
                className="text-xs mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Form settings panel ───────────────────────────────────────────────────────

function FormSettingsPanel({
  settings,
  onChange,
}: {
  settings: FormSettings
  onChange: (s: FormSettings) => void
}) {
  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-subtle)]">
        Ustawienia formularza
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Etykieta przycisku wysyłki</Label>
        <Input
          value={settings.submitLabel ?? ''}
          onChange={(e) => onChange({ ...settings, submitLabel: e.target.value || undefined })}
          placeholder="Wyślij"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Wiadomość po wysłaniu</Label>
        <Textarea
          value={settings.successMessage ?? ''}
          onChange={(e) => onChange({ ...settings, successMessage: e.target.value || undefined })}
          placeholder="Dziękujemy! Skontaktujemy się wkrótce."
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Przekierowanie po wysłaniu (URL)</Label>
        <Input
          value={settings.redirectUrl ?? ''}
          onChange={(e) => onChange({ ...settings, redirectUrl: e.target.value || undefined })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Powiadomienia email (każdy w nowej linii)</Label>
        <Textarea
          value={(settings.notifyEmails ?? []).join('\n')}
          onChange={(e) => onChange({
            ...settings,
            notifyEmails: e.target.value.split('\n').map(s => s.trim()).filter(Boolean),
          })}
          placeholder="admin@example.com"
          rows={3}
          className="text-xs font-mono"
        />
      </div>
    </div>
  )
}

// ─── Form Builder ──────────────────────────────────────────────────────────────

function FormBuilder({
  initial,
  onSave,
  onBack,
}: {
  initial:  FormDefinition | null
  onSave:   (data: { name: string; slug: string; fields: FormFieldDef[]; settings: FormSettings }) => Promise<unknown>
  onBack:   () => void
}) {
  const [name,     setName]     = useState(initial?.name     ?? '')
  const [slug,     setSlug]     = useState(initial?.slug     ?? '')
  const [fields,   setFields]   = useState<FormFieldDef[]>(initial?.fields ?? [])
  const [settings, setSettings] = useState<FormSettings>(initial?.settings ?? {})
  const [selected, setSelected] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<'field' | 'settings'>('field')
  const [saving,   setSaving]   = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const selectedField = fields.find(f => f.id === selected) ?? null

  function addField(type: FormFieldType) {
    const f = makeField(type)
    setFields(prev => [...prev, f])
    setSelected(f.id)
    setRightTab('field')
  }

  function updateField(updated: FormFieldDef) {
    setFields(prev => prev.map(f => f.id === updated.id ? updated : f))
  }

  function deleteField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id))
    if (selected === id) setSelected(null)
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (over && active.id !== over.id) {
      setFields(prev => {
        const oldIdx = prev.findIndex(f => f.id === active.id)
        const newIdx = prev.findIndex(f => f.id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  function autoSlug(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({ name, slug, fields, settings })
    } finally {
      setSaving(false)
    }
  }

  const activeField = activeId ? fields.find(f => f.id === activeId) : null

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--color-subtle)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Formularze
        </button>
        <span className="text-[var(--color-border)]">/</span>
        <div className="flex-1 flex items-center gap-3">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!initial) setSlug(autoSlug(e.target.value))
            }}
            placeholder="Nazwa formularza"
            className="max-w-xs font-semibold"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--color-subtle)]">slug:</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(autoSlug(e.target.value))}
              placeholder="nazwa-formularza"
              className="max-w-[180px] font-mono text-xs"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !name || !slug}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Zapisz
        </Button>
      </div>

      {/* Builder layout */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Left: field palette */}
        <div className="w-44 shrink-0 overflow-y-auto scrollbar-thin space-y-4">
          {paletteGroups.map(group => (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)] mb-1.5 px-1">
                {group}
              </p>
              <div className="space-y-1">
                {FIELD_PALETTE.filter(p => p.group === group).map(p => (
                  <button
                    key={p.type}
                    onClick={() => addField(p.type)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors text-left"
                  >
                    <span className="shrink-0">{p.icon}</span>
                    <span className="truncate">{p.label}</span>
                    <Plus className="w-3 h-3 ml-auto shrink-0 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Center: canvas */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
          {fields.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-subtle)]">
              <Plus className="w-6 h-6 mb-2" />
              <p className="text-sm">Dodaj pola z palety po lewej</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 group">
                  {fields.map(f => (
                    <SortableField
                      key={f.id}
                      field={f}
                      selected={selected === f.id}
                      onSelect={() => { setSelected(f.id); setRightTab('field') }}
                      onDelete={() => deleteField(f.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeField && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-primary)] bg-[var(--color-surface)] shadow-lg opacity-90">
                    <GripVertical className="w-4 h-4 text-[var(--color-subtle)]" />
                    <span className="text-[var(--color-primary)]">{fieldIcon(activeField.type)}</span>
                    <span className="text-sm font-medium">{activeField.label}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          {fields.length > 0 && (
            <button
              onClick={() => addField('text')}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-[var(--color-subtle)] border border-dashed border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Dodaj pole tekstowe
            </button>
          )}
        </div>

        {/* Right: properties */}
        <div className="w-64 shrink-0 border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden flex flex-col">
          <div className="flex border-b border-[var(--color-border)]">
            <button
              onClick={() => setRightTab('field')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors
                ${rightTab === 'field' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-subtle)]'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              Pole
            </button>
            <button
              onClick={() => setRightTab('settings')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors
                ${rightTab === 'settings' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-subtle)]'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Formularz
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {rightTab === 'field' ? (
              selectedField ? (
                <FieldProperties field={selectedField} onChange={updateField} />
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-[var(--color-subtle)]">
                  <Settings className="w-5 h-5 mb-1.5" />
                  <p className="text-xs">Wybierz pole aby edytować</p>
                </div>
              )
            ) : (
              <FormSettingsPanel settings={settings} onChange={setSettings} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Submissions tab ───────────────────────────────────────────────────────────

function SubmissionsTab({ formSlug }: { formSlug: string }) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['module-forms-submissions', formSlug],
    queryFn:  () => api.get<{ data: Submission[] }>(`/api/m/forms/submissions?formId=${formSlug}`),
    select:   (r) => r.data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/m/forms/submissions/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['module-forms-submissions', formSlug] }),
  })

  const submissions = data ?? []

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  function handleExport() {
    window.open(`${apiUrl}/api/m/forms/submissions/export?formId=${formSlug}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  if (!submissions.length) {
    return (
      <div className="glass-card rounded-[var(--radius-lg)] py-16 text-center">
        <Send className="w-8 h-8 text-[var(--color-subtle)] mx-auto mb-3" />
        <p className="text-sm text-[var(--color-subtle)]">Brak zgłoszeń dla tego formularza</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExport} className="text-xs gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Eksportuj CSV
        </Button>
      </div>
    <div className="glass-card rounded-[var(--radius-lg)] overflow-hidden">
      <div className="grid grid-cols-[1fr_160px_44px] px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Zgłoszenie</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Data</span>
        <span />
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {submissions.map((s) => {
          const date = new Date(s.createdAt).toLocaleDateString('pl-PL', { year: 'numeric', month: 'short', day: 'numeric' })
          const time = new Date(s.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
          return (
            <motion.div
              key={s.id}
              layout
              className="grid grid-cols-[1fr_160px_44px] items-center px-5 py-3.5 hover:bg-[var(--color-surface-elevated)] transition-colors group"
            >
              <div className="min-w-0 pr-4 space-y-0.5">
                {s.name && (
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <User className="w-3.5 h-3.5 text-[var(--color-subtle)]" />
                    {s.name}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-subtle)]">
                    <Mail className="w-3 h-3" />
                    <a href={`mailto:${s.email}`} className="hover:text-[var(--color-primary)] transition-colors truncate">
                      {s.email}
                    </a>
                  </div>
                )}
                {!s.name && !s.email && (
                  <span className="text-xs text-[var(--color-subtle)] italic">Anonim</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-subtle)]">
                <Calendar className="w-3 h-3" />
                <span>{date}<br /><span className="text-[11px] opacity-70">{time}</span></span>
              </div>
              <button
                disabled={deleteMutation.isPending}
                onClick={() => { if (confirm('Usunąć to zgłoszenie?')) deleteMutation.mutate(s.id) }}
                className="opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity text-[var(--color-subtle)] hover:text-[var(--color-destructive)]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
    </div>
  )
}

// ─── Form detail view (builder + submissions tabs) ────────────────────────────

function FormDetailView({
  form,
  onBack,
  onSaved,
}: {
  form:    FormDefinition
  onBack:  () => void
  onSaved: (updated: FormDefinition) => void
}) {
  const qc = useQueryClient()

  type FormInput = { name: string; slug: string; fields: FormFieldDef[]; settings: FormSettings }

  const updateMutation = useMutation({
    mutationFn: (data: FormInput) =>
      api.put<{ data: FormDefinition }>(`/api/m/forms/definitions/${form.id}`, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['module-forms-definitions'] })
      onSaved(res.data)
    },
  })

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Tabs defaultValue="builder" className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="builder">
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Kreator
            </TabsTrigger>
            <TabsTrigger value="submissions">
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Zgłoszenia
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="builder" className="flex-1 min-h-0 mt-0">
          <FormBuilder
            initial={form}
            onSave={(data) => updateMutation.mutateAsync(data)}
            onBack={onBack}
          />
        </TabsContent>

        <TabsContent value="submissions" className="flex-1 overflow-y-auto mt-0">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-[var(--color-subtle)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Formularze
            </button>
            <span className="text-[var(--color-border)]">/</span>
            <span className="text-sm font-medium">{form.name}</span>
          </div>
          <SubmissionsTab formSlug={form.slug} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── New form view ─────────────────────────────────────────────────────────────

function NewFormView({ onBack, onCreated }: { onBack: () => void; onCreated: (f: FormDefinition) => void }) {
  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; fields: FormFieldDef[]; settings: FormSettings }) =>
      api.post<{ data: FormDefinition }>('/api/m/forms/definitions', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['module-forms-definitions'] })
      onCreated(res.data)
    },
  })

  return (
    <div className="h-[calc(100vh-8rem)]">
      <FormBuilder
        initial={null}
        onSave={(data) => createMutation.mutateAsync(data)}
        onBack={onBack}
      />
    </div>
  )
}

// ─── Forms list ────────────────────────────────────────────────────────────────

function FormsList({
  onSelect,
  onCreate,
}: {
  onSelect: (f: FormDefinition) => void
  onCreate: () => void
}) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['module-forms-definitions'],
    queryFn:  () => api.get<{ data: FormDefinition[] }>('/api/m/forms/definitions'),
    select:   (r) => r.data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/m/forms/definitions/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['module-forms-definitions'] }),
  })

  const forms = data ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Formularze</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Twórz i zarządzaj formularzami kontaktowymi
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4" />
          Nowy formularz
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : forms.length === 0 ? (
        <div className="glass-card rounded-[var(--radius-lg)] py-20 text-center">
          <FileText className="w-10 h-10 text-[var(--color-subtle)] mx-auto mb-3" />
          <p className="font-medium mb-1">Brak formularzy</p>
          <p className="text-sm text-[var(--color-subtle)] mb-5">Utwórz swój pierwszy formularz kontaktowy</p>
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4" />
            Utwórz formularz
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => (
            <motion.div
              key={form.id}
              layout
              className="glass-card rounded-[var(--radius-lg)] px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-[var(--color-primary)] transition-colors group"
              onClick={() => onSelect(form)}
            >
              <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[color-mix(in_oklch,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-foreground)]">{form.name}</p>
                <p className="text-xs text-[var(--color-subtle)] font-mono">{form.slug}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {form.fields.length} {form.fields.length === 1 ? 'pole' : 'pól'}
              </Badge>
              <ChevronDown className="w-4 h-4 text-[var(--color-subtle)] -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Usunąć formularz "${form.name}"?`)) deleteMutation.mutate(form.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type View = { type: 'list' } | { type: 'new' } | { type: 'edit'; form: FormDefinition }

export default function FormsPage() {
  const [view, setView] = useState<View>({ type: 'list' })

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view.type === 'edit' ? view.form.id : view.type}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className="h-full"
      >
        {view.type === 'list' && (
          <FormsList
            onSelect={(form) => setView({ type: 'edit', form })}
            onCreate={() => setView({ type: 'new' })}
          />
        )}

        {view.type === 'new' && (
          <NewFormView
            onBack={() => setView({ type: 'list' })}
            onCreated={(form) => setView({ type: 'edit', form })}
          />
        )}

        {view.type === 'edit' && (
          <FormDetailView
            form={view.form}
            onBack={() => setView({ type: 'list' })}
            onSaved={(updated) => setView({ type: 'edit', form: updated })}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
