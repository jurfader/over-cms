'use client'

import { type Control, type UseFormWatch, type UseFormSetValue, type FieldValues, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CodeEditor } from './code-editor'
import { RichTextEditor } from './richtext-editor'
import { MediaPicker } from '@/components/media/media-picker'
import { BlockEditor } from '@/components/editor/block-editor'
import { api } from '@/lib/api'
import type { FieldDefinition, ContentItemWithAuthor } from '@/types/content'
import type { Block } from '@/components/editor/types'

interface FieldRendererProps {
  field: FieldDefinition
  control: Control<FieldValues>
  watch: UseFormWatch<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  /** Override the field path prefix (used by repeater for nested paths) */
  pathPrefix?: string
}

// ─── Relation Field ──────────────────────────────────────────────────────────

interface RelationFieldProps {
  field: FieldDefinition
  value: string
  onChange: (value: string) => void
}

function RelationField({ field, value, onChange }: RelationFieldProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['relation', field.relationTo],
    queryFn: () =>
      api.get<{ data: ContentItemWithAuthor[]; meta: Record<string, unknown> }>(
        `/api/content/${field.relationTo}?limit=100&status=published`,
      ),
    enabled: !!field.relationTo,
  })

  const items = data?.data ?? []

  return (
    <Select value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger id={field.id}>
        <SelectValue
          placeholder={
            isLoading
              ? 'Ładowanie...'
              : `Wybierz ${field.label.toLowerCase()}`
          }
        />
      </SelectTrigger>
      <SelectContent>
        {items.map(({ item }) => (
          <SelectItem key={item.id} value={item.id}>
            {item.title || item.slug}
          </SelectItem>
        ))}
        {!isLoading && items.length === 0 && (
          <div className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
            Brak elementów
          </div>
        )}
      </SelectContent>
    </Select>
  )
}

// ─── Repeater Field ──────────────────────────────────────────────────────────

interface RepeaterFieldProps {
  field: FieldDefinition
  value: Record<string, unknown>[]
  onChange: (value: Record<string, unknown>[]) => void
  control: Control<FieldValues>
  watch: UseFormWatch<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  parentPath: string
}

function RepeaterField({ field, value, onChange, control, watch, setValue, parentPath }: RepeaterFieldProps) {
  const entries = Array.isArray(value) ? value : []
  const subFields = field.fields ?? []

  const addEntry = () => {
    const blank: Record<string, unknown> = {}
    for (const sf of subFields) {
      blank[sf.name] = sf.defaultValue ?? (sf.type === 'boolean' ? false : '')
    }
    const next = [...entries, blank]
    onChange(next)
  }

  const removeEntry = (index: number) => {
    const next = entries.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {entries.map((_entry, index) => (
        <div
          key={index}
          className="relative rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] p-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
              {field.label} #{index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[var(--color-destructive)]"
              onClick={() => removeEntry(index)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {subFields.map((subField) => (
            <FieldRenderer
              key={subField.id}
              field={subField}
              control={control}
              watch={watch}
              setValue={setValue}
              pathPrefix={`${parentPath}.${index}`}
            />
          ))}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addEntry}
      >
        <Plus className="h-4 w-4 mr-1" />
        Dodaj {field.label.toLowerCase()}
      </Button>
    </div>
  )
}

// ─── Main FieldRenderer ─────────────────────────────────────────────────────

export function FieldRenderer({ field, control, watch, setValue, pathPrefix }: FieldRendererProps) {
  const fieldPath = pathPrefix ? `${pathPrefix}.${field.name}` : `data.${field.name}`

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.id} className="flex items-center gap-1.5">
        {field.label}
        {field.required && <span className="text-[var(--color-destructive)]">*</span>}
      </Label>

      <Controller
        control={control}
        name={fieldPath}
        render={({ field: formField }) => {
          const value = formField.value as string | number | boolean | string[] | undefined

          switch (field.type) {
            case 'text':
            case 'slug':
              return (
                <Input
                  id={field.id}
                  value={(value as string) ?? ''}
                  onChange={(e) => formField.onChange(e.target.value)}
                  placeholder={field.label}
                />
              )

            case 'textarea':
              return (
                <Textarea
                  id={field.id}
                  value={(value as string) ?? ''}
                  onChange={(e) => formField.onChange(e.target.value)}
                  placeholder={field.label}
                  rows={3}
                />
              )

            case 'number':
              return (
                <Input
                  id={field.id}
                  type="number"
                  value={(value as number) ?? ''}
                  onChange={(e) => formField.onChange(parseFloat(e.target.value) || 0)}
                  min={field.validation?.min}
                  max={field.validation?.max}
                />
              )

            case 'boolean':
              return (
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    id={field.id}
                    checked={!!(value as boolean)}
                    onCheckedChange={formField.onChange}
                  />
                  <span className="text-sm text-[var(--color-muted-foreground)]">
                    {value ? 'Tak' : 'Nie'}
                  </span>
                </div>
              )

            case 'date':
              return (
                <Input
                  id={field.id}
                  type="date"
                  value={(value as string) ?? ''}
                  onChange={(e) => formField.onChange(e.target.value)}
                />
              )

            case 'select':
              return (
                <Select
                  value={(value as string) ?? ''}
                  onValueChange={formField.onChange}
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue placeholder={`Wybierz ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )

            case 'relation':
              return (
                <RelationField
                  field={field}
                  value={(value as string) ?? ''}
                  onChange={formField.onChange}
                />
              )

            case 'repeater':
              return (
                <RepeaterField
                  field={field}
                  value={(formField.value as Record<string, unknown>[]) ?? []}
                  onChange={formField.onChange}
                  control={control}
                  watch={watch}
                  setValue={setValue}
                  parentPath={fieldPath}
                />
              )

            case 'color':
              return (
                <div className="flex items-center gap-3">
                  <input
                    id={field.id}
                    type="color"
                    value={(value as string) ?? '#E91E8C'}
                    onChange={(e) => formField.onChange(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-transparent p-1"
                  />
                  <Input
                    value={(value as string) ?? ''}
                    onChange={(e) => formField.onChange(e.target.value)}
                    placeholder="#000000"
                    className="font-mono"
                  />
                </div>
              )

            case 'json':
              return (
                <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--color-border-hover)]">
                  <CodeEditor
                    value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
                    onChange={formField.onChange}
                    language="json"
                    height="160px"
                  />
                </div>
              )

            case 'richtext':
              return (
                <RichTextEditor
                  value={(value as string) ?? ''}
                  onChange={formField.onChange}
                />
              )

            case 'image':
              return (
                <MediaPicker
                  value={(value as string) ?? ''}
                  onChange={formField.onChange}
                  accept="image"
                />
              )

            case 'file':
              return (
                <MediaPicker
                  value={(value as string) ?? ''}
                  onChange={formField.onChange}
                  accept="file"
                />
              )

            case 'blocks':
              return (
                <BlockEditor
                  value={(formField.value as Block[]) ?? []}
                  onChange={formField.onChange}
                />
              )

            default:
              return (
                <Input
                  value={(value as string) ?? ''}
                  onChange={(e) => formField.onChange(e.target.value)}
                />
              )
          }
        }}
      />
    </div>
  )
}
