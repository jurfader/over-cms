/**
 * Canvas interaction script — injected into the preview iframe.
 *
 * Handles click selection, hover highlighting, inline editing,
 * and drag-and-drop target zones.
 *
 * IMPORTANT: This file is **self-contained**. It must not import anything
 * from the admin application because it will be inlined as a <script> tag
 * inside the preview page. All communication with the parent window uses
 * `window.parent.postMessage()`.
 */

// ─── Constants ──────────────────────────────────────────────────

const CHANNEL = 'overcms-vb' as const

const BLOCK_ATTR = 'data-block-id'
const BLOCK_TYPE_ATTR = 'data-block-type'

const SELECT_CLASS = 'vb-selected'
const HOVER_CLASS = 'vb-hovered'
const DROP_ZONE_CLASS = 'vb-drop-zone'
const DROP_ZONE_ACTIVE_CLASS = 'vb-drop-zone--active'

const DROP_ZONE_HEIGHT = 4
const DROP_ZONE_COLOR = '#E040FB'
const DROP_ZONE_OPACITY_IDLE = '0.35'
const DROP_ZONE_OPACITY_ACTIVE = '0.85'

const HOVER_OUT_DEBOUNCE_MS = 50

/** Block types that support inline text editing, mapped to the field name. */
const INLINE_EDITABLE: Record<string, string> = {
  heading: 'text',
  paragraph: 'text',
  button: 'label',
  quote: 'text',
}

// ─── Wire helpers (duplicated here to stay self-contained) ──────

interface Envelope<T> {
  channel: typeof CHANNEL
  payload: T
}

function wrap<T>(payload: T): Envelope<T> {
  return { channel: CHANNEL, payload }
}

function unwrap<T>(data: unknown): T | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'channel' in data &&
    (data as Envelope<T>).channel === CHANNEL
  ) {
    return (data as Envelope<T>).payload
  }
  return null
}

// ─── Message types (duplicated to stay self-contained) ──────────

interface SerializedRect {
  top: number
  left: number
  width: number
  height: number
}

type IframeMessage =
  | { type: 'vb:ready' }
  | { type: 'vb:click'; blockId: string; rect: SerializedRect }
  | { type: 'vb:hover-in'; blockId: string; rect: SerializedRect }
  | { type: 'vb:hover-out' }
  | { type: 'vb:dblclick'; blockId: string; field: string }
  | { type: 'vb:inline-update'; blockId: string; field: string; value: string }
  | { type: 'vb:inline-end'; blockId: string }
  | {
      type: 'vb:drop'
      blockType: string
      targetParentId: string
      targetIndex: number
    }
  | {
      type: 'vb:reorder'
      blockId: string
      newParentId: string
      newIndex: number
    }
  | { type: 'vb:scroll'; scrollTop: number }
  | { type: 'vb:resize'; contentHeight: number }

type ParentMessage =
  | { type: 'vb:init'; blocks: unknown[] }
  | { type: 'vb:update-blocks'; blocks: unknown[] }
  | { type: 'vb:select'; blockId: string | null }
  | { type: 'vb:hover'; blockId: string | null }
  | { type: 'vb:start-drag'; blockType: string }
  | { type: 'vb:end-drag' }
  | { type: 'vb:enable-inline-edit'; blockId: string; field: string }

// ─── Helpers ────────────────────────────────────────────────────

function sendToParent(msg: IframeMessage): void {
  window.parent.postMessage(wrap(msg), '*')
}

function closestBlock(el: Element | null): HTMLElement | null {
  if (!el) return null
  return el.closest<HTMLElement>(`[${BLOCK_ATTR}]`)
}

function rectOf(el: HTMLElement): SerializedRect {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function allBlockElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[${BLOCK_ATTR}]`))
}

function blockElement(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${BLOCK_ATTR}="${id}"]`)
}

// ─── Styles ─────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('vb-canvas-styles')) return

  const style = document.createElement('style')
  style.id = 'vb-canvas-styles'
  style.textContent = `
    .${SELECT_CLASS} {
      outline: 2px solid #7C4DFF !important;
      outline-offset: 1px;
    }
    .${HOVER_CLASS} {
      outline: 2px dashed #B388FF !important;
      outline-offset: 1px;
    }
    .${DROP_ZONE_CLASS} {
      position: absolute;
      left: 0;
      right: 0;
      height: ${DROP_ZONE_HEIGHT}px;
      background: ${DROP_ZONE_COLOR};
      opacity: ${DROP_ZONE_OPACITY_IDLE};
      pointer-events: none;
      z-index: 9999;
      border-radius: 2px;
      transition: opacity 0.15s ease;
    }
    .${DROP_ZONE_ACTIVE_CLASS} {
      opacity: ${DROP_ZONE_OPACITY_ACTIVE};
      pointer-events: auto;
    }
    [contenteditable="true"] {
      outline: 2px solid #7C4DFF !important;
      outline-offset: 2px;
      cursor: text;
    }
  `
  document.head.appendChild(style)
}

// ─── Main entry ─────────────────────────────────────────────────

let _scriptInitialised = false

export function initCanvasScript(): void {
  if (_scriptInitialised) return
  _scriptInitialised = true

  injectStyles()

  // State
  let currentSelectedId: string | null = null
  let currentHoveredId: string | null = null
  let hoverOutTimer: ReturnType<typeof setTimeout> | null = null
  let activeDragType: string | null = null
  let dropZones: HTMLElement[] = []
  let activeDropZoneIndex: number | null = null
  let currentlyEditing: { blockId: string; field: string; el: HTMLElement } | null = null

  // ── 1. Tell parent we're ready ────────────────────────────────

  sendToParent({ type: 'vb:ready' })

  // ── 2. Click handler ──────────────────────────────────────────

  document.addEventListener('click', (e) => {
    // Don't interfere with inline editing
    if (currentlyEditing) return

    const target = e.target as Element
    const block = closestBlock(target)

    if (!block) return
    e.preventDefault()
    e.stopPropagation()

    const blockId = block.getAttribute(BLOCK_ATTR)!
    sendToParent({ type: 'vb:click', blockId, rect: rectOf(block) })
  })

  // ── 3. Hover handler ─────────────────────────────────────────

  document.addEventListener('mouseover', (e) => {
    const target = e.target as Element
    const block = closestBlock(target)

    if (!block) return
    const blockId = block.getAttribute(BLOCK_ATTR)!

    // Don't send redundant hovers
    if (blockId === currentHoveredId) return

    if (hoverOutTimer) {
      clearTimeout(hoverOutTimer)
      hoverOutTimer = null
    }

    currentHoveredId = blockId
    sendToParent({ type: 'vb:hover-in', blockId, rect: rectOf(block) })
  })

  document.addEventListener('mouseout', (e) => {
    const target = e.target as Element
    const block = closestBlock(target)
    if (!block) return

    const relatedBlock = closestBlock(e.relatedTarget as Element | null)
    if (relatedBlock === block) return

    // Debounce hover-out to prevent flickering when moving between
    // child elements of the same block.
    if (hoverOutTimer) clearTimeout(hoverOutTimer)

    hoverOutTimer = setTimeout(() => {
      currentHoveredId = null
      sendToParent({ type: 'vb:hover-out' })
      hoverOutTimer = null
    }, HOVER_OUT_DEBOUNCE_MS)
  })

  // ── 4. Double-click handler (inline editing) ──────────────────

  document.addEventListener('dblclick', (e) => {
    const target = e.target as Element
    const block = closestBlock(target)
    if (!block) return

    const blockId = block.getAttribute(BLOCK_ATTR)!
    const blockType = block.getAttribute(BLOCK_TYPE_ATTR)
    if (!blockType) return

    const field = INLINE_EDITABLE[blockType]
    if (!field) return

    e.preventDefault()
    e.stopPropagation()

    sendToParent({ type: 'vb:dblclick', blockId, field })
    startInlineEdit(block, blockId, field)
  })

  function startInlineEdit(
    block: HTMLElement,
    blockId: string,
    field: string,
  ): void {
    // Find the element to make editable. We look for [data-field="<field>"]
    // inside the block, falling back to the block element itself.
    const fieldEl =
      block.querySelector<HTMLElement>(`[data-field="${field}"]`) || block

    fieldEl.setAttribute('contenteditable', 'true')
    fieldEl.focus()

    currentlyEditing = { blockId, field, el: fieldEl }

    const onBlur = () => {
      fieldEl.removeAttribute('contenteditable')
      sendToParent({
        type: 'vb:inline-update',
        blockId,
        field,
        value: fieldEl.innerText,
      })
      sendToParent({ type: 'vb:inline-end', blockId })
      currentlyEditing = null
      fieldEl.removeEventListener('blur', onBlur)
      fieldEl.removeEventListener('keydown', onKeydown)
    }

    const onKeydown = (ev: KeyboardEvent) => {
      // Escape cancels editing
      if (ev.key === 'Escape') {
        fieldEl.removeAttribute('contenteditable')
        currentlyEditing = null
        sendToParent({ type: 'vb:inline-end', blockId })
        fieldEl.removeEventListener('blur', onBlur)
        fieldEl.removeEventListener('keydown', onKeydown)
      }
      // Enter commits for single-line types
      if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault()
        fieldEl.blur() // triggers onBlur -> sends update
      }
    }

    fieldEl.addEventListener('blur', onBlur)
    fieldEl.addEventListener('keydown', onKeydown)
  }

  // ── 5. Drag & drop target zones ──────────────────────────────

  function createDropZones(): void {
    removeDropZones()

    const blocks = allBlockElements()

    // Empty page: create a single full-width drop zone
    if (blocks.length === 0) {
      dropZones.push(
        makeDropZoneElement(
          100, // some offset from top
          0,
          document.body.clientWidth,
          'root',
          0,
        ),
      )
      return
    }

    blocks.forEach((block, index) => {
      const rect = block.getBoundingClientRect()
      const scrollTop = window.scrollY
      const parentId = getParentBlockId(block)

      // Zone above the first block, or between blocks
      if (index === 0) {
        dropZones.push(
          makeDropZoneElement(
            rect.top + scrollTop - DROP_ZONE_HEIGHT / 2,
            rect.left,
            rect.width,
            parentId,
            0,
          ),
        )
      }

      // Zone below each block
      dropZones.push(
        makeDropZoneElement(
          rect.bottom + scrollTop - DROP_ZONE_HEIGHT / 2,
          rect.left,
          rect.width,
          parentId,
          index + 1,
        ),
      )
    })
  }

  function makeDropZoneElement(
    top: number,
    left: number,
    width: number,
    parentId: string,
    index: number,
  ): HTMLElement {
    const el = document.createElement('div')
    el.className = DROP_ZONE_CLASS
    el.style.top = `${top}px`
    el.style.left = `${left}px`
    el.style.width = `${width}px`
    el.dataset.parentId = parentId
    el.dataset.index = String(index)
    document.body.appendChild(el)
    return el
  }

  function removeDropZones(): void {
    dropZones.forEach((el) => el.remove())
    dropZones = []
    activeDropZoneIndex = null
  }

  function getParentBlockId(el: HTMLElement): string {
    const parent = el.parentElement
    if (!parent) return 'root'
    const parentBlock = closestBlock(parent)
    return parentBlock ? parentBlock.getAttribute(BLOCK_ATTR)! : 'root'
  }

  function findNearestDropZone(clientY: number): number | null {
    if (dropZones.length === 0) return null

    let closest = 0
    let closestDist = Infinity

    dropZones.forEach((zone, i) => {
      const rect = zone.getBoundingClientRect()
      const mid = rect.top + rect.height / 2
      const dist = Math.abs(clientY - mid)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })

    return closest
  }

  function highlightDropZone(index: number | null): void {
    dropZones.forEach((zone, i) => {
      if (i === index) {
        zone.classList.add(DROP_ZONE_ACTIVE_CLASS)
      } else {
        zone.classList.remove(DROP_ZONE_ACTIVE_CLASS)
      }
    })
    activeDropZoneIndex = index
  }

  // ── Detect drag from parent via dataTransfer (fallback for race condition)
  function detectDragFromTransfer(e: DragEvent): boolean {
    if (activeDragType) return true
    // Check if the drag carries our custom type or plain text as a block type
    if (e.dataTransfer?.types?.includes('text/overcms-block')) return true
    if (e.dataTransfer?.types?.includes('text/plain')) return true
    return false
  }

  // Global dragover/drop listeners for when parent initiates a drag
  document.addEventListener('dragover', (e) => {
    if (!detectDragFromTransfer(e)) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'

    // Lazily create drop zones if the postMessage hasn't arrived yet
    if (!activeDragType && dropZones.length === 0) {
      activeDragType = '__pending__'
      createDropZones()
    }

    const nearest = findNearestDropZone(e.clientY)
    highlightDropZone(nearest)
  })

  document.addEventListener('dragleave', (e) => {
    if (!activeDragType) return
    // Only remove highlight if we truly left the document
    if (!e.relatedTarget || !(e.relatedTarget as Element).closest?.('body')) {
      highlightDropZone(null)
    }
  })

  document.addEventListener('drop', (e) => {
    if (!activeDragType && !detectDragFromTransfer(e)) return
    e.preventDefault()

    // Resolve the block type: prefer activeDragType set via postMessage,
    // fall back to reading from dataTransfer
    const blockType =
      (activeDragType && activeDragType !== '__pending__')
        ? activeDragType
        : e.dataTransfer?.getData('text/overcms-block')
          || e.dataTransfer?.getData('text/plain')
          || null

    if (blockType && activeDropZoneIndex !== null) {
      const zone = dropZones[activeDropZoneIndex]
      if (zone) {
        sendToParent({
          type: 'vb:drop',
          blockType,
          targetParentId: zone.dataset.parentId || 'root',
          targetIndex: parseInt(zone.dataset.index || '0', 10),
        })
      }
    }

    activeDragType = null
    removeDropZones()
  })

  // ── 6. Scroll / resize reporting ──────────────────────────────

  let scrollRafPending = false
  window.addEventListener('scroll', () => {
    if (scrollRafPending) return
    scrollRafPending = true
    requestAnimationFrame(() => {
      sendToParent({ type: 'vb:scroll', scrollTop: window.scrollY })
      scrollRafPending = false
    })
  })

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === document.body) {
        sendToParent({
          type: 'vb:resize',
          contentHeight: document.body.scrollHeight,
        })
      }
    }
  })
  resizeObserver.observe(document.body)

  // ── 7. Listen for parent messages ─────────────────────────────

  window.addEventListener('message', (event: MessageEvent) => {
    const msg = unwrap<ParentMessage>(event.data)
    if (!msg) return

    switch (msg.type) {
      case 'vb:select': {
        // Remove previous selection
        document.querySelectorAll(`.${SELECT_CLASS}`).forEach((el) => {
          el.classList.remove(SELECT_CLASS)
        })

        currentSelectedId = msg.blockId
        if (msg.blockId) {
          const el = blockElement(msg.blockId)
          if (el) el.classList.add(SELECT_CLASS)
        }
        break
      }

      case 'vb:hover': {
        // Remove previous hover
        document.querySelectorAll(`.${HOVER_CLASS}`).forEach((el) => {
          el.classList.remove(HOVER_CLASS)
        })

        if (msg.blockId) {
          const el = blockElement(msg.blockId)
          // Don't add hover class if the block is already selected
          if (el && msg.blockId !== currentSelectedId) {
            el.classList.add(HOVER_CLASS)
          }
        }
        break
      }

      case 'vb:start-drag': {
        activeDragType = msg.blockType
        createDropZones()
        break
      }

      case 'vb:end-drag': {
        activeDragType = null
        removeDropZones()
        break
      }

      case 'vb:enable-inline-edit': {
        const el = blockElement(msg.blockId)
        if (el) {
          startInlineEdit(el, msg.blockId, msg.field)
        }
        break
      }

      case 'vb:update-blocks': {
        // Dispatch a custom event so the preview page's rendering
        // framework can pick it up and re-render.
        window.dispatchEvent(
          new CustomEvent('vb:update-blocks', { detail: msg.blocks }),
        )
        break
      }

      case 'vb:init': {
        // Dispatch a custom event for initial block load.
        window.dispatchEvent(
          new CustomEvent('vb:init', { detail: msg.blocks }),
        )
        break
      }
    }
  })
}
