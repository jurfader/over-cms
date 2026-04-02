'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, CalendarCheck, User, Mail, Phone,
  Users, CreditCard, CheckCircle, XCircle, RotateCcw,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MODULE_API = '/api/m/reservations'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending:   { label: 'Oczekuje',    variant: 'secondary' },
  confirmed: { label: 'Potwierdzona', variant: 'default' },
  completed: { label: 'Zakończona',  variant: 'outline' },
  cancelled: { label: 'Anulowana',   variant: 'destructive' },
}

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Oczekuje', color: 'text-yellow-400' },
  success: { label: 'Opłacona', color: 'text-green-400' },
  failure: { label: 'Błąd płatności', color: 'text-red-400' },
}

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['rsv-detail', id],
    queryFn: () => api.get<{data:any}>(`${MODULE_API}/admin/reservations/${id}`).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.put(`${MODULE_API}/admin/reservations/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rsv-detail', id] })
      qc.invalidateQueries({ queryKey: ['rsv-list'] })
      qc.invalidateQueries({ queryKey: ['rsv-stats'] })
    },
  })

  if (isLoading) return <div className="p-8 text-center text-[var(--color-muted-foreground)]">Ładowanie...</div>
  if (!reservation) return <div className="p-8 text-center">Nie znaleziono rezerwacji</div>

  const r = reservation
  const payment = r.payment as Record<string, unknown> | null
  const formatPrice = (grosze: number) => `${(grosze / 100).toFixed(2)} zł`
  const s = STATUS_MAP[r.status as string]
  const ps = payment ? PAYMENT_STATUS[payment.status as string] : null

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/modules/reservations/list"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Rezerwacja</h1>
            <p className="text-xs text-[var(--color-muted-foreground)] font-mono">{r.id}</p>
          </div>
        </div>
        <Badge variant={s?.variant ?? 'outline'} className="text-sm px-3 py-1">
          {s?.label ?? r.status}
        </Badge>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date & Time */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Termin</h3>
          <div className="flex items-center gap-3">
            <CalendarCheck className="w-5 h-5 text-[var(--color-primary)]" />
            <div>
              <p className="font-bold text-lg">{r.date as string}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {r.startTime as string} — {r.endTime as string}
              </p>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Klient</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <span className="font-medium">{r.customerName as string}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <a href={`mailto:${r.customerEmail}`} className="text-[var(--color-primary)] hover:underline text-sm">
                {r.customerEmail as string}
              </a>
            </div>
            {r.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                <span className="text-sm">{r.customerPhone as string}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <span className="text-sm">{r.guestCount as number} {(r.guestCount as number) === 1 ? 'osoba' : 'osób'}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Płatność</h3>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />
            <div>
              <p className="font-bold text-lg">{formatPrice(r.totalPrice as number)}</p>
              {ps && (
                <p className={`text-sm ${ps.color}`}>{ps.label}</p>
              )}
              {payment?.paymentMethod ? (
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  Metoda: {String(payment.paymentMethod)}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Notes */}
        {r.notes && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Uwagi</h3>
            <p className="text-sm whitespace-pre-wrap">{r.notes as string}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-4">Akcje</h3>
        <div className="flex flex-wrap gap-2">
          {r.status !== 'confirmed' && r.status !== 'completed' && (
            <Button
              size="sm"
              onClick={() => statusMutation.mutate('confirmed')}
              disabled={statusMutation.isPending}
            >
              <CheckCircle className="w-4 h-4" />
              Potwierdź
            </Button>
          )}
          {r.status === 'confirmed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => statusMutation.mutate('completed')}
              disabled={statusMutation.isPending}
            >
              <CheckCircle className="w-4 h-4" />
              Zakończ
            </Button>
          )}
          {r.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => statusMutation.mutate('cancelled')}
              disabled={statusMutation.isPending}
            >
              <XCircle className="w-4 h-4" />
              Anuluj
            </Button>
          )}
          {r.status === 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => statusMutation.mutate('pending')}
              disabled={statusMutation.isPending}
            >
              <RotateCcw className="w-4 h-4" />
              Przywróć
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
