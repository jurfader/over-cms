'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Plus, Trash2, GripVertical, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { slugify } from '@/lib/utils'
import { api } from '@/lib/api'
import type { ContentType, FieldType } from '@/types/content'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',      label: 'Tekst'         },
  { value: 'textarea',  label: 'Długi tekst'   },
  { value: 'richtext',  label: 'Rich text'     },
  { value: 'number',    label: 'Liczba'        },
  { value: 'boolean',   label: 'Tak/Nie'       },
  { value: 'date',      label: 'Data'          },
  { value: 'select',    label: 'Lista wyboru'  },
  { value: 'image',     label: 'Obraz'         },
  { value: 'file',      label: 'Plik'          },
  { value: 'color',     label: 'Kolor'         },
  { value: 'json',      label: 'JSON'          },
  { value: 'slug',      label: 'Slug'          },
]

const fieldSchema = z.object({
  id:       z.string(),
  name:     z.string().min(1, 'Wymagane'),
  label:    z.string().min(1, 'Wymagane'),
  type:     z.enum(['text', 'textarea', 'richtext', 'number', 'boolean', 'date', 'image', 'file', 'relation', 'repeater', 'select', 'slug', 'color', 'json']),
  required: z.boolean(),
})

const formSchema = z.object({
  name:         z.string().min(1, 'Nazwa jest wymagana'),
  slug:         z.string().min(1, 'Slug jest wymagany').regex(/^[a-z0-9_-]+$/, 'Tylko małe litery, cyfry, _ i -'),
  icon:         z.string().optional(),
  isSingleton:  z.boolean(),
  fieldsSchema: z.array(fieldSchema),
})

type FormValues = z.infer<typeof formSchema>

interface ContentTypeEditorProps {
  type?: ContentType
}

export function ContentTypeEditor({ type }: ContentTypeEditorProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const isNew = !type

  const [slugManual, setSlugManual] = useState(!isNew)

  const { control, watch, setValue, handleSubmit, register, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name:         type?.name ?? '',
      slug:         type?.slug ?? '',
      icon:         type?.icon ?? '',
      isSingleton:  type?.isSingleton ?? false,
      fieldsSchema: (type?.fieldsSchema as FormValues['fieldsSchema']) ?? [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'fieldsSchema' })
  const name = watch('name')

  useEffect(() => {
    if (!slugManual && name) setValue('slug', slugify(name))
  }, [name, slugManual, setValue])

  const mutation = useMutation({
    mutationFn: (values: FormValues): Promise<{ data: ContentType }> => {
      if (type) {
        return api.put<{ data: ContentType }>(`/api/content-types/${type.id}`, values)
      }
      return api.post<{ data: ContentType }>('/api/content-types', values)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-types'] })
      router.push('/content')
    },
  })

  function addField() {
    append({ id: crypto.randomUUID(), name: '', label: '', type: 'text', required: false })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/content"><ChevronLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold text-[var(--color-foreground)] flex-1">
          {isNew ? 'Nowy typ treści' : `Edytuj: ${type.name}`}
        </h1>
        <Button onClick={handleSubmit((v) => mutation.mutate(v))} disabled={mutation.isPending}>
          {mutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          Zapisz
        </Button>
      </div>

      {/* Basic info */}
      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Podstawowe</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nazwa</Label>
            <Input {...register('name')} placeholder="Wpisy bloga" />
            {errors.name && <p className="text-xs text-[var(--color-destructive)]">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              {...register('slug')}
              onChange={(e) => { setSlugManual(true); setValue('slug', e.target.value) }}
              placeholder="post"
              className="font-mono"
              readOnly={!isNew}
            />
            {errors.slug && <p className="text-xs text-[var(--color-destructive)]">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Ikona <span className="text-[var(--color-subtle)] font-normal">(nazwa Lucide)</span></Label>
          <Input {...register('icon')} placeholder="FileText" className="max-w-xs" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <Label>Singleton</Label>
            <p className="text-xs text-[var(--color-subtle)] mt-0.5">Jeden wpis zamiast listy</p>
          </div>
          <Controller
            control={control}
            name="isSingleton"
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="glass-card rounded-[var(--radius-lg)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Pola <span className="text-[var(--color-subtle)] font-normal ml-1">({fields.length})</span>
          </h2>
          <Button size="sm" variant="outline" onClick={addField}>
            <Plus className="w-3.5 h-3.5" />
            Dodaj pole
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-[var(--color-subtle)]">Brak pól</p>
            <p className="text-xs text-[var(--color-subtle)] opacity-60 mt-1">Kliknij "Dodaj pole" aby zacząć</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[20px_1fr_1fr_148px_60px_32px] gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
              <span />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Etykieta</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Nazwa pola</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Typ</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Wym.</span>
              <span />
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[20px_1fr_1fr_148px_60px_32px] items-center gap-3 px-4 py-2.5">
                  <GripVertical className="w-4 h-4 text-[var(--color-subtle)] cursor-grab" />

                  <Input
                    {...register(`fieldsSchema.${index}.label`)}
                    placeholder="np. Tytuł"
                    className="h-8 text-sm"
                  />

                  <Input
                    {...register(`fieldsSchema.${index}.name`)}
                    placeholder="np. title"
                    className="h-8 text-sm font-mono"
                  />

                  <Controller
                    control={control}
                    name={`fieldsSchema.${index}.type`}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  <div className="flex justify-center">
                    <Controller
                      control={control}
                      name={`fieldsSchema.${index}.required`}
                      render={({ field: f }) => (
                        <Switch checked={f.value} onCheckedChange={f.onChange} />
                      )}
                    />
                  </div>

                  <button
                    onClick={() => remove(index)}
                    className="text-[var(--color-subtle)] hover:text-[var(--color-destructive)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Error feedback */}
      {mutation.isError && (
        <p className="text-sm text-[var(--color-destructive)]">
          Wystąpił błąd podczas zapisywania. Spróbuj ponownie.
        </p>
      )}
    </div>
  )
}
