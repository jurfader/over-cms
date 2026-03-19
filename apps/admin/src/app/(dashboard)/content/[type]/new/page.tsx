'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { ContentEditor } from '@/components/content/content-editor'
import { api } from '@/lib/api'
import type { ContentType } from '@/types/content'

export default function NewContentPage() {
  const { type } = useParams<{ type: string }>()

  const { data: contentType, isLoading } = useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.get<{ data: ContentType[] }>('/api/content-types'),
    select: (res) => res.data.find((t) => t.slug === type),
  })

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

  return <ContentEditor contentType={contentType} typeSlug={type} />
}
