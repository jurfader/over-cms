'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Save, Globe,
  Loader2, CheckCircle2, AlertCircle,
  Undo2, Redo2,
  Monitor, Tablet, Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import { useVisualBuilderStore } from './vb-store'

// ─── Types ──────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface VBToolbarProps {
  pageId: string
  initialTitle: string
  initialSlug: string
}

// ─── Device config ──────────────────────────────────────────────────────────

const DEVICES = [
  { id: 'desktop' as const, icon: Monitor,    label: 'Desktop' },
  { id: 'tablet'  as const, icon: Tablet,     label: 'Tablet'  },
  { id: 'mobile'  as const, icon: Smartphone, label: 'Telefon' },
] as const

// ─── Component ──────────────────────────────────────────────────────────────

export function VBToolbar({ pageId, initialTitle, initialSlug }: VBToolbarProps) {
  const blocks = useVisualBuilderStore((s) => s.blocks)
  const device = useVisualBuilderStore((s) => s.device)
  const setDevice = useVisualBuilderStore((s) => s.setDevice)
  const past = useVisualBuilderStore((s) => s.past)
  const future = useVisualBuilderStore((s) => s.future)
  const undo = useVisualBuilderStore((s) => s.undo)
  const redo = useVisualBuilderStore((s) => s.redo)
  const isDirty = useVisualBuilderStore((s) => s.isDirty)
  const pageTitle = useVisualBuilderStore((s) => s.pageTitle)
  const pageSlug = useVisualBuilderStore((s) => s.pageSlug)
  const setPageTitle = useVisualBuilderStore((s) => s.setPageTitle)
  const markClean = useVisualBuilderStore((s) => s.markClean)

  // Use store values, falling back to initial props for first render
  const title = pageTitle || initialTitle
  const slug = pageSlug || initialSlug

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      await api.put(`/api/content/page/${pageId}`, {
        title,
        slug,
        data: { blocks },
      })
      markClean()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 4000)
    }
  }, [pageId, title, slug, blocks, markClean])

  // ── Publish ────────────────────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    setSaveStatus('saving')
    try {
      await api.put(`/api/content/page/${pageId}`, {
        title,
        slug,
        data: { blocks },
        status: 'published',
      })
      await api.post(`/api/content/page/${pageId}/publish`)
      markClean()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 4000)
    }
  }, [pageId, title, slug, blocks, markClean])

  const isBusy = saveStatus === 'saving'

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--glass-card-bg)] backdrop-filter backdrop-blur-sm shrink-0">

      {/* ── Left: Back + title ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]" asChild>
          <Link href="/pages">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs">Strony</span>
          </Link>
        </Button>

        <div className="h-5 w-px bg-[var(--color-border)] shrink-0" />

        <input
          value={title}
          onChange={(e) => setPageTitle(e.target.value)}
          placeholder="Tytuł strony..."
          className="flex-1 bg-transparent text-sm font-semibold text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)] focus:outline-none min-w-0"
        />
      </div>

      {/* ── Center: Device switcher ────────────────────────────────── */}
      <div className="flex items-center gap-0.5 bg-[var(--color-surface-elevated)] rounded-lg p-0.5 shrink-0">
        {DEVICES.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setDevice(id)}
                className={`p-1.5 rounded-md transition-colors ${
                  device === id
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* ── Right: Undo/Redo + Save status + Actions ───────────────── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={undo}
                disabled={past.length === 0}
                className="p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Cofnij</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={redo}
                disabled={future.length === 0}
                className="p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Ponów</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-5 w-px bg-[var(--color-border)]" />

        {/* Save status */}
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-subtle)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Zapisywanie...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Zapisano
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-destructive)]">
            <AlertCircle className="w-3.5 h-3.5" />
            Błąd zapisu
          </span>
        )}
        {saveStatus === 'idle' && isDirty && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Niezapisane zmiany
          </span>
        )}

        {/* Actions */}
        <Button variant="outline" size="sm" onClick={handleSave} disabled={isBusy}>
          <Save className="w-3.5 h-3.5" />
          Zapisz
        </Button>
        <Button size="sm" onClick={handlePublish} disabled={isBusy}>
          <Globe className="w-3.5 h-3.5" />
          Opublikuj
        </Button>
      </div>
    </div>
  )
}
