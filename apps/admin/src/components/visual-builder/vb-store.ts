import { create } from 'zustand'
import type { Block, BlockStyle, BlockType } from '../editor/types'
import { createBlock, columnsForStructure } from '../editor/types'
import * as tree from './vb-tree-ops'

// ─── Structural types ───────────────────────────────────────────────────────

const STRUCTURAL_TYPES = new Set<BlockType>(['section', 'row', 'column'])

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_HISTORY = 50

// ─── State interface ─────────────────────────────────────────────────────────

export interface VisualBuilderState {
  // Block tree
  blocks: Block[]

  // Page metadata (set during init, used by toolbar for save)
  pageId: string | null
  pageTitle: string
  pageSlug: string

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
  init: (blocks: Block[], meta?: { pageId: string; title: string; slug: string }) => void
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
  setPageTitle: (title: string) => void
  markClean: () => void
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

  pageId: null,
  pageTitle: '',
  pageSlug: '',

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

  init: (blocks, meta) =>
    set({
      blocks,
      selectedBlockId: null,
      hoveredBlockId: null,
      past: [],
      future: [],
      isDirty: false,
      ...(meta
        ? { pageId: meta.pageId, pageTitle: meta.title, pageSlug: meta.slug }
        : {}),
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  hoverBlock: (id) => set({ hoveredBlockId: id }),

  updateBlockData: (id, data) => {
    const state = get()
    const newBlocks = tree.updateInTree(state.blocks, id, (b) => {
      const merged = { ...b.data, ...data }

      // When changing column structure on a row, regenerate column children
      if (b.type === 'row' && data.columnStructure && data.columnStructure !== b.data.columnStructure) {
        const newCols = columnsForStructure(data.columnStructure as string)
        const oldCols = b.children ?? []
        // Preserve existing column content where possible
        for (let i = 0; i < Math.min(oldCols.length, newCols.length); i++) {
          newCols[i]!.children = oldCols[i]?.children ?? []
        }
        return { ...b, data: merged, children: newCols }
      }

      return { ...b, data: merged }
    })
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
    const isModule = !STRUCTURAL_TYPES.has(type)

    // ── Auto-wrapping: wrap bare modules in the required structure ──────
    // Dropping at root (parentId === 'root') with a non-structural module:
    //   → Section > Row > Column > Module
    // Dropping into a section with a non-structural module:
    //   → Row > Column > Module
    // Dropping into a row with a non-structural module:
    //   → Column > Module

    let blockToInsert: Block = block
    const effectiveParentId = parentId

    if (isModule) {
      const parentBlock = parentId !== 'root'
        ? tree.findInTree(state.blocks, parentId)
        : null
      const parentType = parentBlock?.type

      if (parentId === 'root') {
        // Wrap: Section → Row → Column → Module
        const column = createBlock('column')
        column.children = [block]
        const row = createBlock('row')
        row.children = [column]
        const section = createBlock('section')
        section.children = [row]
        blockToInsert = section
      } else if (parentType === 'section') {
        // Wrap: Row → Column → Module
        const column = createBlock('column')
        column.children = [block]
        const row = createBlock('row')
        row.children = [column]
        blockToInsert = row
      } else if (parentType === 'row') {
        // Wrap: Column → Module
        const column = createBlock('column')
        column.children = [block]
        blockToInsert = column
      }
      // If parentType === 'column' → insert directly (no wrapping needed)
    }

    let newBlocks: Block[]

    if (effectiveParentId === 'root') {
      // Insert at root level (top-level blocks array)
      const clampedIndex = index !== undefined
        ? Math.max(0, Math.min(index, state.blocks.length))
        : state.blocks.length
      newBlocks = [...state.blocks]
      newBlocks.splice(clampedIndex, 0, blockToInsert)
    } else {
      newBlocks =
        index !== undefined
          ? tree.insertAt(state.blocks, effectiveParentId, index, blockToInsert)
          : tree.addChildTo(state.blocks, effectiveParentId, blockToInsert)
    }

    set({
      blocks: newBlocks,
      selectedBlockId: block.id, // Select the innermost module
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

  setPageTitle: (title) => set({ pageTitle: title, isDirty: true }),

  markClean: () => set({ isDirty: false }),
}))
