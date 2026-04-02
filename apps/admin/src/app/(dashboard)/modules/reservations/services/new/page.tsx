'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const MODULE_API = '/api/m/reservations'

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l').replace(/Ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function NewServicePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    durationMinutes: 60,
    capacity: 1,
    price: 0,
    currency: 'PLN',
    active: true,
  })
  const [autoSlug, setAutoSlug] = useState(true)

  const mutation = useMutation({
    mutationFn: () => api.post(`${MODULE_API}/admin/services`, {
      ...form,
      price: Math.round(form.price * 100), // Convert PLN to grosze
    }),
    onSuccess: (res: unknown) => {
      const data = (res as { data: { id: string } }).data
      router.push(`/modules/reservations/services/${data.id}`)
    },
  })

  const updateField = (field: string, value: unknown) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && autoSlug) {
        next.slug = slugify(value as string)
      }
      return next
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/modules/reservations/services"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Nowa usługa</h1>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Nazwa usługi *</Label>
          <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="np. Konsultacja" />
        </div>

        <div className="space-y-1.5">
          <Label>Slug</Label>
          <div className="flex items-center gap-2">
            <Input
              value={form.slug}
              onChange={e => { setAutoSlug(false); updateField('slug', e.target.value) }}
              placeholder="np. konsultacja"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Opis</Label>
          <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} placeholder="Opis usługi widoczny dla klienta..." />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Czas trwania (min)</Label>
            <Input type="number" min={5} value={form.durationMinutes} onChange={e => updateField('durationMinutes', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Pojemność (maks. os.)</Label>
            <Input type="number" min={1} value={form.capacity} onChange={e => updateField('capacity', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Cena (PLN)</Label>
            <Input type="number" min={0} step={0.01} value={form.price} onChange={e => updateField('price', Number(e.target.value))} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={form.active} onCheckedChange={v => updateField('active', v)} />
          <Label>Aktywna (widoczna dla klientów)</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
          <Button variant="outline" asChild>
            <Link href="/modules/reservations/services">Anuluj</Link>
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.name || !form.slug || mutation.isPending}>
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Zapisuję...' : 'Utwórz usługę'}
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400">Błąd: {(mutation.error as Error).message}</p>
        )}
      </div>
    </div>
  )
}
