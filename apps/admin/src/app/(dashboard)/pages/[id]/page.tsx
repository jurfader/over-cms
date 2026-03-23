'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { PageEditor } from '@/components/pages/page-editor'
import { api } from '@/lib/api'
import type { ContentType, ContentItem } from '@/types/content'

export default function EditPagePage() {
  const { id } = useParams<{ id: string }>()

  const { data: contentType, isLoading: typeLoading } = useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.get<{ data: ContentType[] }>('/api/content-types'),
    select: (res) => res.data.find((t) => t.slug === 'page'),
  })

  const { data: itemData, isLoading: itemLoading } = useQuery({
    queryKey: ['content-item', 'page', id],
    queryFn: () => api.get<{ data: { item: ContentItem } }>(`/api/content/page/${id}`),
    enabled: !!id,
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
        Nie znaleziono typu treści: <code className="font-mono">page</code>
      </div>
    )
  }

  const item = itemData?.data?.item

  return <PageEditor contentType={contentType} item={item} />
}
