import type { Metadata } from 'next'
import { KeyRound } from 'lucide-react'
import { LicenseLookup } from '@/components/license-lookup'

export const metadata: Metadata = { title: 'Portal klienta' }

export default function PortalPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8 fade-up">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Portal klienta</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Wpisz klucz licencyjny, aby zobaczyć swoje instalacje.
          </p>
        </div>

        <LicenseLookup />

        <p className="text-center text-xs text-[var(--color-muted)]">
          Nie masz jeszcze licencji?{' '}
          <a href="/#pricing" className="text-[var(--color-primary)] hover:underline">
            Sprawdź cennik
          </a>
        </p>
      </div>
    </main>
  )
}
