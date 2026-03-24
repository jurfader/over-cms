'use client'

import { useRef, useEffect } from 'react'
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
  const iframeReady = useVisualBuilderStore((s) => s.iframeReady)
  const setIframeReady = useVisualBuilderStore((s) => s.setIframeReady)
  const selectBlock = useVisualBuilderStore((s) => s.selectBlock)
  const hoverBlock = useVisualBuilderStore((s) => s.hoverBlock)
  const addBlock = useVisualBuilderStore((s) => s.addBlock)
  const moveBlock = useVisualBuilderStore((s) => s.moveBlock)
  const endDrag = useVisualBuilderStore((s) => s.endDrag)

  const blocksRef = useRef(blocks)
  blocksRef.current = blocks

  // ── Listen for iframe ready ────────────────────────────────────────────

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
  }, [setIframeReady, selectBlock, hoverBlock, addBlock, moveBlock, endDrag])

  // ── Send blocks to iframe on change ────────────────────────────────────

  useEffect(() => {
    if (!iframeReady || !iframeRef.current) return
    sendToIframe(iframeRef.current, {
      type: 'vb:update-blocks',
      blocks: blocks as unknown as Record<string, unknown>[],
    })
  }, [blocks, iframeReady])

  // ── Width based on device ──────────────────────────────────────────────

  const deviceWidth = DEVICE_WIDTHS[device] ?? '100%'

  return (
    <div
      className="flex-1 flex items-start justify-center bg-[#0a0a14] overflow-auto p-4"
      data-vb-backdrop
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
          src="/preview"
          title="Podgląd strony"
          className="w-full border-0 bg-white rounded-lg shadow-2xl"
          style={{ minHeight: '100vh' }}
        />

        {/* Selection / hover overlay */}
        <VBCanvasOverlay iframeRef={iframeRef} />
      </div>
    </div>
  )
}
