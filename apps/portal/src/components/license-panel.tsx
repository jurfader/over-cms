'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Globe, Calendar, Layers, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react'
import type { LicenseData } from '@/lib/license-api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_LABEL: Record<string, string> = {
  trial:  'Trial',
  solo:   'Solo',
  agency: 'Agency',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: 'Aktywna',    color: 'text-green-400' },
  suspended: { label: 'Zawieszona', color: 'text-yellow-400' },
  expired:   { label: 'Wygasła',   color: 'text-red-400' },
  revoked:   { label: 'Cofnięta',  color: 'text-red-400' },
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LicensePanelProps {
  license:    LicenseData
  licenseKey: string
}

export function LicensePanel({ license, licenseKey }: LicensePanelProps) {
  const [deactivating, setDeactivating] = useState<string | null>(null)
  const [confirm,      setConfirm]      = useState<string | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [deactivated,  setDeactivated]  = useState<Set<string>>(new Set())

  const statusCfg = STATUS_CONFIG[license.status] ?? STATUS_CONFIG['active']!

  async function handleDeactivate(domain: string) {
    setDeactivating(domain)
    setError(null)
    try {
      const licenseUrl = process.env.NEXT_PUBLIC_LICENSE_URL ?? 'http://localhost:3002'
      const res = await fetch(`${licenseUrl}/customer/${licenseKey}/deactivate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ domain }),
      })
      if (!res.ok) throw new Error('Deactivation failed')
      setDeactivated((prev) => new Set([...prev, domain]))
      setConfirm(null)
    } catch {
      setError('Nie udało się deaktywować instalacji. Spróbuj ponownie.')
    } finally {
      setDeactivating(null)
    }
  }

  const activeActivations = license.activations.filter(
    (a) => a.active && !deactivated.has(a.domain),
  )
  const inactiveActivations = license.activations.filter(
    (a) => !a.active || deactivated.has(a.domain),
  )

  return (
    <div className="space-y-6">
      {/* ─── Back ─────────────────────────────────────────────────────────── */}
      <a
        href="/portal"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Wróć do wyszukiwarki
      </a>

      {/* ─── License header ───────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-[var(--color-muted)] mb-1">Klucz licencyjny</p>
            <p className="font-mono text-lg font-bold tracking-widest gradient-text">{licenseKey}</p>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full glass ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            icon={<Layers className="w-4 h-4" />}
            label="Plan"
            value={PLAN_LABEL[license.plan] ?? license.plan}
          />
          <Stat
            icon={<Globe className="w-4 h-4" />}
            label="Instalacje"
            value={`${activeActivations.length} / ${license.maxInstallations === 9999 ? '∞' : license.maxInstallations}`}
          />
          <Stat
            icon={<Calendar className="w-4 h-4" />}
            label="Zakupiono"
            value={fmt(license.createdAt)}
          />
          <Stat
            icon={<Calendar className="w-4 h-4" />}
            label="Wygasa"
            value={license.expiresAt ? fmt(license.expiresAt) : 'Nigdy'}
          />
        </div>

        {license.buyerName && (
          <p className="text-sm text-[var(--color-muted)]">
            Licencja dla: <span className="text-white">{license.buyerName}</span>
            {' '}({license.buyerEmail})
          </p>
        )}
      </div>

      {/* ─── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 glass rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ─── Active activations ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-[var(--color-muted)] uppercase tracking-wider">
          Aktywne instalacje
        </h2>

        {activeActivations.length === 0 ? (
          <div className="glass rounded-xl px-5 py-8 text-center text-sm text-[var(--color-muted)]">
            Brak aktywnych instalacji.
          </div>
        ) : (
          activeActivations.map((act) => (
            <div key={act.id} className="glass rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{act.domain}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Ostatnio widziana: {fmt(act.lastSeenAt)}
                  </p>
                </div>
              </div>

              {confirm === act.domain ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-muted)]">Na pewno?</span>
                  <button
                    onClick={() => handleDeactivate(act.domain)}
                    disabled={deactivating === act.domain}
                    className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-medium flex items-center gap-1"
                  >
                    {deactivating === act.domain
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : null}
                    Tak, deaktywuj
                  </button>
                  <button
                    onClick={() => setConfirm(null)}
                    className="px-3 py-1 rounded-lg glass hover:bg-white/5 transition-colors text-xs"
                  >
                    Anuluj
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirm(act.domain)}
                  className="text-xs text-[var(--color-muted)] hover:text-red-400 transition-colors px-3 py-1 rounded-lg glass hover:bg-red-500/10"
                >
                  Deaktywuj
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ─── Inactive activations ─────────────────────────────────────────── */}
      {inactiveActivations.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-[var(--color-muted)] uppercase tracking-wider">
            Nieaktywne instalacje
          </h2>
          {inactiveActivations.map((act) => (
            <div key={act.id} className="glass rounded-xl px-5 py-4 flex items-center gap-3 opacity-50">
              <XCircle className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
              <p className="text-sm truncate">{act.domain}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[var(--color-muted)] text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  )
}
