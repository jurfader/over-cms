import type { Block } from '../editor/types'

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Swap two elements in an array by index (immutable) */
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice()
  const [item] = copy.splice(from, 1) as [T]
  copy.splice(to, 0, item)
  return copy
}

// ─── Existing tree operations (extracted from block-editor.tsx) ──────────────

/** Update a block anywhere in the tree by ID */
export function updateInTree(
  blocks: Block[],
  id: string,
  updater: (b: Block) => Block,
): Block[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b)
    if (b.children?.length) {
      const updatedChildren = updateInTree(b.children, id, updater)
      if (updatedChildren !== b.children) return { ...b, children: updatedChildren }
    }
    return b
  })
}

/** Remove a block anywhere in the tree by ID */
export function removeFromTree(blocks: Block[], id: string): Block[] {
  const result: Block[] = []
  for (const b of blocks) {
    if (b.id === id) continue
    if (b.children?.length) {
      const updatedChildren = removeFromTree(b.children, id)
      result.push(updatedChildren !== b.children ? { ...b, children: updatedChildren } : b)
    } else {
      result.push(b)
    }
  }
  // Return same reference if nothing changed (optimization)
  if (result.length === blocks.length && result.every((b, i) => b === blocks[i])) return blocks
  return result
}

/** Add a child block to the end of a parent's children list */
export function addChildTo(blocks: Block[], parentId: string, child: Block): Block[] {
  return updateInTree(blocks, parentId, (parent) => ({
    ...parent,
    children: [...(parent.children ?? []), child],
  }))
}

/** Move a child block up or down within its parent's children list */
export function moveChildInTree(
  blocks: Block[],
  childId: string,
  direction: 'up' | 'down',
): Block[] {
  // Check top-level
  const topIdx = blocks.findIndex((b) => b.id === childId)
  if (topIdx !== -1) {
    const newIdx = direction === 'up' ? topIdx - 1 : topIdx + 1
    if (newIdx < 0 || newIdx >= blocks.length) return blocks
    return arrayMove(blocks, topIdx, newIdx)
  }
  // Search in children
  return blocks.map((b) => {
    if (!b.children?.length) return b
    const childIdx = b.children.findIndex((c) => c.id === childId)
    if (childIdx !== -1) {
      const newIdx = direction === 'up' ? childIdx - 1 : childIdx + 1
      if (newIdx < 0 || newIdx >= b.children.length) return b
      return { ...b, children: arrayMove(b.children, childIdx, newIdx) }
    }
    const updatedChildren = moveChildInTree(b.children, childId, direction)
    if (updatedChildren !== b.children) return { ...b, children: updatedChildren }
    return b
  })
}

/** Find a block anywhere in the tree by ID */
export function findInTree(blocks: Block[], id: string): Block | undefined {
  for (const b of blocks) {
    if (b.id === id) return b
    if (b.children?.length) {
      const found = findInTree(b.children, id)
      if (found) return found
    }
  }
  return undefined
}

// ─── New tree operations ─────────────────────────────────────────────────────

/** Insert a child block at a specific index within a parent's children */
export function insertAt(
  blocks: Block[],
  parentId: string,
  index: number,
  child: Block,
): Block[] {
  return updateInTree(blocks, parentId, (parent) => {
    const children = parent.children ?? []
    const clampedIndex = Math.max(0, Math.min(index, children.length))
    const newChildren = [...children]
    newChildren.splice(clampedIndex, 0, child)
    return { ...parent, children: newChildren }
  })
}

/** Move a block from its current location to a new parent at a specific index */
export function moveToParent(
  blocks: Block[],
  blockId: string,
  newParentId: string,
  newIndex: number,
): Block[] {
  const block = findInTree(blocks, blockId)
  if (!block) return blocks

  // Remove from current location
  const withoutBlock = removeFromTree(blocks, blockId)

  // Insert at new parent and index
  return insertAt(withoutBlock, newParentId, newIndex, block)
}

/** Duplicate a block (with all children), placing the copy directly after the original */
export function duplicateBlock(blocks: Block[], blockId: string): Block[] {
  // Deep-clone a block, assigning new IDs to the clone and all descendants
  function cloneWithNewIds(block: Block): Block {
    return {
      ...block,
      id: crypto.randomUUID(),
      data: { ...block.data },
      style: block.style ? { ...block.style } : undefined,
      children: block.children?.map(cloneWithNewIds),
    }
  }

  // Try top-level
  const topIdx = blocks.findIndex((b) => b.id === blockId)
  if (topIdx !== -1) {
    const clone = cloneWithNewIds(blocks[topIdx]!)
    const result = [...blocks]
    result.splice(topIdx + 1, 0, clone)
    return result
  }

  // Search in children
  return blocks.map((b) => {
    if (!b.children?.length) return b
    const childIdx = b.children.findIndex((c) => c.id === blockId)
    if (childIdx !== -1) {
      const clone = cloneWithNewIds(b.children[childIdx]!)
      const newChildren = [...b.children]
      newChildren.splice(childIdx + 1, 0, clone)
      return { ...b, children: newChildren }
    }
    const updatedChildren = duplicateBlock(b.children, blockId)
    if (updatedChildren !== b.children) return { ...b, children: updatedChildren }
    return b
  })
}

/** Get the path of ancestor IDs from root to the target block (inclusive) */
export function getBlockPath(blocks: Block[], blockId: string): string[] {
  function walk(nodes: Block[], path: string[]): string[] | null {
    for (const b of nodes) {
      if (b.id === blockId) return [...path, b.id]
      if (b.children?.length) {
        const found = walk(b.children, [...path, b.id])
        if (found) return found
      }
    }
    return null
  }
  return walk(blocks, []) ?? []
}

/** Get the parent ID of a block, or null if the block is at the top level */
export function getParentId(blocks: Block[], blockId: string): string | null {
  const path = getBlockPath(blocks, blockId)
  // path includes the block itself, so the parent is the second-to-last element
  if (path.length < 2) return null
  return path[path.length - 2] ?? null
}
