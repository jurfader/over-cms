import type { Metadata } from 'next'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Dziękujemy za zakup!' }

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="glass rounded-2xl p-10 max-w-md w-full text-center space-y-6 fade-up">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Dziękujemy za zakup!</h1>
          <p className="text-[var(--color-muted)] text-sm leading-relaxed">
            Klucz licencyjny został wysłany na Twój adres e-mail.
            Sprawdź skrzynkę odbiorczą (lub folder spam).
          </p>
        </div>

        <div className="glass rounded-xl p-4 text-left space-y-2 text-sm">
          <p className="font-medium">Co dalej?</p>
          <ol className="space-y-1.5 text-[var(--color-muted)] list-decimal list-inside">
            <li>Zainstaluj OverCMS na swoim serwerze</li>
            <li>W panelu admina przejdź do Ustawień</li>
            <li>Wpisz klucz licencyjny z e-maila</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="/portal"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:opacity-90 transition-opacity"
          >
            Zarządzaj licencją <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">
            Wróć do strony głównej
          </a>
        </div>
      </div>
    </main>
  )
}
