'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PanelTop, PanelBottom, Loader2, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import type { ContentType, ContentItem } from '@/types/content'

const GLOBAL_TEMPLATES = [
  { slug: 'global_header', label: 'Header (Nagłówek)', description: 'Globalny nagłówek strony — logo, menu, CTA', icon: PanelTop },
  { slug: 'global_footer', label: 'Footer (Stopka)',   description: 'Globalna stopka strony — linki, kontakt, social media', icon: PanelBottom },
]

export default function TemplatesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: types } = useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.get<{ data: ContentType[] }>('/api/content-types'),
  })

  // Fetch existing items for each global template type
  const { data: headerItems } = useQuery({
    queryKey: ['global-header-items'],
    queryFn: () => api.get<{ data: Array<{ item: ContentItem }>; meta: unknown }>('/api/content/global_header?limit=1'),
    retry: false,
  })

  const { data: footerItems } = useQuery({
    queryKey: ['global-footer-items'],
    queryFn: () => api.get<{ data: Array<{ item: ContentItem }>; meta: unknown }>('/api/content/global_footer?limit=1'),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: async (typeSlug: string) => {
      const label = typeSlug === 'global_header' ? 'Header' : 'Footer'
      const res = await api.post<{ data: ContentItem }>(`/api/content/${typeSlug}`, {
        title: label,
        slug: typeSlug.replace('global_', ''),
        data: { blocks: [] },
        status: 'published',
      })
      return res.data
    },
    onSuccess: (item, typeSlug) => {
      queryClient.invalidateQueries({ queryKey: [`global-${typeSlug.replace('global_', '')}-items`] })
      router.push(`/pages/${item.id}/visual-builder`)
    },
  })

  function getExistingItem(slug: string): ContentItem | null {
    if (slug === 'global_header') {
      return headerItems?.data?.[0]?.item ?? null
    }
    if (slug === 'global_footer') {
      return footerItems?.data?.[0]?.item ?? null
    }
    return null
  }

  function hasContentType(slug: string): boolean {
    return types?.data?.some((t) => t.slug === slug) ?? false
  }

  const createTypeMutation = useMutation({
    mutationFn: async (tpl: typeof GLOBAL_TEMPLATES[number]) => {
      await api.post('/api/content-types', {
        slug: tpl.slug,
        name: tpl.label,
        description: tpl.description,
        icon: tpl.slug === 'global_header' ? 'panel-top' : 'panel-bottom',
        isSingleton: true,
        fieldsSchema: [],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Szablony globalne</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Edytuj nagłówek i stopkę wyświetlane na każdej stronie witryny.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GLOBAL_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon
          const typeExists = hasContentType(tpl.slug)
          const existing = getExistingItem(tpl.slug)

          return (
            <div
              key={tpl.slug}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-foreground)]">{tpl.label}</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{tpl.description}</p>
                </div>
              </div>

              {!typeExists ? (
                <Button
                  onClick={() => createTypeMutation.mutate(tpl)}
                  disabled={createTypeMutation.isPending}
                  className="w-full"
                >
                  {createTypeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Aktywuj szablon
                </Button>
              ) : existing ? (
                <Button
                  onClick={() => router.push(`/pages/${existing.id}/visual-builder`)}
                  className="w-full"
                >
                  Edytuj w Visual Builder
                </Button>
              ) : (
                <Button
                  onClick={() => createMutation.mutate(tpl.slug)}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Utwórz szablon
                </Button>
              )}

              {existing && (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Status: <span className={existing.status === 'published' ? 'text-green-500' : 'text-yellow-500'}>
                    {existing.status === 'published' ? 'Opublikowany' : 'Szkic'}
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
