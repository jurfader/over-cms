'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useVisualBuilderStore } from './vb-store'
import { onIframeMessage } from './vb-messages'
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
  const hoverBlock = useVisualBuilderStore((s) => s.hoverBlock)
  const selectedBlockId = useVisualBuilderStore((s) => s.selectedBlockId)
  const leftPanel = useVisualBuilderStore((s) => s.leftPanel)

  // Initialise store on mount
  const didInit = useRef(false)
  useEffect(() => {
    if (!didInit.current) {
      init(initialBlocks)
      didInit.current = true
    }
  }, []) // init runs once on mount

  // Listen for iframe messages
  useEffect(() => {
    const cleanup = onIframeMessage((msg) => {
      switch (msg.type) {
        case 'vb:click':
          selectBlock(msg.blockId)
          break
        case 'vb:hover-in':
          hoverBlock(msg.blockId)
          break
        case 'vb:hover-out':
          hoverBlock(null)
          break
      }
    })
    return cleanup
  }, [selectBlock, hoverBlock])

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
