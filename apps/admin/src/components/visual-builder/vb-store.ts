import { create } from 'zustand'
import type { Block, BlockStyle, BlockType } from '../editor/types'
import { createBlock } from '../editor/types'
import * as tree from './vb-tree-ops'

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_HISTORY = 50

// ─── State interface ─────────────────────────────────────────────────────────

export interface VisualBuilderState {
  // Block tree
  blocks: Block[]

  // Selection
  selectedBlockId: string | null
  hoveredBlockId: string | null

  // Device
  device: 'desktop' | 'tablet' | 'mobile'

  // History (undo/redo)
  past: Block[][]
  future: Block[][]

  // UI
  leftPanel: 'modules' | 'layers' | null
  rightPanelOpen: boolean
  isDragging: boolean
  dragBlockType: BlockType | null

  // Iframe
  iframeReady: boolean

  // Save
  isDirty: boolean

  // Actions
  init: (blocks: Block[]) => void
  selectBlock: (id: string | null) => void
  hoverBlock: (id: string | null) => void
  updateBlockData: (id: string, data: Record<string, unknown>) => void
  updateBlockStyle: (id: string, style: BlockStyle) => void
  addBlock: (type: BlockType, parentId: string, index?: number) => void
  removeBlock: (id: string) => void
  moveBlock: (blockId: string, newParentId: string, newIndex: number) => void
  moveBlockDirection: (id: string, direction: 'up' | 'down') => void
  duplicateBlock: (id: string) => void
  undo: () => void
  redo: () => void
  setDevice: (device: 'desktop' | 'tablet' | 'mobile') => void
  setLeftPanel: (panel: 'modules' | 'layers' | null) => void
  toggleRightPanel: () => void
  setIframeReady: (ready: boolean) => void
  startDrag: (type: BlockType) => void
  endDrag: () => void
}

// ─── History helper ──────────────────────────────────────────────────────────

/** Push current blocks to past, clear future, cap at MAX_HISTORY */
function pushHistory(state: VisualBuilderState): Pick<VisualBuilderState, 'past' | 'future'> {
  const past = [...state.past, state.blocks]
  if (past.length > MAX_HISTORY) past.shift()
  return { past, future: [] }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useVisualBuilderStore = create<VisualBuilderState>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────

  blocks: [],

  selectedBlockId: null,
  hoveredBlockId: null,

  device: 'desktop',

  past: [],
  future: [],

  leftPanel: 'modules',
  rightPanelOpen: true,
  isDragging: false,
  dragBlockType: null,

  iframeReady: false,

  isDirty: false,

  // ── Actions ──────────────────────────────────────────────────────────────

  init: (blocks) =>
    set({
      blocks,
      selectedBlockId: null,
      hoveredBlockId: null,
      past: [],
      future: [],
      isDirty: false,
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  hoverBlock: (id) => set({ hoveredBlockId: id }),

  updateBlockData: (id, data) => {
    const state = get()
    const newBlocks = tree.updateInTree(state.blocks, id, (b) => ({
      ...b,
      data: { ...b.data, ...data },
    }))
    if (newBlocks === state.blocks) return
    set({ blocks: newBlocks, isDirty: true, ...pushHistory(state) })
  },

  updateBlockStyle: (id, style) => {
    const state = get()
    const newBlocks = tree.updateInTree(state.blocks, id, (b) => ({
      ...b,
      style: { ...b.style, ...style },
    }))
    if (newBlocks === state.blocks) return
    set({ blocks: newBlocks, isDirty: true, ...pushHistory(state) })
  },

  addBlock: (type, parentId, index) => {
    const state = get()
    const block = createBlock(type)
    let newBlocks: Block[]

    if (parentId === 'root') {
      // Insert at root level (top-level blocks array)
      const clampedIndex = index !== undefined
        ? Math.max(0, Math.min(index, state.blocks.length))
        : state.blocks.length
      newBlocks = [...state.blocks]
      newBlocks.splice(clampedIndex, 0, block)
    } else {
      newBlocks =
        index !== undefined
          ? tree.insertAt(state.blocks, parentId, index, block)
          : tree.addChildTo(state.blocks, parentId, block)
    }

    set({
      blocks: newBlocks,
      selectedBlockId: block.id,
      isDirty: true,
      ...pushHistory(state),
    })
  },

  removeBlock: (id) => {
    const state = get()
    const newBlocks = tree.removeFromTree(state.blocks, id)
    if (newBlocks === state.blocks) return
    set({
      blocks: newBlocks,
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      isDirty: true,
      ...pushHistory(state),
    })
  },

  moveBlock: (blockId, newParentId, newIndex) => {
    const state = get()
    const newBlocks = tree.moveToParent(state.blocks, blockId, newParentId, newIndex)
    if (newBlocks === state.blocks) return
    set({ blocks: newBlocks, isDirty: true, ...pushHistory(state) })
  },

  moveBlockDirection: (id, direction) => {
    const state = get()
    const newBlocks = tree.moveChildInTree(state.blocks, id, direction)
    if (newBlocks === state.blocks) return
    set({ blocks: newBlocks, isDirty: true, ...pushHistory(state) })
  },

  duplicateBlock: (id) => {
    const state = get()
    const newBlocks = tree.duplicateBlock(state.blocks, id)
    if (newBlocks === state.blocks) return
    set({ blocks: newBlocks, isDirty: true, ...pushHistory(state) })
  },

  undo: () => {
    const state = get()
    if (state.past.length === 0) return
    const previous = state.past[state.past.length - 1]
    const newPast = state.past.slice(0, -1)
    set({
      blocks: previous,
      past: newPast,
      future: [state.blocks, ...state.future],
      isDirty: true,
    })
  },

  redo: () => {
    const state = get()
    if (state.future.length === 0) return
    const next = state.future[0]
    const newFuture = state.future.slice(1)
    set({
      blocks: next,
      past: [...state.past, state.blocks],
      future: newFuture,
      isDirty: true,
    })
  },

  setDevice: (device) => set({ device }),

  setLeftPanel: (panel) => set({ leftPanel: panel }),

  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

  setIframeReady: (ready) => set({ iframeReady: ready }),

  startDrag: (type) => set({ isDragging: true, dragBlockType: type }),

  endDrag: () => set({ isDragging: false, dragBlockType: null }),
}))
