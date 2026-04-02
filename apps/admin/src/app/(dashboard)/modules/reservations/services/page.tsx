'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, ArrowLeft, Layers, Clock, Users, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MODULE_API = '/api/m/reservations'

export default function ServicesPage() {
  const qc = useQueryClient()

  const { data: services, isLoading } = useQuery({
    queryKey: ['rsv-services'],
    queryFn: () => api.get<{data:any}>(`${MODULE_API}/admin/services`).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`${MODULE_API}/admin/services/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rsv-services'] }),
  })

  const formatPrice = (grosze: number) =>
    grosze === 0 ? 'Bezpłatne' : `${(grosze / 100).toFixed(2)} zł`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/modules/reservations"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Usługi</h1>
        </div>
        <Button size="sm" asChild>
          <Link href="/modules/reservations/services/new">
            <Plus className="w-4 h-4" />
            Nowa usługa
          </Link>
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-[var(--color-muted-foreground)]">Ładowanie...</div>
      ) : !services?.length ? (
        <div className="p-8 text-center text-[var(--color-muted-foreground)]">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Brak usług. Dodaj pierwszą usługę.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s: Record<string, unknown>) => (
            <div
              key={s.id as string}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/modules/reservations/services/${s.id}`}
                    className="font-bold text-lg hover:text-[var(--color-primary)] transition-colors"
                  >
                    {s.name as string}
                  </Link>
                  <p className="text-xs text-[var(--color-muted-foreground)] font-mono">/{s.slug as string}</p>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({
                    id: s.id as string,
                    active: !(s.active as boolean),
                  })}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                  title={s.active ? 'Dezaktywuj' : 'Aktywuj'}
                >
                  {s.active ? (
                    <ToggleRight className="w-6 h-6 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              {s.description ? (
                <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                  {String(s.description)}
                </p>
              ) : null}

              <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {s.durationMinutes as number} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  maks. {s.capacity as number}
                </span>
                <span className="flex items-center gap-1 font-medium text-[var(--color-foreground)]">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatPrice(s.price as number)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={s.active ? 'default' : 'secondary'}>
                  {s.active ? 'Aktywna' : 'Nieaktywna'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
