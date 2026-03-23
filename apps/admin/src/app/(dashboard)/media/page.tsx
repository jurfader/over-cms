'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Trash2, Copy, Check, ImageIcon, FileText,
  ChevronLeft, ChevronRight, Search, X, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { MediaItem, MediaListResponse } from '@/types/media'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onUpload: (files: FileList) => void
  uploading: boolean
}

function UploadZone({ onUpload, uploading }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files)
  }, [onUpload])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)]',
        'border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200',
        dragOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
          : 'border-[var(--color-border-hover)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-elevated)]',
        uploading && 'pointer-events-none opacity-70',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,text/*,video/mp4,audio/mpeg"
        className="hidden"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />
      {uploading ? (
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      ) : (
        <Upload className="w-8 h-8 text-[var(--color-subtle)]" />
      )}
      <div>
        <p className="text-sm font-medium text-[var(--color-foreground)]">
          {uploading ? 'Przesyłanie...' : 'Przeciągnij pliki lub kliknij aby wybrać'}
        </p>
        <p className="text-xs text-[var(--color-subtle)] mt-0.5">
          Obrazy, PDF, wideo — maks. 50 MB
        </p>
      </div>
    </div>
  )
}

// ─── Media Card ───────────────────────────────────────────────────────────────

interface MediaCardProps {
  item: MediaItem
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}

function MediaCard({ item, selected, onSelect, onDelete }: MediaCardProps) {
  const [copied, setCopied] = useState(false)

  function copyUrl() {
    navigator.clipboard.writeText(item.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'group relative rounded-[var(--radius)] overflow-hidden cursor-pointer',
        'border-2 transition-all duration-150',
        selected
          ? 'border-[var(--color-primary)]'
          : 'border-transparent hover:border-[var(--color-border-hover)]',
      )}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-[var(--color-surface-elevated)] flex items-center justify-center overflow-hidden">
        {isImage(item.mimeType) ? (
          <img
            src={item.url}
            alt={item.alt ?? item.originalName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <FileText className="w-10 h-10 text-[var(--color-subtle)]" />
        )}
      </div>

      {/* Hover overlay */}
      <div className={cn(
        'absolute inset-0 bg-[var(--color-background)]/80 backdrop-blur-sm',
        'flex flex-col items-center justify-center gap-2 p-3',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
      )}>
        <p className="text-xs text-[var(--color-foreground)] font-medium text-center line-clamp-2">
          {item.originalName}
        </p>
        <p className="text-[10px] text-[var(--color-subtle)]">{formatBytes(item.size)}</p>
        <div className="flex gap-1.5 mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); copyUrl() }}
            className="p-1.5 rounded bg-[var(--color-surface-elevated)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            title="Kopiuj URL"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded bg-[var(--color-surface-elevated)] hover:bg-[var(--color-destructive)] hover:text-white transition-colors"
            title="Usuń"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected check */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-bg flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const qc = useQueryClient()

  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState<'all' | 'image' | 'file'>('all')
  const [selected, setSelected] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['media', page, typeFilter],
    queryFn: () =>
      api.get<MediaListResponse>(
        `/api/media?page=${page}&limit=40${typeFilter !== 'all' ? `&type=${typeFilter}` : ''}`,
      ),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/media`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      }).then((r) => {
        if (!r.ok) throw new Error('Upload failed')
        return r.json()
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/media/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] })
      setSelected(null)
    },
  })

  async function handleUpload(files: FileList) {
    for (const file of Array.from(files)) {
      await uploadMutation.mutateAsync(file)
    }
  }

  const items = data?.data ?? []
  const meta  = data?.meta
  const filtered = search
    ? items.filter((i) =>
        i.originalName.toLowerCase().includes(search.toLowerCase()) ||
        (i.alt ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : items

  const selectedItem = selected ? items.find((i) => i.id === selected) : null

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Media</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Zarządzaj plikami i obrazami
          </p>
        </div>
        {meta && (
          <Badge variant="outline" className="text-xs">{meta.total} plików</Badge>
        )}
      </div>

      {/* Upload zone */}
      <UploadZone onUpload={handleUpload} uploading={uploadMutation.isPending} />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-subtle)]" />
          <Input
            placeholder="Szukaj..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-[var(--color-subtle)]" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'image', 'file'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setPage(1) }}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                typeFilter === t
                  ? 'gradient-bg text-white'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)]',
              )}
            >
              {t === 'all' ? 'Wszystkie' : t === 'image' ? 'Obrazy' : 'Pliki'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="aspect-square rounded-[var(--radius)] animate-shimmer" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-[var(--radius-lg)] py-20 text-center">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 text-[var(--color-subtle)] opacity-40" />
              <p className="text-sm text-[var(--color-muted-foreground)]">Brak plików</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2"
            >
              <AnimatePresence>
                {filtered.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    selected={selected === item.id}
                    onSelect={() => setSelected(selected === item.id ? null : item.id)}
                    onDelete={() => {
                      if (confirm(`Usunąć "${item.originalName}"?`)) {
                        deleteMutation.mutate(item.id)
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {meta && meta.pages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-xs text-[var(--color-subtle)]">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} z {meta.total}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs px-2 text-[var(--color-muted-foreground)]">{page} / {meta.pages}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-60 shrink-0 glass-card rounded-[var(--radius-lg)] p-4 space-y-4"
            >
              {/* Preview */}
              <div className="aspect-square rounded-[var(--radius)] overflow-hidden bg-[var(--color-surface-elevated)] flex items-center justify-center">
                {isImage(selectedItem.mimeType) ? (
                  <img src={selectedItem.url} alt={selectedItem.alt ?? ''} className="w-full h-full object-contain" />
                ) : (
                  <FileText className="w-12 h-12 text-[var(--color-subtle)]" />
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--color-foreground)] break-all">
                  {selectedItem.originalName}
                </p>
                <div className="space-y-1 text-[10px] text-[var(--color-subtle)]">
                  <p>{selectedItem.mimeType}</p>
                  <p>{formatBytes(selectedItem.size)}</p>
                  {selectedItem.width && selectedItem.height && (
                    <p>{selectedItem.width} × {selectedItem.height} px</p>
                  )}
                </div>
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">URL</p>
                <div className="flex gap-1.5">
                  <input
                    readOnly
                    value={selectedItem.url}
                    className="flex-1 min-w-0 text-[10px] font-mono bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-muted-foreground)]"
                  />
                  <CopyButton value={selectedItem.url} />
                </div>
              </div>

              {/* Delete */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[var(--color-destructive)] border-[var(--color-destructive)]/30 hover:bg-[var(--color-destructive)]/10"
                onClick={() => {
                  if (confirm(`Usunąć "${selectedItem.originalName}"?`)) {
                    deleteMutation.mutate(selectedItem.id)
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Usuń plik
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}
