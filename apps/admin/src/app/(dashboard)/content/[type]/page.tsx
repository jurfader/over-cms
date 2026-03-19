'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus, Search, ChevronLeft, ChevronRight, Pencil,
  Trash2, Globe, FileText, MoreHorizontal, EyeOff,
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

const statusConfig: Record<ContentStatus, { label: string; variant: 'success' | 'warning' | 'default' | 'outline' }> = {
  published: { label: 'Opublikowany', variant: 'success' },
  draft:     { label: 'Szkic',        variant: 'warning'  },
  scheduled: { label: 'Zaplanowany',  variant: 'default'  },
  archived:  { label: 'Archiwum',     variant: 'outline'  },
}

interface ItemsResponse {
  data: ContentItemWithAuthor[]
  meta: { total: number; page: number; limit: number; pages: number }
}

export default function ContentTypePage() {
  const { type } = useParams<{ type: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')

  const { data: typeData } = useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.get<{ data: ContentType[] }>('/api/content-types'),
    select: (res) => res.data.find((t) => t.slug === type),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['content', type, page, statusFilter],
    queryFn: () =>
      api.get<ItemsResponse>(
        `/api/content/${type}?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`,
      ),
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/content/${type}/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', type] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/content/${type}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', type] }),
  })

  const items = data?.data ?? []
  const meta = data?.meta

  // Filtruj lokalnie po search
  const filtered = search
    ? items.filter((r) =>
        r.item.title.toLowerCase().includes(search.toLowerCase()) ||
        r.item.slug.toLowerCase().includes(search.toLowerCase()),
      )
    : items

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/content">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">
              {typeData?.name ?? type}
            </h1>
            {meta && (
              <Badge variant="outline" className="text-xs">{meta.total}</Badge>
            )}
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
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-subtle)]" />
          <Input
            placeholder="Szukaj..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5">
          {(['', 'draft', 'published', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'gradient-bg text-white'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {s === '' ? 'Wszystkie' : statusConfig[s as ContentStatus]?.label ?? s}
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
                <div className="h-4 w-48 rounded animate-shimmer" />
                <div className="h-4 w-20 rounded animate-shimmer ml-auto" />
                <div className="h-4 w-24 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
            <div className="grid grid-cols-[1fr_120px_140px_120px_44px] px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
              <span className="text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide">Tytuł</span>
              <span className="text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide">Status</span>
              <span className="text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide">Autor</span>
              <span className="text-xs font-medium text-[var(--color-subtle)] uppercase tracking-wide">Zaktualizowany</span>
              <span />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="divide-y divide-[var(--color-border)]"
            >
              {filtered.map(({ item, author }) => {
                const sc = statusConfig[item.status] ?? statusConfig.draft
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_120px_140px_120px_44px] items-center px-5 py-3.5 hover:bg-[var(--color-surface-elevated)] transition-colors group"
                  >
                    {/* Title */}
                    <div className="min-w-0 pr-4">
                      <Link
                        href={`/content/${type}/${item.id}`}
                        className="font-medium text-sm text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors truncate block"
                      >
                        {item.title}
                      </Link>
                      <span className="text-xs text-[var(--color-subtle)] font-mono truncate block">
                        /{item.slug}
                      </span>
                    </div>

                    {/* Status */}
                    <Badge variant={sc.variant}>{sc.label}</Badge>

                    {/* Author */}
                    <span className="text-xs text-[var(--color-muted-foreground)] truncate">
                      {author?.name ?? '—'}
                    </span>

                    {/* Date */}
                    <span className="text-xs text-[var(--color-subtle)]">
                      {formatDate(item.updatedAt)}
                    </span>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => router.push(`/content/${type}/${item.id}`)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => publishMutation.mutate(item.id)}>
                          {item.status === 'published'
                            ? <><EyeOff className="w-4 h-4 mr-2" />Cofnij do szkicu</>
                            : <><Globe className="w-4 h-4 mr-2" />Opublikuj</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)]"
                          onClick={() => {
                            if (confirm(`Usunąć "${item.title}"?`)) deleteMutation.mutate(item.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Usuń
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    </div>
  )
}
