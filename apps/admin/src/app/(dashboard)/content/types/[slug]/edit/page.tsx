'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { ContentTypeEditor } from '@/components/content/content-type-editor'
import { api } from '@/lib/api'
import type { ContentType } from '@/types/content'

export default function EditContentTypePage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: contentType, isLoading } = useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.get<{ data: ContentType[] }>('/api/content-types'),
    select: (res) => res.data.find((t) => t.slug === slug),
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
        Nie znaleziono typu treści: <code className="font-mono">{slug}</code>
      </div>
    )
  }

  return <ContentTypeEditor type={contentType} />
}
