'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { VisualBuilder } from '@/components/visual-builder/visual-builder'
import type { ContentType, ContentItem } from '@/types/content'
import type { Block } from '@/components/editor/types'

interface ContentTypeResponse {
  data: ContentType[]
}

interface ContentItemResponse {
  data: {
    item: ContentItem
  }
}

export default function VisualBuilderPage() {
  const { id } = useParams<{ id: string }>()

  const { data: typesData } = useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.get<ContentTypeResponse>('/api/content-types'),
  })

  const { data: itemData, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: () => api.get<ContentItemResponse>(`/api/content/page/${id}`),
    enabled: !!id,
  })

  const pageType = typesData?.data?.find((t) => t.slug === 'page')
  const item = itemData?.data?.item

  if (isLoading || !pageType || !item) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  return (
    <VisualBuilder
      pageId={id}
      initialBlocks={(item.data?.blocks ?? []) as Block[]}
      initialTitle={item.title}
      initialSlug={item.slug}
      contentType={pageType}
    />
  )
}
