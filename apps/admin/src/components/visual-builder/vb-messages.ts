/**
 * Type-safe postMessage protocol between parent (admin) and iframe (preview).
 *
 * Every message is wrapped in an envelope with a discriminating `channel`
 * field so we can safely ignore messages that don't belong to us.
 */

const CHANNEL = 'overcms-vb' as const

// ─── Serialisation helpers ──────────────────────────────────────

export interface SerializedRect {
  top: number
  left: number
  width: number
  height: number
}

/** Simplified block for serialisation (same shape as Block but JSON-safe). */
export type SerializedBlock = Record<string, unknown>

// ─── Parent -> Iframe messages ──────────────────────────────────

export type ParentMessage =
  | { type: 'vb:init'; blocks: SerializedBlock[] }
  | { type: 'vb:update-blocks'; blocks: SerializedBlock[] }
  | { type: 'vb:select'; blockId: string | null }
  | { type: 'vb:hover'; blockId: string | null }
  | { type: 'vb:start-drag'; blockType: string }
  | { type: 'vb:end-drag' }
  | { type: 'vb:enable-inline-edit'; blockId: string; field: string }

// ─── Iframe -> Parent messages ──────────────────────────────────

export type IframeMessage =
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

// ─── Wire format ────────────────────────────────────────────────

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

// ─── Send helpers ───────────────────────────────────────────────

/**
 * Send a message from the admin (parent) window into the preview iframe.
 *
 * @param iframe  The HTMLIFrameElement hosting the preview.
 * @param msg     A type-safe ParentMessage to send.
 */
export function sendToIframe(
  iframe: HTMLIFrameElement,
  msg: ParentMessage,
): void {
  if (!iframe.contentWindow) return
  iframe.contentWindow.postMessage(wrap(msg), '*')
}

/**
 * Send a message from the preview iframe back to the admin (parent) window.
 *
 * @param msg  A type-safe IframeMessage to send.
 */
export function sendToParent(msg: IframeMessage): void {
  window.parent.postMessage(wrap(msg), '*')
}

// ─── Listener helpers ───────────────────────────────────────────

/**
 * Register a listener **inside the iframe** for messages coming from the parent.
 *
 * @returns A cleanup function that removes the event listener.
 */
export function onParentMessage(
  handler: (msg: ParentMessage) => void,
): () => void {
  const listener = (event: MessageEvent) => {
    const msg = unwrap<ParentMessage>(event.data)
    if (msg) handler(msg)
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

/**
 * Register a listener **in the parent window** for messages coming from the
 * iframe.
 *
 * @returns A cleanup function that removes the event listener.
 */
export function onIframeMessage(
  handler: (msg: IframeMessage) => void,
): () => void {
  const listener = (event: MessageEvent) => {
    const msg = unwrap<IframeMessage>(event.data)
    if (msg) handler(msg)
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}
