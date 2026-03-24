'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useVisualBuilderStore } from './vb-store'
import { VBToolbar } from './vb-toolbar'
import { VBLeftPanel } from './vb-left-panel'
import { VBCanvas } from './vb-canvas'
import { VBRightPanel } from './vb-right-panel'
import type { Block } from '@/components/editor/types'
import type { ContentType } from '@/types/content'

// ─── Props ──────────────────────────────────────────────────────────────────

interface VisualBuilderProps {
  pageId: string
  initialBlocks: Block[]
  initialTitle: string
  initialSlug: string
  contentType: ContentType
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VisualBuilder({
  pageId,
  initialBlocks,
  initialTitle,
  initialSlug,
  contentType: _contentType,
}: VisualBuilderProps) {
  const init = useVisualBuilderStore((s) => s.init)
  const selectBlock = useVisualBuilderStore((s) => s.selectBlock)
  const removeBlock = useVisualBuilderStore((s) => s.removeBlock)
  const undo = useVisualBuilderStore((s) => s.undo)
  const redo = useVisualBuilderStore((s) => s.redo)
  const selectedBlockId = useVisualBuilderStore((s) => s.selectedBlockId)
  const leftPanel = useVisualBuilderStore((s) => s.leftPanel)

  // Initialise store on mount
  const didInit = useRef(false)
  useEffect(() => {
    if (!didInit.current) {
      init(initialBlocks, { pageId, title: initialTitle, slug: initialSlug })
      didInit.current = true
    }
  }, []) // init runs once on mount

  // Note: iframe message handling (vb:click, vb:hover-in, vb:hover-out etc.)
  // is done in VBCanvas which forwards events to the store. No duplicate
  // listeners needed here.

  // ── Keyboard shortcuts (undo, redo, delete, deselect) ─────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey

      // Ignore shortcuts when user is typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if ((e.target as HTMLElement).isContentEditable) return

      // Ctrl+Z / Cmd+Z = undo
      if (meta && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z = redo
      if (meta && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        redo()
        return
      }
      // Ctrl+Y / Cmd+Y = redo (alternative)
      if (meta && e.key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      // Delete / Backspace = remove selected block
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
        e.preventDefault()
        removeBlock(selectedBlockId)
        selectBlock(null)
        return
      }
      // Escape = deselect
      if (e.key === 'Escape' && selectedBlockId) {
        selectBlock(null)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, removeBlock, selectBlock, selectedBlockId])

  // Click outside canvas deselects
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.vbBackdrop) {
        selectBlock(null)
      }
    },
    [selectBlock],
  )

  return (
    <div className="flex flex-col h-[calc(100vh-var(--topbar-height))] -mt-6 -mx-6 bg-[#08080f]">
      {/* Top toolbar */}
      <VBToolbar
        pageId={pageId}
        initialTitle={initialTitle}
        initialSlug={initialSlug}
      />

      {/* Body: left panel + canvas + right panel */}
      <div
        className="flex flex-1 min-h-0"
        onClick={handleBackdropClick}
        data-vb-backdrop
      >
        {/* Left panel (collapsible) */}
        {leftPanel !== null && <VBLeftPanel />}

        {/* Canvas */}
        <VBCanvas />

        {/* Right panel (shown when a block is selected) */}
        {selectedBlockId && <VBRightPanel />}
      </div>
    </div>
  )
}
