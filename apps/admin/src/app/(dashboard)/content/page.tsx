'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  FileText, BookOpen, Briefcase, Layers, Plus, ArrowRight,
  Settings, LayoutGrid, Globe, Newspaper, FolderKanban,
} from 'lucide-react'
import { type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import type { ContentType } from '@/types/content'

// Mapowanie ikon po nazwie (Lucide)
const iconComponents: Record<string, React.ElementType> = {
  FileText, BookOpen, Briefcase, Layers, Globe, Newspaper,
  FolderKanban, LayoutGrid, Settings,
}

function getIcon(name: string | null): React.ElementType {
  if (!name) return Layers
  return iconComponents[name] ?? Layers
}

const iconColors: Record<string, string> = {
  page:    'text-blue-400 bg-blue-400/10',
  post:    'text-purple-400 bg-purple-400/10',
  project: 'text-emerald-400 bg-emerald-400/10',
}

function getIconColor(slug: string) {
  return iconColors[slug] ?? 'text-[var(--color-primary)] bg-[var(--color-primary-muted)]'
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

interface ContentTypeWithCount extends ContentType {
  _count?: number
}

export default function ContentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.get<{ data: ContentTypeWithCount[] }>('/api/content-types'),
  })

  const types = data?.data ?? []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Treści</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Zarządzaj typami treści i wpisami
          </p>
        </div>
        <Button asChild>
          <Link href="/content/types/new">
            <Plus className="w-4 h-4" />
            Nowy typ
          </Link>
        </Button>
      </div>

      {/* Content Types Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-[var(--radius-lg)] p-6 h-44 animate-shimmer" />
          ))}
        </div>
      ) : types.length === 0 ? (
        <div className="glass-card rounded-[var(--radius-xl)] p-16 text-center">
          <Layers className="w-12 h-12 mx-auto mb-4 text-[var(--color-subtle)] opacity-50" />
          <p className="text-[var(--color-muted-foreground)] font-medium">Brak typów treści</p>
          <p className="text-sm text-[var(--color-subtle)] mt-1 mb-6">
            Utwórz pierwszy typ aby zacząć dodawać treści
          </p>
          <Button asChild>
            <Link href="/content/types/new">
              <Plus className="w-4 h-4" />
              Utwórz typ treści
            </Link>
          </Button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {types.map((type) => {
            const Icon = getIcon(type.icon)
            const colorClass = getIconColor(type.slug)

            return (
              <motion.div key={type.id} variants={item}>
                <div className="glass-card rounded-[var(--radius-lg)] p-6 group flex flex-col gap-4 hover:border-[var(--color-border-hover)] transition-all duration-200">
                  {/* Icon + name */}
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-[var(--radius)] flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {type.isSingleton && (
                      <Badge variant="outline" className="text-[10px]">Singleton</Badge>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--color-foreground)]">{type.name}</h3>
                    <p className="text-xs text-[var(--color-subtle)] mt-0.5 font-mono">/{type.slug}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                      {type.fieldsSchema?.length ?? 0} pól
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/content/${type.slug}`}>
                        <Plus className="w-3.5 h-3.5" />
                        Wpisy
                        <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                      <Link href={`/content/types/${type.slug}/edit`} title="Edytuj typ">
                        <Settings className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
