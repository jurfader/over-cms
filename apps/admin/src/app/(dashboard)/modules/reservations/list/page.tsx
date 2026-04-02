'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Download, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const MODULE_API = '/api/m/reservations'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending:   { label: 'Oczekuje',    variant: 'secondary' },
  confirmed: { label: 'Potwierdzona', variant: 'default' },
  completed: { label: 'Zakończona',  variant: 'outline' },
  cancelled: { label: 'Anulowana',   variant: 'destructive' },
}

export default function ReservationsList() {
  const [status, setStatus] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['rsv-list', status, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      params.set('limit', '100')
      return api.get<{data:any}>(`${MODULE_API}/admin/reservations?${params}`).then(r => r.data)
    },
  })

  const formatPrice = (grosze: number) => `${(grosze / 100).toFixed(2)} zł`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/modules/reservations"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Lista rezerwacji</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          window.open(`${MODULE_API}/admin/export?dateFrom=${dateFrom}&dateTo=${dateTo}`, '_blank')
        }}>
          <Download className="w-4 h-4" />
          Eksport CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <Button
              key={s}
              variant={status === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(s)}
            >
              {s ? (STATUS_MAP[s]?.label ?? s) : 'Wszystkie'}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-36 h-8 text-xs"
            placeholder="Od"
          />
          <span className="text-[var(--color-muted-foreground)]">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-36 h-8 text-xs"
            placeholder="Do"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">
              <th className="px-4 py-3">Data / Godzina</th>
              <th className="px-4 py-3">Klient</th>
              <th className="px-4 py-3">Usługa</th>
              <th className="px-4 py-3">Osoby</th>
              <th className="px-4 py-3">Kwota</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--color-muted-foreground)]">Ładowanie...</td></tr>
            ) : !reservations?.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--color-muted-foreground)]">Brak rezerwacji</td></tr>
            ) : (
              reservations.map((r: Record<string, unknown>) => {
                const s = STATUS_MAP[r.status as string]
                return (
                  <tr key={r.id as string} className="hover:bg-[var(--color-surface-elevated)] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/modules/reservations/list/${r.id}`} className="hover:text-[var(--color-primary)]">
                        <p className="font-medium">{r.date as string}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{r.startTime as string} — {r.endTime as string}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.customerName as string}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{r.customerEmail as string}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{r.serviceName as string}</td>
                    <td className="px-4 py-3">{r.guestCount as number}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(r.totalPrice as number)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s?.variant ?? 'outline'}>{s?.label ?? String(r.status)}</Badge>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
