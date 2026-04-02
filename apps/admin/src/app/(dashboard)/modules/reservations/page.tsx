'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  CalendarCheck, Clock, DollarSign, ArrowRight,
  CheckCircle, Calendar, List, Settings, Layers,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MODULE_API = '/api/m/reservations'

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{label}</p>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending:   { label: 'Oczekuje',    variant: 'secondary' },
    confirmed: { label: 'Potwierdzona', variant: 'default' },
    completed: { label: 'Zakończona',  variant: 'outline' },
    cancelled: { label: 'Anulowana',   variant: 'destructive' },
  }
  const s = map[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservationsDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['rsv-stats'],
    queryFn: () => api.get<{data:any}>(`${MODULE_API}/admin/reservations/stats`).then(r => r.data),
  })

  const { data: today } = useQuery({
    queryKey: ['rsv-today'],
    queryFn: () => api.get<{data:any}>(`${MODULE_API}/admin/reservations/today`).then(r => r.data),
  })

  const formatPrice = (grosze: number) => `${(grosze / 100).toFixed(2)} zł`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-[var(--color-primary)]" />
            Rezerwacje
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Zarządzaj rezerwacjami i usługami
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/modules/reservations/calendar">
              <Calendar className="w-4 h-4" />
              Kalendarz
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/modules/reservations/list">
              <List className="w-4 h-4" />
              Lista
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/modules/reservations/services">
              <Layers className="w-4 h-4" />
              Usługi
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/modules/reservations/settings">
              <Settings className="w-4 h-4" />
              Ustawienia
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Wszystkie rezerwacje"
          value={stats?.total ?? 0}
          icon={CalendarCheck}
          color="bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        />
        <StatCard
          label="Oczekujące"
          value={stats?.pending ?? 0}
          icon={Clock}
          color="bg-yellow-500/10 text-yellow-500"
        />
        <StatCard
          label="Potwierdzone"
          value={stats?.confirmed ?? 0}
          icon={CheckCircle}
          color="bg-green-500/10 text-green-500"
        />
        <StatCard
          label="Przychód"
          value={formatPrice(stats?.revenue ?? 0)}
          icon={DollarSign}
          color="bg-blue-500/10 text-blue-500"
        />
      </div>

      {/* Today's reservations */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--color-primary)]" />
            Dzisiejsze rezerwacje
          </h2>
          <Link
            href="/modules/reservations/list"
            className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
          >
            Wszystkie <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!today?.length ? (
          <div className="p-8 text-center text-[var(--color-muted-foreground)]">
            <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Brak rezerwacji na dziś</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {today.map((r: Record<string, unknown>) => (
              <Link
                key={r.id as string}
                href={`/modules/reservations/list/${r.id}`}
                className="flex items-center justify-between p-4 hover:bg-[var(--color-surface-elevated)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold">{r.startTime as string}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {r.endTime as string}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{r.customerName as string}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {r.serviceName as string}
                      {(r.guestCount as number) > 1 && ` · ${r.guestCount} os.`}
                    </p>
                  </div>
                </div>
                <StatusBadge status={r.status as string} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
