'use client'

import { type Control, type UseFormWatch, type UseFormSetValue, type FieldValues, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CodeEditor } from './code-editor'
import { MediaPicker } from '@/components/media/media-picker'
import type { FieldDefinition } from '@/types/content'

interface FieldRendererProps {
  field: FieldDefinition
  control: Control<FieldValues>
  watch: UseFormWatch<FieldValues>
  setValue: UseFormSetValue<FieldValues>
}

export function FieldRenderer({ field, control }: FieldRendererProps) {
  const fieldPath = `data.${field.name}` as const

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
                <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--color-border-hover)]">
                  <CodeEditor
                    value={(value as string) ?? ''}
                    onChange={formField.onChange}
                    language="html"
                    height="200px"
                  />
                </div>
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
