'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Save, Globe, EyeOff, Code2, Blocks,
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeEditor, type CodeLanguage } from './code-editor'
import { EditorSidebar } from './editor-sidebar'
import { api } from '@/lib/api'
import { slugify } from '@/lib/utils'
import type { ContentType, ContentItem } from '@/types/content'

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

type EditorMode = 'code' | 'blocks'
const CODE_LANGS: { value: CodeLanguage; label: string }[] = [
  { value: 'html',       label: 'HTML'     },
  { value: 'markdown',   label: 'Markdown' },
  { value: 'json',       label: 'JSON'     },
  { value: 'css',        label: 'CSS'      },
  { value: 'typescript', label: 'TSX'      },
]

interface ContentEditorProps {
  contentType: ContentType
  item?: ContentItem
  typeSlug: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function ContentEditor({ contentType, item, typeSlug }: ContentEditorProps) {
  const router = useRouter()
  const qc = useQueryClient()

  const [mode, setMode] = useState<EditorMode>('code')
  const [lang, setLang] = useState<CodeLanguage>('html')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [slugManual, setSlugManual] = useState(!!item)

  // Wyciągnij główne pole treści (richtext/html)
  const bodyField = contentType.fieldsSchema?.find(
    (f) => f.type === 'richtext' || f.name === 'content' || f.name === 'body',
  )
  const bodyFieldName = bodyField?.name ?? 'content'

  // Pola boczne (wszystko poza body/richtext i slug)
  const sidebarFields = contentType.fieldsSchema?.filter(
    (f) => f.name !== bodyFieldName && f.type !== 'slug',
  ) ?? []

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
  const currentData = watch('data')

  // Auto-generuj slug z tytułu
  useEffect(() => {
    if (!slugManual && title) {
      setValue('slug', slugify(title))
    }
  }, [title, slugManual, setValue])

  // Wartość edytora kodu (główne pole treści)
  const codeValue = (currentData[bodyFieldName] as string) ?? ''

  const setCodeValue = useCallback((val: string) => {
    setValue('data', { ...currentData, [bodyFieldName]: val })
  }, [currentData, bodyFieldName, setValue])

  const saveMutation = useMutation({
    mutationFn: (values: FormValues): Promise<{ data: ContentItem }> => {
      if (item) {
        return api.put<{ data: ContentItem }>(`/api/content/${typeSlug}/${item.id}`, values)
      }
      return api.post<{ data: ContentItem }>(`/api/content/${typeSlug}`, values)
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: (res: { data: ContentItem }) => {
      setSaveStatus('saved')
      qc.invalidateQueries({ queryKey: ['content', typeSlug] })
      setTimeout(() => setSaveStatus('idle'), 3000)
      if (!item) {
        router.replace(`/content/${typeSlug}/${res.data.id}`)
      }
    },
    onError: () => {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 4000)
    },
  })

  const publishMutation = useMutation({
    mutationFn: async (values: FormValues): Promise<{ data: ContentItem }> => {
      // Najpierw zapisz, potem opublikuj
      if (item) {
        await api.put(`/api/content/${typeSlug}/${item.id}`, values)
        return api.post<{ data: ContentItem }>(`/api/content/${typeSlug}/${item.id}/publish`)
      }
      const res = await api.post<{ data: ContentItem }>(`/api/content/${typeSlug}`, {
        ...values, status: 'published',
      })
      return res
    },
    onSuccess: () => {
      setValue('status', 'published')
      setSaveStatus('saved')
      qc.invalidateQueries({ queryKey: ['content', typeSlug] })
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

  return (
    <div className="flex flex-col h-[calc(100vh-var(--topbar-height))] -mt-6 -mx-6">

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--color-border)] bg-[var(--glass-card-bg)] backdrop-filter backdrop-blur-sm shrink-0">
        {/* Back */}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/content/${typeSlug}`}>
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
              placeholder={`Tytuł ${contentType.name.toLowerCase()}...`}
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
            Błąd zapisu
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

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Editor mode switcher */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] shrink-0">
            <Tabs value={mode} onValueChange={(v) => setMode(v as EditorMode)}>
              <TabsList className="h-7">
                <TabsTrigger value="code" className="gap-1.5 text-xs py-1">
                  <Code2 className="w-3 h-3" />
                  Kod
                </TabsTrigger>
                <TabsTrigger value="blocks" className="gap-1.5 text-xs py-1">
                  <Blocks className="w-3 h-3" />
                  Bloki
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === 'code' && (
              <div className="flex items-center gap-1 ml-2">
                {CODE_LANGS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLang(l.value)}
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                      lang === l.value
                        ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                        : 'text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editor content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {mode === 'code' ? (
              <CodeEditor
                value={codeValue}
                onChange={setCodeValue}
                language={lang}
                height="100%"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--color-subtle)]">
                <div className="text-center">
                  <Blocks className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Edytor bloków — wkrótce</p>
                  <p className="text-xs mt-1 opacity-60">Użyj trybu Kod do edycji treści</p>
                </div>
              </div>
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
          typeSlug={typeSlug}
        />
      </div>
    </div>
  )
}
