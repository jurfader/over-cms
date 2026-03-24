'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Save, Globe, EyeOff,
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditorSidebar } from '@/components/content/editor-sidebar'
import { BlockEditor } from '@/components/editor/block-editor'
// CodeEditor removed — HTML tab uses plain textarea for reliability
import type { Block } from '@/components/editor/types'

type EditorMode = 'blocks' | 'html'
import { api } from '@/lib/api'
import { slugify } from '@/lib/utils'
import type { ContentType, ContentItem } from '@/types/content'

// ─── Schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany'),
  slug: z.string().min(1, 'Slug jest wymagany').regex(/^[a-z0-9_-]+$/, 'Tylko małe litery, cyfry, _ i -'),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  data: z.record(z.string(), z.unknown()),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    noIndex: z.boolean().optional(),
    noFollow: z.boolean().optional(),
  }).optional(),
})

type FormValues = z.infer<typeof schema>

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ─── Props ──────────────────────────────────────────────────────────────────

interface PageEditorProps {
  contentType: ContentType
  item?: ContentItem
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PageEditor({ contentType, item }: PageEditorProps) {
  const router = useRouter()
  const qc = useQueryClient()

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [slugManual, setSlugManual] = useState(!!item)
  const [mode, setMode] = useState<EditorMode>(
    item?.data?.content ? 'html' : 'blocks'
  )

  // Sidebar fields: excerpt, featured_image, and any other non-body/non-blocks/non-slug fields
  const sidebarFields = contentType.fieldsSchema?.filter(
    (f) => f.type !== 'slug' && f.type !== 'blocks' && f.type !== 'richtext' && f.name !== 'content' && f.name !== 'body',
  ) ?? []

  // ── Form ────────────────────────────────────────────────────────────────

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: item?.title ?? '',
      slug: item?.slug ?? '',
      status: item?.status ?? 'draft',
      data: (item?.data as Record<string, unknown>) ?? {},
      seo: (item?.seo as FormValues['seo']) ?? {},
    },
  })

  const { watch, setValue, control, handleSubmit, formState: { errors } } = form

  const title = watch('title')
  const status = watch('status')

  // Auto-generate slug from title (only for new items)
  useEffect(() => {
    if (!slugManual && title) {
      setValue('slug', slugify(title))
    }
  }, [title, slugManual, setValue])

  // ── Mutations ───────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (values: FormValues): Promise<{ data: ContentItem }> => {
      if (item) {
        return api.put<{ data: ContentItem }>(`/api/content/page/${item.id}`, values)
      }
      return api.post<{ data: ContentItem }>('/api/content/page', values)
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: (res: { data: ContentItem }) => {
      setSaveStatus('saved')
      qc.invalidateQueries({ queryKey: ['content', 'page'] })
      qc.invalidateQueries({ queryKey: ['pages'] })
      setTimeout(() => setSaveStatus('idle'), 3000)
      if (!item) {
        router.replace(`/pages/${res.data.id}`)
      }
    },
    onError: () => {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 4000)
    },
  })

  const publishMutation = useMutation({
    mutationFn: async (values: FormValues): Promise<{ data: ContentItem }> => {
      if (item) {
        await api.put(`/api/content/page/${item.id}`, values)
        return api.post<{ data: ContentItem }>(`/api/content/page/${item.id}/publish`)
      }
      const res = await api.post<{ data: ContentItem }>('/api/content/page', {
        ...values,
        status: 'published',
      })
      return res
    },
    onSuccess: () => {
      setValue('status', 'published')
      setSaveStatus('saved')
      qc.invalidateQueries({ queryKey: ['content', 'page'] })
      qc.invalidateQueries({ queryKey: ['pages'] })
      setTimeout(() => setSaveStatus('idle'), 3000)
    },
    onError: () => setSaveStatus('error'),
  })

  function onSave(values: FormValues) {
    saveMutation.mutate(values)
  }

  function onPublish() {
    handleSubmit((values) => publishMutation.mutate(values))()
  }

  const isBusy = saveMutation.isPending || publishMutation.isPending

  // ── Auto-save every 30s (only for existing drafts) ──────────────────────

  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!item) return
    autoSaveRef.current = setInterval(() => {
      const values = form.getValues()
      if (values.status === 'published') return
      saveMutation.mutate(values)
    }, 30_000)
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, [item?.id]) // auto-save setup depends only on item identity

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-var(--topbar-height))] -mt-6 -mx-6">

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--color-border)] bg-[var(--glass-card-bg)] backdrop-filter backdrop-blur-sm shrink-0">
        {/* Back */}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/pages">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>

        {/* Title */}
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <input
              {...field}
              placeholder="Tytuł strony..."
              className="flex-1 bg-transparent text-lg font-semibold text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)] focus:outline-none min-w-0"
            />
          )}
        />

        {/* Status badge */}
        <Badge
          variant={status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'outline'}
          className="shrink-0"
        >
          {status === 'published' ? 'Opublikowany' : status === 'draft' ? 'Szkic' : status}
        </Badge>

        {/* Save status */}
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-subtle)] shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Zapisywanie...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Zapisano
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-destructive)] shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
            Blad zapisu
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleSubmit(onSave)} disabled={isBusy}>
            <Save className="w-3.5 h-3.5" />
            Zapisz
          </Button>
          {status === 'published' ? (
            <Button variant="outline" size="sm" onClick={onPublish} disabled={isBusy}>
              <EyeOff className="w-3.5 h-3.5" />
              Cofnij do szkicu
            </Button>
          ) : (
            <Button size="sm" onClick={onPublish} disabled={isBusy}>
              <Globe className="w-3.5 h-3.5" />
              Opublikuj
            </Button>
          )}
        </div>
      </div>

      {/* Visual Builder link */}
      {item?.id && (
        <div className="flex items-center justify-center px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <Link
            href={`/pages/${item.id}/visual-builder`}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all duration-200"
          >
            <Globe className="w-5 h-5" />
            Otwórz Visual Builder
          </Link>
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setMode('blocks')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === 'blocks'
                  ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              Bloki
            </button>
            <button
              type="button"
              onClick={() => setMode('html')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === 'html'
                  ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              HTML
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {mode === 'blocks' ? (
              <Controller
                control={control}
                name="data.blocks"
                render={({ field }) => (
                  <div className="h-full overflow-y-auto p-4 scrollbar-thin">
                    <BlockEditor
                      value={(field.value as Block[]) ?? []}
                      onChange={field.onChange}
                    />
                  </div>
                )}
              />
            ) : (
              <Controller
                control={control}
                name="data.content"
                render={({ field }) => (
                  <textarea
                    value={(field.value as string) ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full h-full p-4 bg-[var(--color-surface)] text-[var(--color-foreground)] font-mono text-sm border-0 outline-none resize-none scrollbar-thin"
                    placeholder="Wpisz kod HTML..."
                    spellCheck={false}
                  />
                )}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <EditorSidebar
          control={control}
          watch={watch}
          setValue={setValue}
          errors={errors}
          sidebarFields={sidebarFields}
          slugManual={slugManual}
          onSlugEdit={() => setSlugManual(true)}
          typeSlug="page"
          itemId={item?.id}
          onRestore={(restored) => {
            form.reset({
              title:  restored.title,
              slug:   restored.slug,
              status: restored.status as FormValues['status'],
              data:   restored.data as FormValues['data'],
              seo:    (restored.seo ?? {}) as FormValues['seo'],
            })
          }}
        />
      </div>
    </div>
  )
}
