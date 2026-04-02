'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion }   from 'framer-motion'
import { Puzzle, Power, PowerOff, FileText, ShoppingCart, Globe, BarChart3, Loader2, CheckCircle2, Store, Download, Trash2, CalendarCheck, Mail, Briefcase } from 'lucide-react'
import { api }      from '@/lib/api'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn }       from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleRow {
  id:          string
  name:        string
  version:     string
  description: string | null
  icon:        string | null
  adminNav:    { label: string; path: string; icon?: string } | null
  active:      boolean
  installedAt: string | null
  config:      Record<string, unknown>
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  ShoppingCart,
  Globe,
  BarChart3,
  Puzzle,
  CalendarCheck,
  Mail,
  Briefcase,
}

// ─── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({ mod }: { mod: ModuleRow }) {
  const qc = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: () => api.put(`/api/modules/${mod.id}/toggle`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules'] }),
  })

  const Icon = ICON_MAP[mod.icon ?? ''] ?? Puzzle

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-[var(--radius-lg)] p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-10 h-10 rounded-[var(--radius)] flex items-center justify-center shrink-0',
          mod.active
            ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
            : 'bg-[var(--color-surface-elevated)] text-[var(--color-subtle)]',
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[var(--color-foreground)] text-sm">{mod.name}</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
              v{mod.version}
            </Badge>
            {mod.active
              ? <Badge variant="success" className="text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Aktywny</Badge>
              : <Badge variant="outline" className="text-[10px]">Nieaktywny</Badge>
            }
          </div>
          {mod.description && (
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 line-clamp-2">{mod.description}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[var(--color-border)]">
        {mod.adminNav && mod.active && (
          <Button variant="outline" size="sm" asChild className="text-xs">
            <a href={mod.adminNav.path}>Otwórz</a>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="text-xs ml-auto"
          disabled={toggleMutation.isPending}
          onClick={() => toggleMutation.mutate()}
        >
          {toggleMutation.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : mod.active
              ? <><PowerOff className="w-3.5 h-3.5 mr-1" /> Wyłącz</>
              : <><Power className="w-3.5 h-3.5 mr-1" /> Włącz</>
          }
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Marketplace Plugin Card ──────────────────────────────────────────────────

interface MarketplacePlugin {
  id: string
  name: string
  description: string | null
  version: string
  icon: string | null
  author: string | null
  requiredPlan: string | null
  price: number
  currency: string
  downloads: number
  installed: boolean
}

function MarketplaceCard({ plugin }: { plugin: MarketplacePlugin }) {
  const qc = useQueryClient()
  const Icon = ICON_MAP[plugin.icon ?? ''] ?? Puzzle

  const installMutation = useMutation({
    mutationFn: () => api.post('/api/marketplace/install', { pluginId: plugin.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace'] })
      qc.invalidateQueries({ queryKey: ['modules'] })
    },
  })

  const uninstallMutation = useMutation({
    mutationFn: () => api.delete(`/api/marketplace/${plugin.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace'] })
      qc.invalidateQueries({ queryKey: ['modules'] })
    },
  })

  const formatPrice = (grosze: number) =>
    grosze === 0 ? 'Bezpłatny' : `${(grosze / 100).toFixed(2)} zł`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-[var(--radius-lg)] p-5 flex flex-col gap-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center shrink-0 bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[var(--color-foreground)] text-sm">{plugin.name}</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
              v{plugin.version}
            </Badge>
            {plugin.installed && (
              <Badge variant="success" className="text-[10px]">
                <CheckCircle2 className="w-3 h-3 mr-1" />Zainstalowany
              </Badge>
            )}
          </div>
          {plugin.description && (
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 line-clamp-2">{plugin.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
        {plugin.author && <span>Autor: {plugin.author}</span>}
        <span>{plugin.downloads} pobrań</span>
        <span className="ml-auto font-semibold text-[var(--color-foreground)]">
          {formatPrice(plugin.price)}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
        {plugin.requiredPlan && plugin.requiredPlan !== 'trial' && (
          <Badge variant="outline" className="text-[10px]">
            Plan: {plugin.requiredPlan}+
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          {plugin.installed ? (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              disabled={uninstallMutation.isPending}
              onClick={() => {
                if (confirm(`Usunąć plugin "${plugin.name}"?`)) {
                  uninstallMutation.mutate()
                }
              }}
            >
              {uninstallMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><Trash2 className="w-3.5 h-3.5 mr-1" /> Odinstaluj</>
              }
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-xs"
              disabled={installMutation.isPending}
              onClick={() => installMutation.mutate()}
            >
              {installMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><Download className="w-3.5 h-3.5 mr-1" /> Zainstaluj</>
              }
            </Button>
          )}
        </div>
      </div>

      {installMutation.isSuccess && (
        <p className="text-xs text-green-400">
          Zainstalowano! Zrestartuj serwer API i aktywuj w zakładce &ldquo;Zainstalowane&rdquo;.
        </p>
      )}
      {installMutation.isError && (
        <p className="text-xs text-red-400">
          Błąd: {(installMutation.error as Error).message}
        </p>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModulesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn:  () => api.get<{ data: ModuleRow[] }>('/api/modules'),
    select:   (r) => r.data,
  })

  const { data: marketplaceData, isLoading: mpLoading } = useQuery({
    queryKey: ['marketplace'],
    queryFn:  () => api.get<{ data: MarketplacePlugin[] }>('/api/marketplace'),
    select:   (r) => r.data,
  })

  const modules = data ?? []
  const active  = modules.filter((m) => m.active)
  const inactive = modules.filter((m) => !m.active)
  const marketplace = marketplaceData ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Moduły</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Zarządzaj zainstalowanymi modułami i przeglądaj marketplace
        </p>
      </div>

      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed" className="gap-1.5">
            <Puzzle className="w-3.5 h-3.5" />
            Zainstalowane ({modules.length})
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-1.5">
            <Store className="w-3.5 h-3.5" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        {/* ── Installed tab ──────────────────────────────────────────── */}
        <TabsContent value="installed">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : modules.length === 0 ? (
            <div className="glass-card rounded-[var(--radius-lg)] py-16 text-center">
              <Puzzle className="w-8 h-8 text-[var(--color-subtle)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-subtle)]">Brak zainstalowanych modułów</p>
              <p className="text-xs text-[var(--color-subtle)] opacity-60 mt-1">
                Przejdź do Marketplace żeby zainstalować pluginy
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {active.length > 0 && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-subtle)] mb-3">
                    Aktywne
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {active.map((mod) => <ModuleCard key={mod.id} mod={mod} />)}
                  </div>
                </section>
              )}
              {inactive.length > 0 && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-subtle)] mb-3">
                    Nieaktywne
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inactive.map((mod) => <ModuleCard key={mod.id} mod={mod} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Marketplace tab ────────────────────────────────────────── */}
        <TabsContent value="marketplace">
          {mpLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : marketplace.length === 0 ? (
            <div className="glass-card rounded-[var(--radius-lg)] py-16 text-center">
              <Store className="w-8 h-8 text-[var(--color-subtle)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-subtle)]">Marketplace jest pusty</p>
              <p className="text-xs text-[var(--color-subtle)] opacity-60 mt-1">
                Wkrótce pojawią się nowe pluginy
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplace.map((p) => <MarketplaceCard key={p.id} plugin={p} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
