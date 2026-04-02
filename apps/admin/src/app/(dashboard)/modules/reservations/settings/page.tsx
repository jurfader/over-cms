'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Save, Key, Palette, Bell, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const MODULE_API = '/api/modules'

interface ModuleConfig {
  autopay?: {
    serviceId?: string
    sharedKey?: string
    sandbox?: boolean
  }
  customCss?: string
  cssPreset?: 'dark' | 'light' | 'inherit'
  notifications?: {
    adminEmail?: string
    confirmTemplate?: string
  }
}

export default function ReservationsSettings() {
  const [showKey, setShowKey] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const { data: moduleData } = useQuery({
    queryKey: ['rsv-module-config'],
    queryFn: () => api.get<{data:any}>(`${MODULE_API}`).then(r => {
      const mods = r.data as Array<{ id: string; config: ModuleConfig }>
      return mods.find(m => m.id === 'reservations')?.config ?? {}
    }),
  })

  const [config, setConfig] = useState<ModuleConfig>({
    autopay: { serviceId: '', sharedKey: '', sandbox: true },
    customCss: '',
    cssPreset: 'inherit',
    notifications: { adminEmail: '', confirmTemplate: '' },
  })

  useEffect(() => {
    if (moduleData) {
      setConfig({
        autopay: {
          serviceId: moduleData.autopay?.serviceId ?? '',
          sharedKey: moduleData.autopay?.sharedKey ?? '',
          sandbox: moduleData.autopay?.sandbox ?? true,
        },
        customCss: moduleData.customCss ?? '',
        cssPreset: moduleData.cssPreset ?? 'inherit',
        notifications: {
          adminEmail: moduleData.notifications?.adminEmail ?? '',
          confirmTemplate: moduleData.notifications?.confirmTemplate ?? '',
        },
      })
    }
  }, [moduleData])

  const saveMutation = useMutation({
    mutationFn: () => api.put(`${MODULE_API}/reservations/config`, config),
    onSuccess: () => setTestResult(null),
  })

  const updateAutopay = (field: string, value: unknown) => {
    setConfig(prev => ({
      ...prev,
      autopay: { ...prev.autopay, [field]: value },
    }))
  }

  const updateNotifications = (field: string, value: unknown) => {
    setConfig(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/modules/reservations"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Ustawienia rezerwacji</h1>
      </div>

      <Tabs defaultValue="autopay">
        <TabsList>
          <TabsTrigger value="autopay" className="gap-1.5">
            <Key className="w-3.5 h-3.5" />
            Autopay
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Wygląd
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            Powiadomienia
          </TabsTrigger>
        </TabsList>

        {/* ── Autopay ─────────────────────────────────────────────────────── */}
        <TabsContent value="autopay">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-6 space-y-5">
            <div>
              <h2 className="font-semibold mb-1">Integracja Autopay</h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Podaj dane z panelu Autopay. Potrzebujesz konta na{' '}
                <a href="https://developers.autopay.pl" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                  developers.autopay.pl
                </a>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Service ID</Label>
              <Input
                type="number"
                value={config.autopay?.serviceId ?? ''}
                onChange={e => updateAutopay('serviceId', e.target.value)}
                placeholder="np. 123456"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Shared Key (klucz współdzielony)</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={config.autopay?.sharedKey ?? ''}
                  onChange={e => updateAutopay('sharedKey', e.target.value)}
                  placeholder="Klucz z panelu Autopay"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={config.autopay?.sandbox ?? true}
                onCheckedChange={v => updateAutopay('sandbox', v)}
              />
              <div>
                <Label>Tryb sandbox (testowy)</Label>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {config.autopay?.sandbox
                    ? 'Płatności testowe — testpay.autopay.pl'
                    : 'Płatności produkcyjne — pay.autopay.pl'}
                </p>
              </div>
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                testResult.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.msg}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <TabsContent value="appearance">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-6 space-y-5">
            <div>
              <h2 className="font-semibold mb-1">Wygląd widgetu rezerwacji</h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Dostosuj wygląd formularza rezerwacji na stronie.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Preset motywu</Label>
              <div className="flex gap-2">
                {(['inherit', 'dark', 'light'] as const).map(preset => (
                  <Button
                    key={preset}
                    variant={config.cssPreset === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, cssPreset: preset }))}
                  >
                    {preset === 'inherit' ? 'Dopasuj do strony' : preset === 'dark' ? 'Ciemny' : 'Jasny'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Custom CSS</Label>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-2">
                Zmienne CSS: <code>--rsv-primary</code>, <code>--rsv-bg</code>, <code>--rsv-text</code>, <code>--rsv-border</code>, <code>--rsv-radius</code>, <code>--rsv-font</code>
              </p>
              <Textarea
                value={config.customCss ?? ''}
                onChange={e => setConfig(prev => ({ ...prev, customCss: e.target.value }))}
                rows={12}
                className="font-mono text-xs"
                placeholder={`.rsv-widget {\n  --rsv-primary: #E040FB;\n  --rsv-radius: 12px;\n}`}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Notifications ───────────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--glass-card-bg)] p-6 space-y-5">
            <div>
              <h2 className="font-semibold mb-1">Powiadomienia email</h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Konfiguracja emaili wysyłanych przy nowych rezerwacjach.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Email administratora</Label>
              <Input
                type="email"
                value={config.notifications?.adminEmail ?? ''}
                onChange={e => updateNotifications('adminEmail', e.target.value)}
                placeholder="admin@firma.pl"
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Powiadomienie o każdej nowej rezerwacji
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Zapisuję...' : 'Zapisz ustawienia'}
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <p className="text-sm text-green-400 text-right">Zapisano pomyślnie</p>
      )}
    </div>
  )
}
