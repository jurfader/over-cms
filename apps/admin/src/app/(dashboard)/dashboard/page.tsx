'use client'

import { motion, type Variants } from 'framer-motion'
import { FileText, Image, Users, Globe, TrendingUp, Clock, Eye, ArrowUpRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface StatsResponse {
  contentTypes: number
  contentItems: number
  mediaFiles: number
  users: number
}

interface ContentItem {
  id: string
  title: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  updatedAt: string
  slug: string
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const statCards = [
  {
    label: 'Typy treści',
    key: 'contentTypes' as const,
    icon: Globe,
    color: 'text-[var(--color-secondary)]',
    bg: 'bg-[var(--color-secondary-muted)]',
    href: '/content',
  },
  {
    label: 'Wpisy',
    key: 'contentItems' as const,
    icon: FileText,
    color: 'text-[var(--color-primary)]',
    bg: 'bg-[var(--color-primary-muted)]',
    href: '/content',
  },
  {
    label: 'Pliki media',
    key: 'mediaFiles' as const,
    icon: Image,
    color: 'text-[var(--color-info)]',
    bg: 'bg-[var(--color-info)]/15',
    href: '/media',
  },
  {
    label: 'Użytkownicy',
    key: 'users' as const,
    icon: Users,
    color: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success)]/15',
    href: '/users',
  },
]

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'outline'> = {
  published: 'success',
  draft: 'warning',
  scheduled: 'default',
  archived: 'outline',
}

const statusLabel: Record<string, string> = {
  published: 'Opublikowany',
  draft: 'Szkic',
  scheduled: 'Zaplanowany',
  archived: 'Zarchiwizowany',
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () =>
      api.get<StatsResponse>('/api/content-types').then(async (types) => {
        const count = Array.isArray(types) ? types.length : 0
        return { contentTypes: count, contentItems: 0, mediaFiles: 0, users: 0 }
      }),
    staleTime: 60_000,
  })

  const { data: recentContent } = useQuery({
    queryKey: ['content', 'recent'],
    queryFn: () =>
      api
        .get<{ items: ContentItem[] }>('/api/content/page?limit=5&sort=updatedAt&order=desc')
        .catch(() => ({ items: [] as ContentItem[] })),
    staleTime: 30_000,
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Cześć' : 'Dobry wieczór'

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            {greeting},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'Adminie'}</span>
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Oto przegląd Twojego CMS-a
          </p>
        </div>
        <Button asChild>
          <Link href="/content">
            <FileText className="w-4 h-4" />
            Nowy wpis
          </Link>
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const value = stats?.[stat.key] ?? 0

          return (
            <Link key={stat.key} href={stat.href}>
              <div className="glass-card rounded-[var(--radius-lg)] p-5 hover:border-[var(--color-border-hover)] transition-all duration-200 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-[var(--radius)] ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[var(--color-subtle)] group-hover:text-[var(--color-muted-foreground)] transition-colors" />
                </div>
                <div>
                  {statsLoading ? (
                    <div className="h-7 w-12 rounded-[var(--radius-sm)] animate-shimmer mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-[var(--color-foreground)]">{value}</p>
                  )}
                  <p className="text-xs text-[var(--color-muted-foreground)]">{stat.label}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </motion.div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent content */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                <h2 className="text-sm font-semibold">Ostatnie wpisy</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/content">
                  Wszystkie
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>

            <div className="space-y-2">
              {recentContent?.items && recentContent.items.length > 0 ? (
                recentContent.items.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius)] hover:bg-[var(--color-surface-elevated)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-[var(--radius-sm)] gradient-bg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                        {c.title}
                      </p>
                      <p className="text-xs text-[var(--color-subtle)]">{formatDate(c.updatedAt)}</p>
                    </div>
                    <Badge variant={statusVariant[c.status] ?? 'outline'}>
                      {statusLabel[c.status] ?? c.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[var(--color-subtle)]">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Brak wpisów</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/content">Dodaj pierwszy wpis</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick actions + info */}
        <motion.div variants={item} className="space-y-4">
          {/* Quick actions */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-sm font-semibold">Szybkie akcje</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Dodaj stronę', href: '/content?type=page', icon: Globe },
                { label: 'Wgraj media', href: '/media', icon: Image },
                { label: 'Edytuj SEO', href: '/seo', icon: Eye },
                { label: 'Ustawienia', href: '/settings', icon: Users },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 p-2.5 rounded-[var(--radius)] hover:bg-[var(--color-surface-elevated)] transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-[var(--color-subtle)] group-hover:text-[var(--color-primary)] transition-colors" />
                    <span className="text-sm text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] transition-colors">
                      {action.label}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-[var(--color-subtle)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )
              })}
            </div>
          </Card>

          {/* System status */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              <h2 className="text-sm font-semibold">Status systemu</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'API', status: 'online' },
                { label: 'Baza danych', status: 'online' },
                { label: 'Storage', status: 'online' },
                { label: 'Cache', status: 'online' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-muted-foreground)]">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                    <span className="text-xs text-[var(--color-success)]">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
