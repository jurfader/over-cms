'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Settings2, Users, Mail, Save, Loader2, CheckCircle2,
  Trash2, ShieldCheck, Download, Upload, AlertCircle,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'super_admin' | 'admin' | 'editor' | 'viewer'

interface UserRow {
  id:            string
  name:          string
  email:         string
  role:          Role
  emailVerified: boolean
  image:         string | null
  createdAt:     string
}

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  editor:      'Edytor',
  viewer:      'Widz',
}


// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'general',  label: 'Ogólne',      icon: Settings2 },
  { id: 'users',    label: 'Użytkownicy', icon: Users     },
  { id: 'mail',     label: 'Mail',        icon: Mail      },
  { id: 'transfer', label: 'Transfer',    icon: Download  },
] as const

type TabId = typeof TABS[number]['id']

// ─── General settings ─────────────────────────────────────────────────────────

interface GeneralForm { [key: string]: string }

function GeneralTab() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: GeneralForm }>('/api/settings'),
    select: (r) => r.data,
  })

  const { register, handleSubmit } = useForm<GeneralForm>({ values: data ?? {} })

  const mutation = useMutation({
    mutationFn: (v: GeneralForm) => api.put('/api/settings', v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" /></div>

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6 max-w-2xl">
      {/* Site identity */}
      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Tożsamość serwisu</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nazwa serwisu</Label>
            <Input {...register('site.name')} defaultValue={data?.['site.name'] ?? ''} placeholder="Moja firma" />
          </div>
          <div className="space-y-1.5">
            <Label>URL serwisu</Label>
            <Input {...register('site.url')} defaultValue={data?.['site.url'] ?? ''} placeholder="https://example.com" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Email kontaktowy</Label>
          <Input {...register('site.contactEmail')} defaultValue={data?.['site.contactEmail'] ?? ''} placeholder="hello@example.com" type="email" />
        </div>
      </div>

      {/* Branding */}
      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Branding</h2>
        <div className="space-y-1.5">
          <Label>Logo URL</Label>
          <Input {...register('site.logoUrl')} defaultValue={data?.['site.logoUrl'] ?? ''} placeholder="https://example.com/logo.svg" className="font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label>Favicon URL</Label>
          <Input {...register('site.faviconUrl')} defaultValue={data?.['site.faviconUrl'] ?? ''} placeholder="https://example.com/favicon.ico" className="font-mono text-sm" />
        </div>
      </div>

      {/* Locale */}
      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Język i strefa czasowa</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Język</Label>
            <Input {...register('site.language')} defaultValue={data?.['site.language'] ?? 'pl'} placeholder="pl" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Strefa czasowa</Label>
            <Input {...register('site.timezone')} defaultValue={data?.['site.timezone'] ?? 'Europe/Warsaw'} placeholder="Europe/Warsaw" className="font-mono" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Zapisz
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

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersTab() {
  const qc       = useQueryClient()
  const me       = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: UserRow[] }>('/api/users'),
    select: (r) => r.data,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api.put(`/api/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const users = data ?? []

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="glass-card rounded-[var(--radius-lg)] overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_44px] px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Użytkownik</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Status</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-subtle)]">Rola</span>
          <span />
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {users.map((u) => {
              const isMe = u.id === me?.id
              return (
                <div key={u.id} className="grid grid-cols-[1fr_120px_120px_44px] items-center px-5 py-3.5 hover:bg-[var(--color-surface-elevated)] transition-colors group">
                  {/* User info */}
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{u.name}</p>
                      {isMe && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">Ty</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-subtle)] truncate">{u.email}</p>
                  </div>

                  {/* Email verified */}
                  <div>
                    {u.emailVerified
                      ? <Badge variant="success" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Aktywny</Badge>
                      : <Badge variant="outline" className="text-xs">Oczekuje</Badge>
                    }
                  </div>

                  {/* Role selector */}
                  <Select
                    value={u.role}
                    disabled={isMe || roleMutation.isPending}
                    onValueChange={(role) => roleMutation.mutate({ id: u.id, role: role as Role })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Delete */}
                  <button
                    disabled={isMe || deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Usunąć użytkownika "${u.name}"?`)) deleteMutation.mutate(u.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity text-[var(--color-subtle)] hover:text-[var(--color-destructive)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
        <ShieldCheck className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Zapraszanie nowych użytkowników odbywa się przez link rejestracyjny.
          Nowi użytkownicy domyślnie otrzymują rolę <strong>Edytor</strong>.
          Zmiana roli działa natychmiast.
        </p>
      </div>
    </div>
  )
}

// ─── Mail ─────────────────────────────────────────────────────────────────────

function MailTab() {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: Record<string, string> }>('/api/settings'),
    select: (r) => r.data,
  })

  const { register, handleSubmit } = useForm<Record<string, string>>({ values: data ?? {} })

  const mutation = useMutation({
    mutationFn: (v: Record<string, string>) => api.put('/api/settings', v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6 max-w-2xl">
      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">SMTP</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Host</Label>
            <Input {...register('mail.smtpHost')} defaultValue={data?.['mail.smtpHost'] ?? ''} placeholder="smtp.sendgrid.net" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Port</Label>
            <Input {...register('mail.smtpPort')} defaultValue={data?.['mail.smtpPort'] ?? '587'} placeholder="587" className="font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Login</Label>
            <Input {...register('mail.smtpUser')} defaultValue={data?.['mail.smtpUser'] ?? ''} placeholder="apikey" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Hasło</Label>
            <Input {...register('mail.smtpPassword')} defaultValue={data?.['mail.smtpPassword'] ?? ''} type="password" placeholder="••••••••" className="font-mono" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Nadawca (From)</Label>
          <Input {...register('mail.fromEmail')} defaultValue={data?.['mail.fromEmail'] ?? ''} placeholder="CMS <noreply@example.com>" />
        </div>
      </div>

      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Resend API (alternatywa SMTP)</h2>
        <div className="space-y-1.5">
          <Label>Resend API Key</Label>
          <Input {...register('mail.resendApiKey')} defaultValue={data?.['mail.resendApiKey'] ?? ''} placeholder="re_xxxxxxxxx" className="font-mono text-sm" type="password" />
          <p className="text-xs text-[var(--color-subtle)]">Jeśli ustawiony, używany zamiast SMTP</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Zapisz
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

// ─── Transfer ─────────────────────────────────────────────────────────────────

type ImportStats = { types: number; items: number; settings: number; media: number; files: number }

function TransferTab() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult]       = useState<{ ok: boolean; msg: string; stats?: ImportStats } | null>(null)

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? ''

  async function handleExport() {
    setExporting(true)
    setResult(null)
    try {
      // Use anchor navigation — browser streams the download without loading into memory
      const a = document.createElement('a')
      a.href = `${apiUrl}/api/transfer/export`
      a.click()
      setResult({ ok: true, msg: 'Pobieranie eksportu rozpoczęte. Może potrwać chwilę (grafiki są dołączone).' })
    } finally {
      setExporting(false)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text) as unknown
      const res  = await fetch(`${apiUrl}/api/transfer/import`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(json),
      })
      const data = await res.json() as { success?: boolean; imported?: ImportStats; error?: string }
      if (res.ok && data.success) {
        setResult({ ok: true, msg: 'Import zakończony pomyślnie', stats: data.imported })
      } else {
        setResult({ ok: false, msg: data.error ?? 'Import nieudany' })
      }
    } catch (err) {
      setResult({ ok: false, msg: err instanceof SyntaxError ? 'Nieprawidłowy plik JSON' : 'Błąd importu' })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* What's included */}
      <div className="flex items-start gap-3 p-4 rounded-[var(--radius)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
        <ShieldCheck className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Eksport zawiera <strong>typy treści, elementy, ustawienia, rekordy mediów i pliki graficzne</strong> (base64).
          Import automatycznie remapuje URL-e mediów i relacje między elementami.
        </p>
      </div>

      {/* Export */}
      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Eksport</h2>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Pobierz pełny backup jako JSON. Plik może być duży jeśli masz dużo grafik.
          </p>
        </div>
        <Button type="button" disabled={exporting} onClick={handleExport}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Pobierz eksport
        </Button>
      </div>

      {/* Import */}
      <div className="glass-card rounded-[var(--radius-lg)] p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Import</h2>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Wgraj plik JSON z innej instancji OverCMS. Istniejące elementy zostaną nadpisane, nowe dodane.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius)] transition-colors',
            importing
              ? 'opacity-50 pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-subtle)]'
              : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90',
          )}>
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Importuję…' : 'Wgraj plik JSON'}
          </span>
          <input type="file" accept=".json" className="sr-only" disabled={importing} onChange={handleImport} />
        </label>
      </div>

      {/* Result */}
      {result && (
        <div className={cn(
          'rounded-[var(--radius)] text-sm overflow-hidden',
          result.ok
            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
            : 'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
        )}>
          <div className="flex items-center gap-2.5 px-4 py-3">
            {result.ok
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle  className="w-4 h-4 shrink-0" />}
            {result.msg}
          </div>
          {result.stats && (
            <div className="grid grid-cols-5 divide-x divide-[var(--color-success)]/20 border-t border-[var(--color-success)]/20 text-center text-xs">
              {([
                ['Typy',     result.stats.types],
                ['Elementy', result.stats.items],
                ['Pliki',    result.stats.files],
                ['Media',    result.stats.media],
                ['Ustawienia', result.stats.settings],
              ] as [string, number][]).map(([label, count]) => (
                <div key={label} className="py-2 px-1">
                  <div className="font-bold text-base leading-none">{count}</div>
                  <div className="opacity-70 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('general')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Ustawienia</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Konfiguracja systemu CMS</p>
      </div>

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

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tab === 'general'  && <GeneralTab />}
        {tab === 'users'    && <UsersTab />}
        {tab === 'mail'     && <MailTab />}
        {tab === 'transfer' && <TransferTab />}
      </motion.div>
    </div>
  )
}
