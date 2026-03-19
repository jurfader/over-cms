'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { ContentEditor } from '@/components/content/content-editor'
import { api } from '@/lib/api'
import type { ContentType, ContentItem } from '@/types/content'

export default function EditContentPage() {
  const { type, id } = useParams<{ type: string; id: string }>()

  const { data: contentType, isLoading: typeLoading } = useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.get<{ data: ContentType[] }>('/api/content-types'),
    select: (res) => res.data.find((t) => t.slug === type),
  })

  const { data: itemData, isLoading: itemLoading } = useQuery({
    queryKey: ['content-item', type, id],
    queryFn: () => api.get<{ data: { item: ContentItem } }>(`/api/content/${type}/${id}`),
    enabled: !!type && !!id,
  })

  const isLoading = typeLoading || itemLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  if (!contentType) {
    return (
      <div className="text-center py-20 text-[var(--color-muted-foreground)]">
        Nie znaleziono typu treści: <code className="font-mono">{type}</code>
      </div>
    )
  }

  const item = itemData?.data?.item

  return <ContentEditor contentType={contentType} item={item} typeSlug={type} />
}
