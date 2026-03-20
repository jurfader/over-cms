'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { History, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ContentItem } from '@/types/content'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Version {
  version: {
    id:        string
    version:   number
    title:     string
    status:    'draft' | 'published' | 'scheduled' | 'archived'
    createdAt: string
    authorId:  string | null
  }
  author: {
    id:    string
    name:  string
    email: string
  } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60_000)
  const hr   = Math.floor(min / 60)
  const day  = Math.floor(hr  / 24)
  if (min  < 1)   return 'przed chwilą'
  if (min  < 60)  return `${min} min temu`
  if (hr   < 24)  return `${hr} godz. temu`
  if (day  < 30)  return `${day} dni temu`
  return new Date(dateStr).toLocaleDateString('pl-PL')
}

const STATUS_LABEL: Record<string, string> = {
  draft:     'Szkic',
  published: 'Opublikowany',
  scheduled: 'Zaplanowany',
  archived:  'Archiwum',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VersionHistoryProps {
  itemId:    string
  typeSlug:  string
  onRestore: (item: ContentItem) => void
}

export function VersionHistory({ itemId, typeSlug, onRestore }: VersionHistoryProps) {
  const qc = useQueryClient()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['versions', typeSlug, itemId],
    queryFn:  () => api.get<{ data: Version[] }>(`/api/content/${typeSlug}/${itemId}/versions`),
    staleTime: 30_000,
  })

  const versions = data?.data ?? []

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) =>
      api.post<{ data: ContentItem }>(`/api/content/${typeSlug}/${itemId}/versions/${versionId}/restore`),
    onSuccess: (res) => {
      setConfirmId(null)
      qc.invalidateQueries({ queryKey: ['versions', typeSlug, itemId] })
      qc.invalidateQueries({ queryKey: ['content', typeSlug] })
      onRestore(res.data)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-subtle)] py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Ładowanie historii...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-destructive)]">
        <AlertCircle className="w-3.5 h-3.5" />
        Błąd ładowania wersji
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-subtle)] py-2">
        <History className="w-3.5 h-3.5" />
        Brak zapisanych wersji
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {versions.map(({ version: v, author }) => {
        const isFirst = v.version === versions[versions.length - 1]?.version.version
        const isConfirming = confirmId === v.id

        return (
          <div
            key={v.id}
            className={cn(
              'rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2.5 space-y-1 transition-colors',
              isConfirming && 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]',
            )}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--color-foreground)]">
                  v{v.version}
                </span>
                {isFirst && (
                  <span className="text-[10px] text-[var(--color-subtle)] italic">pierwsza</span>
                )}
              </div>
              <Badge
                variant={v.status === 'published' ? 'success' : 'outline'}
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {STATUS_LABEL[v.status] ?? v.status}
              </Badge>
            </div>

            {/* Meta */}
            <div className="text-[11px] text-[var(--color-subtle)] leading-relaxed">
              <span>{relativeTime(v.createdAt)}</span>
              {author?.name && (
                <span className="before:content-['·'] before:mx-1">{author.name}</span>
              )}
            </div>

            {/* Confirm / restore */}
            {isConfirming ? (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-[var(--color-foreground)] flex-1">Przywrócić tę wersję?</span>
                <button
                  onClick={() => restoreMutation.mutate(v.id)}
                  disabled={restoreMutation.isPending}
                  className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline disabled:opacity-50"
                >
                  {restoreMutation.isPending ? 'Przywracanie...' : 'Tak'}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-[11px] text-[var(--color-subtle)] hover:text-[var(--color-foreground)]"
                >
                  Nie
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(v.id)}
                className="flex items-center gap-1 text-[11px] text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors pt-0.5"
              >
                <RotateCcw className="w-3 h-3" />
                Przywróć
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
