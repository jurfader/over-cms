'use client'

import { type Control, type UseFormWatch, type UseFormSetValue, type FieldErrors, type FieldValues, Controller } from 'react-hook-form'
import { ChevronDown, ChevronUp, Link2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldRenderer } from './field-renderer'
import { VersionHistory } from './version-history'
import { slugify } from '@/lib/utils'
import type { FieldDefinition, ContentStatus, ContentItem } from '@/types/content'
import { cn } from '@/lib/utils'

type FormValues = {
  title: string
  slug: string
  status: ContentStatus
  data: Record<string, unknown>
  seo?: { title?: string; description?: string; noIndex?: boolean; noFollow?: boolean }
}

interface EditorSidebarProps {
  control: Control<FormValues>
  watch: UseFormWatch<FormValues>
  setValue: UseFormSetValue<FormValues>
  errors: FieldErrors<FormValues>
  sidebarFields: FieldDefinition[]
  slugManual: boolean
  onSlugEdit: () => void
  typeSlug: string
  itemId?: string
  onRestore?: (item: ContentItem) => void
}

function SidebarSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)] transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  )
}

const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft',     label: 'Szkic'       },
  { value: 'published', label: 'Opublikowany' },
  { value: 'scheduled', label: 'Zaplanowany'  },
  { value: 'archived',  label: 'Archiwum'     },
]

export function EditorSidebar({
  control, watch, setValue, errors,
  sidebarFields, slugManual, onSlugEdit,
  typeSlug, itemId, onRestore,
}: EditorSidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-l border-[var(--color-border)] overflow-y-auto bg-[var(--glass-card-bg)] backdrop-filter backdrop-blur-sm">

      {/* ── Status ── */}
      <SidebarSection title="Status">
        <div className="space-y-1.5">
          <Label>Status wpisu</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Slug</Label>
            {!slugManual && (
              <button
                onClick={onSlugEdit}
                className="text-xs text-[var(--color-subtle)] hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors"
              >
                <Link2 className="w-3 h-3" />
                Edytuj
              </button>
            )}
          </div>
          <Controller
            control={control}
            name="slug"
            render={({ field }) => (
              <div className="relative">
                <Input
                  {...field}
                  onChange={(e) => {
                    onSlugEdit()
                    field.onChange(slugify(e.target.value) || e.target.value)
                  }}
                  placeholder="moj-wpis"
                  className={cn('font-mono text-xs pr-8', errors.slug && 'border-[var(--color-destructive)]')}
                />
                {slugManual && (
                  <button
                    onClick={() => {
                      const title = watch('title')
                      if (title) setValue('slug', slugify(title))
                    }}
                    title="Wygeneruj z tytułu"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          />
          {errors.slug && (
            <p className="text-xs text-[var(--color-destructive)]">{errors.slug.message}</p>
          )}
        </div>
      </SidebarSection>

      {/* ── Custom fields ── */}
      {sidebarFields.length > 0 && (
        <SidebarSection title="Pola">
          {sidebarFields.map((f) => (
            <FieldRenderer
              key={f.id}
              field={f}
              control={control as unknown as Control<FieldValues>}
              watch={watch as unknown as UseFormWatch<FieldValues>}
              setValue={setValue as unknown as UseFormSetValue<FieldValues>}
            />
          ))}
        </SidebarSection>
      )}

      {/* ── Historia wersji ── */}
      {itemId && onRestore && (
        <SidebarSection title="Historia wersji" defaultOpen={false}>
          <VersionHistory
            itemId={itemId}
            typeSlug={typeSlug}
            onRestore={onRestore}
          />
        </SidebarSection>
      )}

      {/* ── SEO ── */}
      <SidebarSection title="SEO" defaultOpen={false}>
        <div className="space-y-1.5">
          <Label>Meta tytuł</Label>
          <Controller
            control={control}
            name="seo.title"
            render={({ field }) => (
              <Input {...field} value={field.value ?? ''} placeholder="Tytuł strony w Google" />
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Meta opis</Label>
          <Controller
            control={control}
            name="seo.description"
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value ?? ''}
                placeholder="Opis strony (maks. 160 znaków)"
                rows={3}
              />
            )}
          />
        </div>
        <Controller
          control={control}
          name="seo.noIndex"
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <Label htmlFor="noindex" className="cursor-pointer">Ukryj przed Google</Label>
              <Switch
                id="noindex"
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </SidebarSection>
    </aside>
  )
}
