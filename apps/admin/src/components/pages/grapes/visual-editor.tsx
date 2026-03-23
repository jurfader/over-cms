'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

export interface VisualEditorProps {
  pageId?: string
  initialTitle?: string
  initialSlug?: string
  initialProject?: unknown
  initialHtml?: string
  onSave: (data: { html: string; css: string; project: unknown }) => Promise<void>
}

const VisualEditor = dynamic<VisualEditorProps>(
  () => import('./grapes-editor').then((m) => m.GrapesEditor) as never,
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Ładowanie edytora wizualnego...
          </p>
        </div>
      </div>
    ),
  },
)

export { VisualEditor }
