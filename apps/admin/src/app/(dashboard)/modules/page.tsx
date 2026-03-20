'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion }   from 'framer-motion'
import { Puzzle, Power, PowerOff, FileText, ShoppingCart, Globe, BarChart3, Loader2, CheckCircle2 } from 'lucide-react'
import { api }      from '@/lib/api'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
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

export default function ModulesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn:  () => api.get<{ data: ModuleRow[] }>('/api/modules'),
    select:   (r) => r.data,
  })

  const modules = data ?? []
  const active  = modules.filter((m) => m.active)
  const inactive = modules.filter((m) => !m.active)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Moduły</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Rozszerz funkcjonalność CMS za pomocą modułów
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
          <span><strong className="text-[var(--color-foreground)]">{active.length}</strong> aktywnych</span>
          <span>·</span>
          <span><strong className="text-[var(--color-foreground)]">{modules.length}</strong> łącznie</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : modules.length === 0 ? (
        <div className="glass-card rounded-[var(--radius-lg)] py-16 text-center">
          <Puzzle className="w-8 h-8 text-[var(--color-subtle)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-subtle)]">Brak zainstalowanych modułów</p>
          <p className="text-xs text-[var(--color-subtle)] opacity-60 mt-1">
            Zarejestruj moduły w <code className="font-mono">apps/api/src/index.ts</code>
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
    </div>
  )
}
