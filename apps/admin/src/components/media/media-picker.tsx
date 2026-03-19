'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Check, Search, ImageIcon, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { MediaItem, MediaListResponse } from '@/types/media'

interface MediaPickerProps {
  value?: string          // current URL
  onChange: (url: string) => void
  accept?: 'image' | 'file' | 'all'
}

export function MediaPicker({ value, onChange, accept = 'all' }: MediaPickerProps) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['media', 1, accept],
    queryFn: () =>
      api.get<MediaListResponse>(
        `/api/media?page=1&limit=80${accept !== 'all' ? `&type=${accept}` : ''}`,
      ),
    enabled: open,
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/media`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      }).then((r) => r.json() as Promise<{ data: MediaItem }>)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['media'] })
      onChange(res.data.url)
      setOpen(false)
    },
  })

  const items = data?.data ?? []
  const filtered = search
    ? items.filter((i) => i.originalName.toLowerCase().includes(search.toLowerCase()))
    : items

  function select(item: MediaItem) {
    onChange(item.url)
    setOpen(false)
  }

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) uploadMutation.mutate(file)
  }, [uploadMutation])

  return (
    <>
      {/* Trigger */}
      <div
        onClick={() => setOpen(true)}
        className={cn(
          'relative group cursor-pointer rounded-[var(--radius)] border-2 border-dashed',
          'border-[var(--color-border-hover)] hover:border-[var(--color-primary)] transition-colors',
          value ? 'p-0 aspect-video overflow-hidden' : 'p-6 text-center',
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-medium">Zmień plik</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-[var(--color-subtle)]" />
            <p className="text-sm text-[var(--color-subtle)]">Kliknij aby wybrać</p>
            <p className="text-xs text-[var(--color-subtle)] opacity-60 mt-0.5">lub przeciągnij plik</p>
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] shrink-0">
                <h2 className="text-base font-semibold text-[var(--color-foreground)] flex-1">Media</h2>

                {/* Upload button */}
                <label className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[var(--radius)] cursor-pointer',
                  'border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors',
                  uploadMutation.isPending && 'opacity-60 pointer-events-none',
                )}>
                  {uploadMutation.isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Upload className="w-3.5 h-3.5" />
                  }
                  Prześlij plik
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadMutation.mutate(file)
                    }}
                  />
                </label>

                <div className="relative w-44">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-subtle)]" />
                  <Input
                    placeholder="Szukaj..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>

                <button onClick={() => setOpen(false)} className="text-[var(--color-subtle)] hover:text-[var(--color-foreground)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid */}
              <div
                className="flex-1 overflow-y-auto p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                {isLoading ? (
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {[...Array(14)].map((_, i) => (
                      <div key={i} className="aspect-square rounded-[var(--radius)] animate-shimmer" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-16 text-center">
                    <ImageIcon className="w-8 h-8 mx-auto mb-3 text-[var(--color-subtle)] opacity-40" />
                    <p className="text-sm text-[var(--color-muted-foreground)]">Brak plików</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {filtered.map((item) => {
                      const isSelected = item.url === value
                      return (
                        <button
                          key={item.id}
                          onClick={() => select(item)}
                          className={cn(
                            'relative aspect-square rounded-[var(--radius)] overflow-hidden border-2 transition-all',
                            'bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)]',
                            isSelected ? 'border-[var(--color-primary)]' : 'border-transparent',
                          )}
                        >
                          {item.mimeType.startsWith('image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt={item.alt ?? ''} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[10px] font-mono text-[var(--color-subtle)] uppercase">
                                {item.mimeType.split('/')[1]?.slice(0, 4) ?? 'file'}
                              </span>
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full gradient-bg flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-[var(--color-border)] shrink-0 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Zamknij</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
