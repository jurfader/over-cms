'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus, Search, ChevronLeft, ChevronRight, Globe, FileText, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { formatDate, slugify } from '@/lib/utils'
import type { ContentItemWithAuthor, ContentStatus } from '@/types/content'

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ContentStatus, { label: string; variant: 'success' | 'warning' | 'default' | 'outline' }> = {
  published: { label: 'Opublikowany', variant: 'success' },
  draft:     { label: 'Szkic',        variant: 'warning'  },
  scheduled: { label: 'Zaplanowany',  variant: 'default'  },
  archived:  { label: 'Archiwum',     variant: 'outline'  },
}

const STATUS_FILTERS = [
  { value: '',          label: 'Wszystkie'   },
  { value: 'draft',     label: 'Szkic'       },
  { value: 'published', label: 'Opublikowany'},
  { value: 'scheduled', label: 'Zaplanowany' },
  { value: 'archived',  label: 'Archiwum'    },
] as const

interface ItemsResponse {
  data: ContentItemWithAuthor[]
  meta: { total: number; page: number; limit: number; pages: number }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PagesListPage() {
  const router = useRouter()
  const [page,            setPage]            = useState(1)
  const [search,          setSearch]          = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter,    setStatusFilter]    = useState<ContentStatus | ''>('')

  // ── Add-page dialog ───────────────────────────────────────────────────

  const [dialogOpen,   setDialogOpen]   = useState(false)
  const [newTitle,     setNewTitle]     = useState('')
  const [newSlug,      setNewSlug]      = useState('')
  const [slugTouched,  setSlugTouched]  = useState(false)
  const [isCreating,   setIsCreating]   = useState(false)
  const [createError,  setCreateError]  = useState('')

  function handleTitleChange(value: string) {
    setNewTitle(value)
    if (!slugTouched) setNewSlug(slugify(value))
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setNewSlug(value)
  }

  function resetDialog() {
    setNewTitle('')
    setNewSlug('')
    setSlugTouched(false)
    setIsCreating(false)
    setCreateError('')
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setIsCreating(true)
    setCreateError('')
    try {
      const res = await api.post<{ data?: { id: string }; id?: string }>(
        '/api/content/page',
        { title: newTitle.trim(), slug: newSlug || slugify(newTitle), data: {}, status: 'draft' },
      )
      const id = res.data?.id ?? res.id
      if (!id) throw new Error('Brak ID nowej strony')
      setDialogOpen(false)
      resetDialog()
      router.push(`/pages/${id}`)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Nie udało się utworzyć strony')
      setIsCreating(false)
    }
  }

  // ── Debounced search ────────────────────────────────────────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // ── Data ────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['pages', page, statusFilter, debouncedSearch],
    queryFn:  () =>
      api.get<ItemsResponse>(
        `/api/content/page?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`,
      ),
  })

  const items = data?.data ?? []
  const meta  = data?.meta

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center">
            <Globe className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--color-foreground)]">Strony</h1>
              {meta && <Badge variant="outline" className="text-xs">{meta.total}</Badge>}
            </div>
            <p className="text-xs text-[var(--color-subtle)]">Zarządzaj stronami witryny</p>
          </div>
        </div>
        <Button onClick={() => { resetDialog(); setDialogOpen(true) }}>
          <Plus className="w-4 h-4" />
          Nowa strona
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-subtle)]" />
          <Input
            placeholder="Szukaj stron..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value as ContentStatus | ''); setPage(1) }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s.value
                  ? 'gradient-bg text-white'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-[var(--radius-lg)] overflow-hidden p-0"
      >
        {isLoading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="h-4 w-48 rounded animate-shimmer" />
                <div className="h-4 w-20 rounded animate-shimmer ml-auto" />
                <div className="h-4 w-24 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--color-subtle)] opacity-40" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {debouncedSearch || statusFilter ? 'Nie znaleziono stron' : 'Brak stron'}
            </p>
            {!debouncedSearch && !statusFilter && (
              <Button className="mt-4" size="sm" onClick={() => { resetDialog(); setDialogOpen(true) }}>
                <Plus className="w-4 h-4" />
                Dodaj pierwszą stronę
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_140px] px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
              <span className="text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide">
                Tytuł
              </span>
              <span className="text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide">
                Status
              </span>
              <span className="text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide">
                Zaktualizowany
              </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--color-border)]">
              {items.map((row, index) => {
                const { item } = row
                const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Link
                      href={`/pages/${item.id}`}
                      className="grid grid-cols-[1fr_120px_140px] items-center px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-elevated)] group"
                    >
                      {/* Title */}
                      <div className="min-w-0 pr-4">
                        <span className="font-medium text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors truncate block">
                          {item.title}
                        </span>
                        <span className="text-xs text-[var(--color-subtle)] font-mono truncate block">
                          /{item.slug}
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </div>

                      {/* Updated At */}
                      <span className="text-xs text-[var(--color-subtle)]">
                        {formatDate(item.updatedAt)}
                      </span>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {meta && meta.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                <span className="text-xs text-[var(--color-subtle)]">
                  {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} z {meta.total}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs px-2 text-[var(--color-muted-foreground)]">
                    {page} / {meta.pages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page >= meta.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ── Add-page dialog ──────────────────────────────────────────────── */}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetDialog() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj nową stronę</DialogTitle>
            <DialogDescription>
              Podaj tytuł i slug, aby utworzyć nową stronę jako szkic.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => { e.preventDefault(); handleCreate() }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="new-page-title">Tytuł strony</Label>
              <Input
                id="new-page-title"
                placeholder="np. O nas"
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-page-slug">Slug</Label>
              <Input
                id="new-page-slug"
                placeholder="np. o-nas"
                value={newSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
              <p className="text-xs text-[var(--color-subtle)]">
                Adres URL strony &mdash; generowany automatycznie z tytułu.
              </p>
            </div>

            {createError && (
              <p className="text-sm text-[var(--color-destructive)]">{createError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isCreating}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isCreating || !newTitle.trim()}>
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Utwórz
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
