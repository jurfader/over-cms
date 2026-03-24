'use client'

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import { ArrowUp, ArrowDown, Copy, Trash2 } from 'lucide-react'
import { useVisualBuilderStore } from './vb-store'
import { onIframeMessage, type SerializedRect } from './vb-messages'
import { BLOCK_DEF_MAP } from '@/components/editor/types'
import type { Block, BlockType } from '@/components/editor/types'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Rect captured from iframe, plus the iframe scrollY at capture time. */
interface CapturedRect extends SerializedRect {
  blockId: string
  /** iframe scrollY at the moment this rect was captured */
  capturedScrollY: number
}

interface VBCanvasOverlayProps {
  iframeRef: RefObject<HTMLIFrameElement | null>
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VBCanvasOverlay({ iframeRef }: VBCanvasOverlayProps) {
  const selectedBlockId = useVisualBuilderStore((s) => s.selectedBlockId)
  const blocks = useVisualBuilderStore((s) => s.blocks)
  const moveBlockDirection = useVisualBuilderStore((s) => s.moveBlockDirection)
  const duplicateBlock = useVisualBuilderStore((s) => s.duplicateBlock)
  const removeBlock = useVisualBuilderStore((s) => s.removeBlock)
  const selectBlock = useVisualBuilderStore((s) => s.selectBlock)

  const [selectionRect, setSelectionRect] = useState<CapturedRect | null>(null)
  const [hoverRect, setHoverRect] = useState<CapturedRect | null>(null)
  const [iframeOffset, setIframeOffset] = useState({ top: 0, left: 0 })
  const [iframeScroll, setIframeScroll] = useState(0)

  // Keep a mutable ref to the latest iframe scroll so we can stamp it
  // onto rects captured in the message handler without re-subscribing.
  const iframeScrollRef = useRef(0)

  // ── Track iframe position ──────────────────────────────────────────────

  const updateIframeOffset = useCallback(() => {
    if (!iframeRef.current) return
    const rect = iframeRef.current.getBoundingClientRect()
    setIframeOffset({ top: rect.top, left: rect.left })
  }, [iframeRef])

  useEffect(() => {
    updateIframeOffset()
    window.addEventListener('resize', updateIframeOffset)
    window.addEventListener('scroll', updateIframeOffset, true)
    return () => {
      window.removeEventListener('resize', updateIframeOffset)
      window.removeEventListener('scroll', updateIframeOffset, true)
    }
  }, [updateIframeOffset])

  // ── Listen for iframe messages ─────────────────────────────────────────

  useEffect(() => {
    const cleanup = onIframeMessage((msg) => {
      switch (msg.type) {
        case 'vb:click':
          setSelectionRect({
            blockId: msg.blockId,
            ...msg.rect,
            capturedScrollY: iframeScrollRef.current,
          })
          updateIframeOffset()
          break

        case 'vb:hover-in':
          setHoverRect({
            blockId: msg.blockId,
            ...msg.rect,
            capturedScrollY: iframeScrollRef.current,
          })
          updateIframeOffset()
          break

        case 'vb:hover-out':
          setHoverRect(null)
          break

        case 'vb:scroll':
          iframeScrollRef.current = msg.scrollTop
          setIframeScroll(msg.scrollTop)
          break
      }
    })

    return cleanup
  }, [updateIframeOffset])

  // ── Clear selection rect when selection changes externally ─────────────

  useEffect(() => {
    if (!selectedBlockId) {
      setSelectionRect(null)
    }
  }, [selectedBlockId])

  // ── Invalidate selection rect when blocks change ──────────────────────
  // After a move/duplicate/delete the old rect position is stale. Clear it
  // so it doesn't flash in the wrong spot. The user's next click will
  // provide a fresh rect.

  const prevBlocksRef = useRef(blocks)
  useEffect(() => {
    if (prevBlocksRef.current !== blocks && selectionRect) {
      setSelectionRect(null)
    }
    prevBlocksRef.current = blocks
  }, [blocks, selectionRect])

  // ── Coordinate translation ─────────────────────────────────────────────
  // The rect from the iframe is obtained via getBoundingClientRect() which
  // returns coords relative to the iframe viewport. To position the overlay
  // in the parent window we add the iframe element's offset. When the
  // iframe scrolls after capture, the element has moved by the scroll delta
  // so we subtract that delta.

  function translate(rect: CapturedRect) {
    const scrollDelta = iframeScroll - rect.capturedScrollY
    return {
      top: iframeOffset.top + rect.top - scrollDelta,
      left: iframeOffset.left + rect.left,
      width: rect.width,
      height: rect.height,
    }
  }

  // ── Block info for badge ───────────────────────────────────────────────

  function getBlockLabel(blockId: string): string {
    const block = findBlock(blocks, blockId)
    if (block) {
      const def = BLOCK_DEF_MAP[block.type as BlockType]
      return def?.label ?? block.type
    }
    return ''
  }

  // ── Mini toolbar actions ───────────────────────────────────────────────

  const handleMoveUp = useCallback(() => {
    if (selectedBlockId) moveBlockDirection(selectedBlockId, 'up')
  }, [selectedBlockId, moveBlockDirection])

  const handleMoveDown = useCallback(() => {
    if (selectedBlockId) moveBlockDirection(selectedBlockId, 'down')
  }, [selectedBlockId, moveBlockDirection])

  const handleDuplicate = useCallback(() => {
    if (selectedBlockId) duplicateBlock(selectedBlockId)
  }, [selectedBlockId, duplicateBlock])

  const handleDelete = useCallback(() => {
    if (selectedBlockId) {
      removeBlock(selectedBlockId)
      selectBlock(null)
      setSelectionRect(null)
    }
  }, [selectedBlockId, removeBlock, selectBlock])

  // ── Render ─────────────────────────────────────────────────────────────

  const showHover = hoverRect && hoverRect.blockId !== selectedBlockId

  return (
    <div className="pointer-events-none fixed inset-0 z-50">

      {/* Hover outline */}
      {showHover && (
        <div
          className="absolute border border-dashed border-[#8b5cf6]/60 rounded-sm transition-all duration-75"
          style={translate(hoverRect)}
        />
      )}

      {/* Selection outline */}
      {selectionRect && selectedBlockId && (() => {
        const pos = translate(selectionRect)
        return (
          <>
            {/* Outline */}
            <div
              className="absolute border-2 border-[#8b5cf6] rounded-sm transition-all duration-75"
              style={pos}
            />

            {/* Block type badge */}
            <div
              className="absolute flex items-center gap-1 px-1.5 py-0.5 rounded-b-md bg-[#8b5cf6] text-white text-[10px] font-medium leading-none whitespace-nowrap"
              style={{
                top: pos.top - 1,
                left: pos.left,
                transform: 'translateY(-100%)',
              }}
            >
              {getBlockLabel(selectedBlockId) || selectedBlockId.slice(0, 8)}
            </div>

            {/* Mini toolbar */}
            <div
              className="absolute flex items-center gap-0.5 pointer-events-auto"
              style={{
                top: pos.top - 1,
                left: pos.left + pos.width,
                transform: 'translate(-100%, -100%)',
              }}
            >
              <div className="flex items-center gap-0.5 bg-[#1a1a2e] border border-[#8b5cf6]/40 rounded-md p-0.5 shadow-lg">
                <OverlayButton onClick={handleMoveUp} title="Przesuń w górę">
                  <ArrowUp className="w-3 h-3" />
                </OverlayButton>
                <OverlayButton onClick={handleMoveDown} title="Przesuń w dół">
                  <ArrowDown className="w-3 h-3" />
                </OverlayButton>
                <OverlayButton onClick={handleDuplicate} title="Duplikuj">
                  <Copy className="w-3 h-3" />
                </OverlayButton>
                <OverlayButton onClick={handleDelete} title="Usuń" destructive>
                  <Trash2 className="w-3 h-3" />
                </OverlayButton>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}

// ─── Overlay button ─────────────────────────────────────────────────────────

function OverlayButton({
  onClick,
  title,
  children,
  destructive = false,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1 rounded transition-colors ${
        destructive
          ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
          : 'text-[#c4b5fd] hover:bg-[#8b5cf6]/20 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Tree search helper ─────────────────────────────────────────────────────

function findBlock(blocks: Block[], id: string): Block | undefined {
  for (const b of blocks) {
    if (b.id === id) return b
    if (b.children?.length) {
      const found = findBlock(b.children, id)
      if (found) return found
    }
  }
  return undefined
}
