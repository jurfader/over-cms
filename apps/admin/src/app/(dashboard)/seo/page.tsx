'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Globe, Map, Bot, ArrowRightLeft, Save, Plus, Trash2,
  CheckCircle2, AlertCircle, AlertTriangle, Loader2, ExternalLink,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Settings { [key: string]: unknown }

interface SitemapEntry {
  id: string
  title: string
  slug: string
  typeSlug: string
  seo: { title?: string; description?: string; noIndex?: boolean } | null
  updatedAt: string
}

interface Redirect {
  id: string
  fromPath: string
  toPath: string
  statusCode: 301 | 302
  createdAt: string
}

// ─── Tab nav ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'global',      label: 'Globalne',         icon: Globe          },
  { id: 'sitemap',     label: 'Sitemap',           icon: Map            },
  { id: 'robots',      label: 'Robots.txt',        icon: Bot            },
  { id: 'redirects',   label: 'Przekierowania',    icon: ArrowRightLeft },
] as const

type TabId = typeof TABS[number]['id']

// ─── SEO score helper ─────────────────────────────────────────────────────────

function seoScore(entry: SitemapEntry) {
  const title = entry.seo?.title ?? entry.title
  const desc  = entry.seo?.description ?? ''
  const issues: string[] = []

  if (!title || title.length < 10)           issues.push('Brak tytułu')
  else if (title.length > 60)                issues.push('Tytuł za długi (>60)')
  if (!desc)                                 issues.push('Brak opisu')
  else if (desc.length < 50)                 issues.push('Opis za krótki (<50)')
  else if (desc.length > 160)               issues.push('Opis za długi (>160)')
  if (entry.seo?.noIndex)                    issues.push('noindex')

  if (issues.length === 0) return { status: 'ok',      color: 'text-[var(--color-success)]',      icon: CheckCircle2,  issues }
  if (issues.length <= 1)  return { status: 'warning', color: 'text-[var(--color-warning,#f59e0b)]', icon: AlertTriangle, issues }
  return                          { status: 'error',   color: 'text-[var(--color-destructive)]',  icon: AlertCircle,   issues }
}

// ─── Tab: Global SEO ─────────────────────────────────────────────────────────

function GlobalTab() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: Settings }>('/api/settings'),
    select: (r) => r.data,
  })

  const { register, handleSubmit } = useForm<Settings>({
    values: data ?? {},
  })

  const mutation = useMutation({
    mutationFn: (values: Settings) => api.put('/api/settings', values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)] mt-8 mx-auto" />

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6 max-w-2xl">
      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Witryna</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nazwa serwisu</Label>
            <Input {...register('site.name')} placeholder="Moja strona" defaultValue={data?.['site.name'] as string ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label>URL serwisu</Label>
            <Input {...register('site.url')} placeholder="https://example.com" defaultValue={data?.['site.url'] as string ?? ''} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Domyślny opis meta</Label>
          <Textarea
            {...register('site.description')}
            placeholder="Krótki opis serwisu (do 160 znaków)"
            rows={2}
            defaultValue={data?.['site.description'] as string ?? ''}
          />
        </div>
      </div>

      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Open Graph</h2>

        <div className="space-y-1.5">
          <Label>Domyślny obraz OG</Label>
          <Input {...register('seo.defaultOgImage')} placeholder="https://example.com/og.jpg" defaultValue={data?.['seo.defaultOgImage'] as string ?? ''} />
          <p className="text-xs text-[var(--color-subtle)]">Używany gdy treść nie ma własnego obrazu OG. Zalecany rozmiar: 1200×630 px</p>
        </div>
      </div>

      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Analytics & Weryfikacja</h2>

        <div className="space-y-1.5">
          <Label>Google Analytics 4 (Measurement ID)</Label>
          <Input {...register('seo.googleAnalyticsId')} placeholder="G-XXXXXXXXXX" defaultValue={data?.['seo.googleAnalyticsId'] as string ?? ''} className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label>Google Search Console (weryfikacja meta)</Label>
          <Input {...register('seo.googleVerification')} placeholder="google-site-verification=..." defaultValue={data?.['seo.googleVerification'] as string ?? ''} className="font-mono text-xs" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Zapisz ustawienia
        </Button>
        {mutation.isSuccess && (
          <span className="text-xs text-[var(--color-success)] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Zapisano
          </span>
        )}
      </div>
    </form>
  )
}

// ─── Tab: Sitemap ─────────────────────────────────────────────────────────────

function SitemapTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['seo-sitemap'],
    queryFn: () => api.get<{ data: SitemapEntry[] }>('/api/seo/sitemap-data'),
    select: (r) => r.data,
  })

  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: Settings }>('/api/settings'),
    select: (r) => r.data,
  })

  const siteUrl = (settings.data?.['site.url'] as string) ?? ''

  const items = data ?? []
  const ok      = items.filter((i) => seoScore(i).status === 'ok').length
  const warning = items.filter((i) => seoScore(i).status === 'warning').length
  const errors  = items.filter((i) => seoScore(i).status === 'error').length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'OK', count: ok,      color: 'text-[var(--color-success)]',              bg: 'bg-green-500/10'  },
          { label: 'Uwagi', count: warning, color: 'text-[var(--color-warning,#f59e0b)]',   bg: 'bg-yellow-500/10' },
          { label: 'Błędy', count: errors,  color: 'text-[var(--color-destructive)]',        bg: 'bg-red-500/10'    },
        ].map((s) => (
          <div key={s.label} className={cn('glass-card rounded-[var(--radius-lg)] p-4 text-center', s.bg)}>
            <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
            <p className="text-xs text-[var(--color-subtle)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sitemap XML link */}
      {siteUrl && (
        <a
          href={`${siteUrl.replace(':3000', ':3001')}/api/seo/sitemap.xml`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Podgląd sitemap.xml
        </a>
      )}

      {/* Table */}
      <div className="glass-card rounded-[var(--radius-lg)] overflow-hidden">
        <div className="grid grid-cols-[24px_1fr_120px_120px_100px] px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <span />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Strona</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Tytuł</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Opis</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Status</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="h-4 w-full max-w-xs rounded animate-shimmer" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-subtle)]">
            Brak opublikowanych treści
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {items.map((entry) => {
              const score  = seoScore(entry)
              const Icon   = score.icon
              const title  = entry.seo?.title ?? entry.title
              const desc   = entry.seo?.description ?? ''
              const tLen   = title.length
              const dLen   = desc.length

              return (
                <div key={entry.id} className="grid grid-cols-[24px_1fr_120px_120px_100px] items-center px-5 py-3 hover:bg-[var(--color-surface-elevated)] transition-colors">
                  <Icon className={cn('w-4 h-4', score.color)} />
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{entry.title}</p>
                    <p className="text-[10px] text-[var(--color-subtle)] font-mono">
                      /{entry.typeSlug !== 'page' ? `${entry.typeSlug}/` : ''}{entry.slug}
                    </p>
                  </div>
                  <span className={cn('text-xs tabular-nums', tLen > 60 || tLen < 10 ? 'text-[var(--color-destructive)]' : 'text-[var(--color-muted-foreground)]')}>
                    {tLen > 0 ? `${tLen}/60` : '—'}
                  </span>
                  <span className={cn('text-xs tabular-nums', dLen > 160 || (dLen > 0 && dLen < 50) ? 'text-[var(--color-destructive)]' : 'text-[var(--color-muted-foreground)]')}>
                    {dLen > 0 ? `${dLen}/160` : '—'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {score.issues.map((issue) => (
                      <Badge key={issue} variant="outline" className="text-[9px] px-1 py-0">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Robots.txt ──────────────────────────────────────────────────────────

function RobotsTab() {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: Settings }>('/api/settings'),
    select: (r) => r.data,
  })

  const defaultRobots = `User-agent: *\nAllow: /\n\nSitemap: ${(data?.['site.url'] as string) ?? 'https://example.com'}/sitemap.xml`
  const [value, setValue] = useState<string | null>(null)
  const current = value ?? (data?.['seo.robotsCustom'] as string) ?? defaultRobots

  const mutation = useMutation({
    mutationFn: () => api.put('/api/settings', { 'seo.robotsCustom': current }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="glass-card rounded-[var(--radius-lg)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Plik <code className="font-mono text-xs">robots.txt</code> serwowany przez frontend na <code className="font-mono text-xs">/robots.txt</code>
          </p>
          <a
            href={`${(data?.['site.url'] as string ?? '').replace(':3000', ':3001')}/api/seo/robots.txt`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> Podgląd
          </a>
        </div>

        <textarea
          value={current}
          onChange={(e) => setValue(e.target.value)}
          rows={12}
          className="w-full font-mono text-xs bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] p-3 text-[var(--color-foreground)] resize-y focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Zapisz robots.txt
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setValue(defaultRobots)}>
          Przywróć domyślny
        </Button>
        {mutation.isSuccess && (
          <span className="text-xs text-[var(--color-success)] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Zapisano
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Redirects ───────────────────────────────────────────────────────────

function RedirectsTab() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['redirects'],
    queryFn: () => api.get<{ data: Redirect[] }>('/api/redirects'),
    select: (r) => r.data,
  })

  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')
  const [code, setCode]     = useState<'301' | '302'>('301')

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/redirects', { fromPath: from, toPath: to, statusCode: parseInt(code) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['redirects'] }); setFrom(''); setTo('') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/redirects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redirects'] }),
  })

  const rows = data ?? []

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="glass-card rounded-[var(--radius-lg)] p-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Dodaj przekierowanie</h2>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Z (from)</Label>
            <Input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="/stara-strona"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Do (to)</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="/nowa-strona lub https://..."
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5 w-24">
            <Label className="text-xs">Kod</Label>
            <Select value={code} onValueChange={(v) => setCode(v as '301' | '302')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301</SelectItem>
                <SelectItem value="302">302</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!from || !to || createMutation.isPending}
            className="shrink-0"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Dodaj
          </Button>
        </div>
        {createMutation.isError && (
          <p className="text-xs text-[var(--color-destructive)] mt-2">
            Błąd — sprawdź czy przekierowanie z tego URL nie istnieje już.
          </p>
        )}
      </div>

      {/* List */}
      <div className="glass-card rounded-[var(--radius-lg)] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_60px_44px] px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Z adresu</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Na adres</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Kod</span>
          <span />
        </div>

        {isLoading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-[var(--color-subtle)]">Brak przekierowań</div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_1fr_60px_44px] items-center px-5 py-3 hover:bg-[var(--color-surface-elevated)] transition-colors group">
                <span className="text-sm font-mono text-[var(--color-foreground)] truncate pr-2">{r.fromPath}</span>
                <span className="text-sm font-mono text-[var(--color-muted-foreground)] truncate pr-2">{r.toPath}</span>
                <Badge variant={r.statusCode === 301 ? 'outline' : 'warning'} className="text-xs w-fit">
                  {r.statusCode}
                </Badge>
                <button
                  onClick={() => deleteMutation.mutate(r.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-subtle)] hover:text-[var(--color-destructive)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeoPage() {
  const [tab, setTab] = useState<TabId>('global')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">SEO</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Zarządzaj widocznością w wyszukiwarkach
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-subtle)] hover:text-[var(--color-muted-foreground)]',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tab === 'global'    && <GlobalTab />}
        {tab === 'sitemap'   && <SitemapTab />}
        {tab === 'robots'    && <RobotsTab />}
        {tab === 'redirects' && <RedirectsTab />}
      </motion.div>
    </div>
  )
}
