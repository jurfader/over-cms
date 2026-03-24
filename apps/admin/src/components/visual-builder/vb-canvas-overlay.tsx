'use client'

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import { ArrowUp, ArrowDown, Copy, Trash2, Clipboard, ClipboardPaste } from 'lucide-react'
import { useVisualBuilderStore } from './vb-store'
import { onIframeMessage, type SerializedRect } from './vb-messages'
import { BLOCK_DEF_MAP } from '@/components/editor/types'
import { findInTree, getParentId, insertAt } from './vb-tree-ops'
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

interface ContextMenuState {
  x: number
  y: number
  blockId: string
}

// ─── Deep clone with new IDs ─────────────────────────────────────────────────

function cloneBlockWithNewIds(block: Block): Block {
  return {
    ...block,
    id: crypto.randomUUID(),
    data: { ...block.data },
    style: block.style ? { ...block.style } : undefined,
    children: block.children?.map(cloneBlockWithNewIds),
  }
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
  const [, setIframeOffset] = useState({ top: 0, left: 0 })
  const [iframeScroll, setIframeScroll] = useState(0)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  // Clipboard ref (persists across renders, not serialized)
  const clipboardRef = useRef<Block | null>(null)

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
          // Close context menu on new click
          setContextMenu(null)
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
      setContextMenu(null)
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

  // ── Close context menu on Escape or click outside ─────────────────────

  useEffect(() => {
    if (!contextMenu) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setContextMenu(null)
      }
    }

    function handleClick() {
      setContextMenu(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [contextMenu])

  // ── Coordinate translation ─────────────────────────────────────────────
  // The rect from the iframe is obtained via getBoundingClientRect() which
  // returns coords relative to the iframe viewport. To position the overlay
  // in the parent window we add the iframe element's offset. When the
  // iframe scrolls after capture, the element has moved by the scroll delta
  // so we subtract that delta.

  function translate(rect: CapturedRect) {
    const scrollDelta = iframeScroll - rect.capturedScrollY
    return {
      top: rect.top - scrollDelta,
      left: rect.left,
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

  // ── Context menu actions ───────────────────────────────────────────────

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedBlockId || !selectionRect) return
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({ x: e.clientX, y: e.clientY, blockId: selectedBlockId })
    },
    [selectedBlockId, selectionRect],
  )

  const handleCopy = useCallback(() => {
    if (!contextMenu) return
    const block = findInTree(blocks, contextMenu.blockId)
    if (block) clipboardRef.current = block
    setContextMenu(null)
  }, [contextMenu, blocks])

  const handlePaste = useCallback(() => {
    if (!contextMenu || !clipboardRef.current) return
    const block = findInTree(blocks, contextMenu.blockId)
    if (!block) { setContextMenu(null); return }

    // Find parent of current block and insert the clone after it
    const parentId = getParentId(blocks, contextMenu.blockId)
    const parent = parentId ? findInTree(blocks, parentId) : null
    const siblings = parent?.children ?? blocks
    const idx = siblings.findIndex((b) => b.id === contextMenu.blockId)

    const clone = cloneBlockWithNewIds(clipboardRef.current)
    const effectiveParentId = parentId ?? 'root'
    const insertIndex = idx !== -1 ? idx + 1 : siblings.length

    useVisualBuilderStore.setState((s) => {
      const past = [...s.past, s.blocks]
      if (past.length > 50) past.shift()
      return {
        blocks: insertAt(s.blocks, effectiveParentId, insertIndex, clone),
        selectedBlockId: clone.id,
        isDirty: true,
        past,
        future: [],
      }
    })

    setContextMenu(null)
  }, [contextMenu, blocks])

  const handleCtxMoveUp = useCallback(() => {
    if (!contextMenu) return
    moveBlockDirection(contextMenu.blockId, 'up')
    setContextMenu(null)
  }, [contextMenu, moveBlockDirection])

  const handleCtxMoveDown = useCallback(() => {
    if (!contextMenu) return
    moveBlockDirection(contextMenu.blockId, 'down')
    setContextMenu(null)
  }, [contextMenu, moveBlockDirection])

  const handleCtxDuplicate = useCallback(() => {
    if (!contextMenu) return
    duplicateBlock(contextMenu.blockId)
    setContextMenu(null)
  }, [contextMenu, duplicateBlock])

  const handleCtxDelete = useCallback(() => {
    if (!contextMenu) return
    removeBlock(contextMenu.blockId)
    selectBlock(null)
    setSelectionRect(null)
    setContextMenu(null)
  }, [contextMenu, removeBlock, selectBlock])

  // ── Render ─────────────────────────────────────────────────────────────

  const showHover = hoverRect && hoverRect.blockId !== selectedBlockId

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">

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
              onContextMenu={handleContextMenu}
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

            {/* Right-click area (invisible, covers the selected block for context menu) */}
            <div
              className="absolute pointer-events-auto"
              style={{
                ...pos,
                background: 'transparent',
              }}
              onContextMenu={handleContextMenu}
            />
          </>
        )
      })()}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasClipboard={!!clipboardRef.current}
          onDuplicate={handleCtxDuplicate}
          onDelete={handleCtxDelete}
          onMoveUp={handleCtxMoveUp}
          onMoveDown={handleCtxMoveDown}
          onCopy={handleCopy}
          onPaste={handlePaste}
        />
      )}
    </div>
  )
}

// ─── Context menu component ─────────────────────────────────────────────────

interface ContextMenuProps {
  x: number
  y: number
  hasClipboard: boolean
  onDuplicate: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onCopy: () => void
  onPaste: () => void
}

function ContextMenu({
  x,
  y,
  hasClipboard,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onCopy,
  onPaste,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Adjust position so menu doesn't overflow viewport
  const [adjustedPos, setAdjustedPos] = useState({ x, y })
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let ax = x
    let ay = y
    if (x + rect.width > vw - 8) ax = vw - rect.width - 8
    if (y + rect.height > vh - 8) ay = vh - rect.height - 8
    if (ax < 8) ax = 8
    if (ay < 8) ay = 8
    setAdjustedPos({ x: ax, y: ay })
  }, [x, y])

  const items: { label: string; icon: React.ElementType; onClick: () => void; destructive?: boolean; disabled?: boolean }[] = [
    { label: 'Duplikuj', icon: Copy, onClick: onDuplicate },
    { label: 'Usuń', icon: Trash2, onClick: onDelete, destructive: true },
    { label: 'Przesuń w górę', icon: ArrowUp, onClick: onMoveUp },
    { label: 'Przesuń w dół', icon: ArrowDown, onClick: onMoveDown },
    { label: 'Kopiuj', icon: Clipboard, onClick: onCopy },
    { label: 'Wklej', icon: ClipboardPaste, onClick: onPaste, disabled: !hasClipboard },
  ]

  return (
    <div
      ref={menuRef}
      className="fixed pointer-events-auto z-[60] min-w-[180px] py-1 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] shadow-xl shadow-black/40"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        const Icon = item.icon
        // Add separator before move group and copy/paste group
        const showSeparator = i === 2 || i === 4
        return (
          <div key={item.label}>
            {showSeparator && (
              <div className="my-1 border-t border-[#2a2a4a]" />
            )}
            <button
              type="button"
              onClick={item.onClick}
              disabled={item.disabled}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                item.disabled
                  ? 'text-[#555] cursor-not-allowed'
                  : item.destructive
                    ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
                    : 'text-[#c4b5fd] hover:bg-[#8b5cf6]/15 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </button>
          </div>
        )
      })}
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
