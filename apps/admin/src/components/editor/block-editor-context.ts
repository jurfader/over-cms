import { createContext, useContext } from 'react'
import type { Block } from './types'

// Context that carries the BlockEditor component down the tree
// so block-editors.tsx can use it without a circular import.

export interface InnerBlockEditorProps {
  value:    Block[]
  onChange: (blocks: Block[]) => void
  compact?: boolean
}

export const InnerBlockEditorCtx =
  createContext<React.ComponentType<InnerBlockEditorProps> | null>(null)

export function useInnerBlockEditor() {
  return useContext(InnerBlockEditorCtx)
}
