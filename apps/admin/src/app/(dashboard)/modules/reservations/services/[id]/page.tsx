'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Clock, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const MODULE_API = '/api/m/reservations'

const DAY_NAMES = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']

interface AvailabilityRule {
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration?: number
  active: boolean
}

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: service, isLoading } = useQuery({
    queryKey: ['rsv-service', id],
    queryFn: () => api.get<{data:any}>(`${MODULE_API}/admin/services/${id}`).then(r => r.data),
  })

  const { data: availability } = useQuery({
    queryKey: ['rsv-availability', id],
    queryFn: () => api.get<{data:any}>(`${MODULE_API}/admin/availability/${id}`).then(r => r.data),
  })

  const [form, setForm] = useState({
    name: '', slug: '', description: '', durationMinutes: 60,
    capacity: 1, price: 0, active: true,
  })
  const [rules, setRules] = useState<AvailabilityRule[]>([])

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        slug: service.slug,
        description: service.description ?? '',
        durationMinutes: service.durationMinutes,
        capacity: service.capacity,
        price: service.price / 100,
        active: service.active,
      })
    }
  }, [service])

  useEffect(() => {
    if (availability) setRules(availability)
  }, [availability])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put(`${MODULE_API}/admin/services/${id}`, {
        ...form,
        price: Math.round(form.price * 100),
      })
      await api.put(`${MODULE_API}/admin/availability/${id}`, rules)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rsv-services'] })
      qc.invalidateQueries({ queryKey: ['rsv-service', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`${MODULE_API}/admin/services/${id}`),
    onSuccess: () => router.push('/modules/reservations/services'),
  })

  const updateField = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const addRule = () => {
    // Find first day without a rule
    const usedDays = new Set(rules.map(r => r.dayOfWeek))
    const nextDay = [1, 2, 3, 4, 5, 6, 0].find(d => !usedDays.has(d)) ?? 1
    setRules([...rules, { dayOfWeek: nextDay, startTime: '09:00', endTime: '17:00', active: true }])
  }

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx))
  }

  const updateRule = (idx: number, field: string, value: unknown) => {
    setRules(rules.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  if (isLoading) return <div className="p-8 text-center text-[var(--color-muted-foreground)]">Ładowanie...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/modules/reservations/services"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Edycja usługi</h1>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm('Usunąć usługę? Zostaną usunięte też wszystkie rezerwacje.')) {
              deleteMutation.mutate()
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
          Usuń
        </Button>
      </div>

      {/* Basic info */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-6 space-y-5">
        <h2 className="font-semibold">Informacje podstawowe</h2>

        <div className="space-y-1.5">
          <Label>Nazwa usługi *</Label>
          <Input value={form.name} onChange={e => updateField('name', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input value={form.slug} onChange={e => updateField('slug', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Opis</Label>
          <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Czas trwania (min)</Label>
            <Input type="number" min={5} value={form.durationMinutes} onChange={e => updateField('durationMinutes', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Pojemność</Label>
            <Input type="number" min={1} value={form.capacity} onChange={e => updateField('capacity', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Cena (PLN)</Label>
            <Input type="number" min={0} step={0.01} value={form.price} onChange={e => updateField('price', Number(e.target.value))} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={form.active} onCheckedChange={v => updateField('active', v)} />
          <Label>Aktywna</Label>
        </div>
      </div>

      {/* Availability */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--color-primary)]" />
            Harmonogram dostępności
          </h2>
          <Button size="sm" variant="outline" onClick={addRule} disabled={rules.length >= 7}>
            <Plus className="w-4 h-4" />
            Dodaj dzień
          </Button>
        </div>

        {rules.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Brak reguł dostępności. Dodaj dni i godziny w których można rezerwować.
          </p>
        ) : (
          <div className="space-y-3">
            {rules
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((rule, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <select
                    value={rule.dayOfWeek}
                    onChange={e => updateRule(idx, 'dayOfWeek', Number(e.target.value))}
                    className="bg-transparent border border-[var(--color-border)] rounded px-2 py-1 text-sm min-w-[120px]"
                  >
                    {DAY_NAMES.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>

                  <Input
                    type="time"
                    value={rule.startTime}
                    onChange={e => updateRule(idx, 'startTime', e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                  <span className="text-[var(--color-muted-foreground)]">—</span>
                  <Input
                    type="time"
                    value={rule.endTime}
                    onChange={e => updateRule(idx, 'endTime', e.target.value)}
                    className="w-28 h-8 text-sm"
                  />

                  <Switch
                    checked={rule.active}
                    onCheckedChange={v => updateRule(idx, 'active', v)}
                  />

                  <Button size="sm" variant="ghost" onClick={() => removeRule(idx)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/modules/reservations/services">Anuluj</Link>
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Zapisuję...' : 'Zapisz zmiany'}
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <p className="text-sm text-green-400 text-right">Zapisano pomyślnie</p>
      )}
    </div>
  )
}
