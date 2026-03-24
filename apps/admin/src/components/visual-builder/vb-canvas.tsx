'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useVisualBuilderStore } from './vb-store'
import { sendToIframe, onIframeMessage } from './vb-messages'
import { VBCanvasOverlay } from './vb-canvas-overlay'

// ─── Device widths ──────────────────────────────────────────────────────────

const DEVICE_WIDTHS: Record<string, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VBCanvas() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const blocks = useVisualBuilderStore((s) => s.blocks)
  const device = useVisualBuilderStore((s) => s.device)
  const selectedBlockId = useVisualBuilderStore((s) => s.selectedBlockId)
  const hoveredBlockId = useVisualBuilderStore((s) => s.hoveredBlockId)
  const iframeReady = useVisualBuilderStore((s) => s.iframeReady)
  const setIframeReady = useVisualBuilderStore((s) => s.setIframeReady)
  const selectBlock = useVisualBuilderStore((s) => s.selectBlock)
  const hoverBlock = useVisualBuilderStore((s) => s.hoverBlock)
  const addBlock = useVisualBuilderStore((s) => s.addBlock)
  const moveBlock = useVisualBuilderStore((s) => s.moveBlock)
  const isDragging = useVisualBuilderStore((s) => s.isDragging)
  const dragBlockType = useVisualBuilderStore((s) => s.dragBlockType)
  const endDrag = useVisualBuilderStore((s) => s.endDrag)

  const updateBlockData = useVisualBuilderStore((s) => s.updateBlockData)

  const blocksRef = useRef(blocks)
  blocksRef.current = blocks

  // ── Listen for iframe messages ───────────────────────────────────────

  useEffect(() => {
    const cleanup = onIframeMessage((msg) => {
      switch (msg.type) {
        case 'vb:ready':
          setIframeReady(true)
          // Send initial blocks to iframe
          if (iframeRef.current) {
            sendToIframe(iframeRef.current, {
              type: 'vb:init',
              blocks: blocksRef.current as unknown as Record<string, unknown>[],
            })
          }
          break

        case 'vb:click':
          selectBlock(msg.blockId)
          break

        case 'vb:hover-in':
          hoverBlock(msg.blockId)
          break

        case 'vb:hover-out':
          hoverBlock(null)
          break

        case 'vb:inline-update':
          // User finished inline editing in the preview — update the store
          updateBlockData(msg.blockId, { [msg.field]: msg.value })
          break

        case 'vb:drop':
          addBlock(
            msg.blockType as Parameters<typeof addBlock>[0],
            msg.targetParentId,
            msg.targetIndex,
          )
          endDrag()
          break

        case 'vb:reorder':
          moveBlock(msg.blockId, msg.newParentId, msg.newIndex)
          break

        case 'vb:resize':
          if (iframeRef.current) {
            iframeRef.current.style.height = `${msg.contentHeight}px`
          }
          break
      }
    })

    return cleanup
  }, [setIframeReady, selectBlock, hoverBlock, updateBlockData, addBlock, moveBlock, endDrag])

  // ── Send blocks to iframe on change ────────────────────────────────────

  useEffect(() => {
    if (!iframeReady || !iframeRef.current) return
    sendToIframe(iframeRef.current, {
      type: 'vb:update-blocks',
      blocks: blocks as unknown as Record<string, unknown>[],
    })
  }, [blocks, iframeReady])

  // ── Sync selected block to iframe ────────────────────────────────────

  useEffect(() => {
    if (!iframeReady || !iframeRef.current) return
    sendToIframe(iframeRef.current, {
      type: 'vb:select',
      blockId: selectedBlockId,
    })
  }, [selectedBlockId, iframeReady])

  // ── Sync hovered block to iframe ─────────────────────────────────────

  useEffect(() => {
    if (!iframeReady || !iframeRef.current) return
    sendToIframe(iframeRef.current, {
      type: 'vb:hover',
      blockId: hoveredBlockId,
    })
  }, [hoveredBlockId, iframeReady])

  // ── Forward drag state to iframe ─────────────────────────────────────

  useEffect(() => {
    if (!iframeReady || !iframeRef.current) return
    if (isDragging && dragBlockType) {
      sendToIframe(iframeRef.current, {
        type: 'vb:start-drag',
        blockType: dragBlockType,
      })
    } else {
      sendToIframe(iframeRef.current, {
        type: 'vb:end-drag',
      })
    }
  }, [isDragging, dragBlockType, iframeReady])

  // ── Width based on device ──────────────────────────────────────────────

  const deviceWidth = DEVICE_WIDTHS[device] ?? '100%'

  // ── Parent-side drop handler ─────────────────────────────────────────
  // Cross-origin iframes can't read dataTransfer, so we handle the drop
  // on the parent div wrapping the iframe instead.

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isDragging) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [isDragging])

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!isDragging || !dragBlockType) return
    e.preventDefault()

    // Find the nearest block to drop after by asking the iframe
    // For simplicity, add at the end of root (auto-wrap handles structure)
    addBlock(dragBlockType as Parameters<typeof addBlock>[0], 'root')
    endDrag()
  }, [isDragging, dragBlockType, addBlock, endDrag])

  return (
    <div
      className="flex-1 flex items-start justify-center bg-[#0a0a14] overflow-auto p-4"
      data-vb-backdrop
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className="relative"
        style={{
          width: deviceWidth,
          maxWidth: '100%',
          transition: 'width 0.3s ease',
        }}
      >
        <iframe
          ref={iframeRef}
          src="/admin/preview"
          title="Podgląd strony"
          className="w-full border-0 bg-white rounded-lg shadow-2xl"
          style={{ minHeight: '100vh', pointerEvents: isDragging ? 'none' : 'auto' }}
        />

        {/* Selection / hover overlay */}
        <VBCanvasOverlay iframeRef={iframeRef} />
      </div>
    </div>
  )
}
