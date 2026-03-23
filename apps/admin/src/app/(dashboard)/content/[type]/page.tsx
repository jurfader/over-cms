'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, ChevronLeft, ChevronRight, Pencil,
  Trash2, Globe, FileText, MoreHorizontal, EyeOff,
  CheckSquare, Square, X, Archive, Eye, ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { ContentType, ContentItemWithAuthor, ContentStatus } from '@/types/content'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ContentStatus, { label: string; variant: 'success' | 'warning' | 'default' | 'outline' }> = {
  published: { label: 'Opublikowany', variant: 'success' },
  draft:     { label: 'Szkic',        variant: 'warning'  },
  scheduled: { label: 'Zaplanowany',  variant: 'default'  },
  archived:  { label: 'Archiwum',     variant: 'outline'  },
}

interface ItemsResponse {
  data: ContentItemWithAuthor[]
  meta: { total: number; page: number; limit: number; pages: number }
}

type SortField = 'updatedAt' | 'title' | 'status'
type SortDir   = 'asc' | 'desc'

// ─── Quick Preview Panel ──────────────────────────────────────────────────────

function QuickPreview({ row, typeSlug: _typeSlug, onClose, onEdit }: {
  row:      ContentItemWithAuthor
  typeSlug: string
  onClose:  () => void
  onEdit:   () => void
}) {
  const { item, author } = row
  const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft
  const dataEntries = Object.entries(item.data as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string' && v.length > 0)
    .slice(0, 5)

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 right-0 z-40 w-[400px] bg-[var(--color-background)] border-l border-[var(--color-border)] shadow-2xl flex flex-col"
      style={{ top: 'var(--topbar-height)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate text-[var(--color-foreground)]">{item.title}</h3>
          <p className="text-xs text-[var(--color-subtle)] font-mono mt-0.5">/{item.slug}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-[var(--color-surface-elevated)] text-[var(--color-subtle)] hover:text-[var(--color-foreground)] transition-colors ml-3 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Status + meta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-subtle)]">Status</span>
            <Badge variant={sc.variant}>{sc.label}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-subtle)]">Autor</span>
            <span className="text-xs text-[var(--color-muted-foreground)]">{author?.name ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-subtle)]">Zaktualizowany</span>
            <span className="text-xs text-[var(--color-muted-foreground)]">{formatDate(item.updatedAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-subtle)]">Utworzony</span>
            <span className="text-xs text-[var(--color-muted-foreground)]">{formatDate(item.createdAt)}</span>
          </div>
        </div>

        {/* SEO */}
        {item.seo && (Object.values(item.seo as Record<string, unknown>).some(Boolean)) && (
          <div className="space-y-2 pt-3 border-t border-[var(--color-border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-subtle)]">SEO</p>
            {(item.seo as { title?: string; description?: string }).title && (
              <p className="text-xs"><span className="text-[var(--color-subtle)]">Tytuł: </span>{(item.seo as { title: string }).title}</p>
            )}
            {(item.seo as { description?: string }).description && (
              <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">{(item.seo as { description: string }).description}</p>
            )}
          </div>
        )}

        {/* Data fields preview */}
        {dataEntries.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[var(--color-border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-subtle)]">Pola</p>
            {dataEntries.map(([key, val]) => (
              <div key={key} className="space-y-0.5">
                <p className="text-[10px] font-mono text-[var(--color-subtle)] uppercase">{key}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">{String(val)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-5 py-4 border-t border-[var(--color-border)] flex gap-2">
        <Button size="sm" className="flex-1" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5" />
          Edytuj
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>
          Zamknij
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkBar({ count, onPublish, onArchive, onDelete, onClear, loading }: {
  count:     number
  onPublish: () => void
  onArchive: () => void
  onDelete:  () => void
  onClear:   () => void
  loading:   boolean
}) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      exit={{ y: 80,    opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--color-foreground)] text-[var(--color-background)] shadow-2xl"
    >
      <span className="text-sm font-semibold shrink-0">{count} zaznaczonych</span>
      <div className="w-px h-5 bg-white/20" />
      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 hover:text-white" onClick={onPublish} disabled={loading}>
        <Globe className="w-3.5 h-3.5" />
        Opublikuj
      </Button>
      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 hover:text-white" onClick={onArchive} disabled={loading}>
        <Archive className="w-3.5 h-3.5" />
        Archiwizuj
      </Button>
      <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/20 hover:text-red-300" onClick={onDelete} disabled={loading}>
        <Trash2 className="w-3.5 h-3.5" />
        Usuń
      </Button>
      <div className="w-px h-5 bg-white/20" />
      <button onClick={onClear} className="text-white/60 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentTypePage() {
  const { type } = useParams<{ type: string }>()
  const router   = useRouter()
  const qc       = useQueryClient()

  const [page,            setPage]            = useState(1)
  const [search,          setSearch]          = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter,    setStatusFilter]    = useState<ContentStatus | ''>('')
  const [sortField,    setSortField]    = useState<SortField>('updatedAt')
  const [sortDir,      setSortDir]      = useState<SortDir>('desc')
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [preview,      setPreview]      = useState<ContentItemWithAuthor | null>(null)
  const [bulkLoading,  setBulkLoading]  = useState(false)

  // ── Debounced search ─────────────────────────────────────────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: typeData } = useQuery({
    queryKey: ['content-types'],
    queryFn:  () => api.get<{ data: ContentType[] }>('/api/content-types'),
    select:   (res) => res.data.find((t) => t.slug === type),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['content', type, page, statusFilter, sortField, sortDir, debouncedSearch],
    queryFn:  () =>
      api.get<ItemsResponse>(
        `/api/content/${type}?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}&sort=${sortField}&dir=${sortDir}`,
      ),
  })

  // ── Mutations ─────────────────────────────────────────────────────────────

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/content/${type}/${id}/publish`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['content', type] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/content/${type}/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['content', type] }),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/content/${type}/${id}`, { status: 'archived' }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['content', type] }),
  })

  // ── Selection ──────────────────────────────────────────────────────────────

  const items   = data?.data ?? []
  const meta    = data?.meta

  const allSelected  = items.length > 0 && items.every((r) => selected.has(r.item.id))
  const someSelected = items.some((r) => selected.has(r.item.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((r) => r.item.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────

  const bulkAction = useCallback(async (action: 'publish' | 'archive' | 'delete') => {
    const ids = [...selected]
    if (!ids.length) return
    if (action === 'delete' && !confirm(`Usunąć ${ids.length} wpisów?`)) return

    setBulkLoading(true)
    try {
      await Promise.all(ids.map((id) => {
        if (action === 'publish') return publishMutation.mutateAsync(id)
        if (action === 'archive') return archiveMutation.mutateAsync(id)
        return deleteMutation.mutateAsync(id)
      }))
      setSelected(new Set())
    } finally {
      setBulkLoading(false)
    }
  }, [selected, publishMutation, archiveMutation, deleteMutation])

  // ── Sort toggle ────────────────────────────────────────────────────────────

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1" />
    return <ArrowUpDown className={`w-3 h-3 ml-1 text-[var(--color-primary)] ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/content"><ChevronLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">{typeData?.name ?? type}</h1>
            {meta && <Badge variant="outline" className="text-xs">{meta.total}</Badge>}
          </div>
          <p className="text-xs text-[var(--color-subtle)] font-mono">/{type}</p>
        </div>
        <Button asChild>
          <Link href={`/content/${type}/new`}>
            <Plus className="w-4 h-4" />
            Nowy wpis
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-subtle)]" />
          <Input
            placeholder="Szukaj..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['', 'draft', 'published', 'scheduled', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); setSelected(new Set()) }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'gradient-bg text-white'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {s === '' ? 'Wszystkie' : STATUS_CONFIG[s as ContentStatus]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-[var(--radius-lg)] overflow-hidden p-0">
        {isLoading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="h-4 w-4 rounded animate-shimmer" />
                <div className="h-4 w-48 rounded animate-shimmer" />
                <div className="h-4 w-20 rounded animate-shimmer ml-auto" />
                <div className="h-4 w-24 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--color-subtle)] opacity-40" />
            <p className="text-sm text-[var(--color-muted-foreground)]">Brak wpisów</p>
            <Button className="mt-4" size="sm" asChild>
              <Link href={`/content/${type}/new`}>
                <Plus className="w-4 h-4" />
                Dodaj pierwszy wpis
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[36px_1fr_120px_140px_120px_80px] px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
              {/* Select all */}
              <button onClick={toggleAll} className="flex items-center justify-center text-[var(--color-subtle)] hover:text-[var(--color-foreground)] transition-colors">
                {allSelected
                  ? <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" />
                  : someSelected
                    ? <CheckSquare className="w-4 h-4 text-[var(--color-primary)] opacity-60" />
                    : <Square className="w-4 h-4" />
                }
              </button>
              <button onClick={() => toggleSort('title')} className="flex items-center text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide hover:text-[var(--color-foreground)] transition-colors">
                Tytuł <SortIcon field="title" />
              </button>
              <button onClick={() => toggleSort('status')} className="flex items-center text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide hover:text-[var(--color-foreground)] transition-colors">
                Status <SortIcon field="status" />
              </button>
              <span className="text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide">Autor</span>
              <button onClick={() => toggleSort('updatedAt')} className="flex items-center text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide hover:text-[var(--color-foreground)] transition-colors">
                Data <SortIcon field="updatedAt" />
              </button>
              <span />
            </div>

            {/* Rows */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-[var(--color-border)]">
              {items.map((row) => {
                const { item, author } = row
                const sc         = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft
                const isSelected = selected.has(item.id)
                const isPreviewed = preview?.item.id === item.id

                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[36px_1fr_120px_140px_120px_80px] items-center px-4 py-3 transition-colors group ${
                      isSelected   ? 'bg-[var(--color-primary-muted)]' :
                      isPreviewed  ? 'bg-[var(--color-surface-elevated)]' :
                      'hover:bg-[var(--color-surface-elevated)]'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleOne(item.id)}
                      className="flex items-center justify-center text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {isSelected
                        ? <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" />
                        : <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      }
                    </button>

                    {/* Title */}
                    <div className="min-w-0 pr-4">
                      <Link
                        href={`/content/${type}/${item.id}`}
                        className="font-medium text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors truncate block"
                      >
                        {item.title}
                      </Link>
                      <span className="text-xs text-[var(--color-subtle)] font-mono truncate block">/{item.slug}</span>
                    </div>

                    {/* Status */}
                    <Badge variant={sc.variant}>{sc.label}</Badge>

                    {/* Author */}
                    <span className="text-xs text-[var(--color-muted-foreground)] truncate">{author?.name ?? '—'}</span>

                    {/* Date */}
                    <span className="text-xs text-[var(--color-subtle)]">{formatDate(item.updatedAt)}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreview(isPreviewed ? null : row)}
                        className={`p-1.5 rounded transition-colors ${isPreviewed ? 'text-[var(--color-primary)]' : 'text-[var(--color-subtle)] hover:text-[var(--color-foreground)]'}`}
                        title="Szybki podgląd"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/content/${type}/${item.id}`)}>
                            <Pencil className="w-4 h-4 mr-2" />Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => publishMutation.mutate(item.id)}>
                            {item.status === 'published'
                              ? <><EyeOff className="w-4 h-4 mr-2" />Cofnij do szkicu</>
                              : <><Globe className="w-4 h-4 mr-2" />Opublikuj</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => archiveMutation.mutate(item.id)}>
                            <Archive className="w-4 h-4 mr-2" />Archiwizuj
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)]"
                            onClick={() => { if (confirm(`Usunąć "${item.title}"?`)) deleteMutation.mutate(item.id) }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </motion.div>

            {/* Pagination */}
            {meta && meta.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                <span className="text-xs text-[var(--color-subtle)]">
                  {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} z {meta.total}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs px-2 text-[var(--color-muted-foreground)]">{page} / {meta.pages}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Preview panel */}
      <AnimatePresence>
        {preview && (
          <QuickPreview
            row={preview}
            typeSlug={type}
            onClose={() => setPreview(null)}
            onEdit={() => router.push(`/content/${type}/${preview.item.id}`)}
          />
        )}
      </AnimatePresence>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <BulkBar
            count={selected.size}
            loading={bulkLoading}
            onPublish={() => bulkAction('publish')}
            onArchive={() => bulkAction('archive')}
            onDelete={() => bulkAction('delete')}
            onClear={() => setSelected(new Set())}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
