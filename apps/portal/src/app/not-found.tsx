import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <SearchX className="w-12 h-12 text-[var(--color-muted)] mx-auto" />
        <h1 className="text-2xl font-bold">Nie znaleziono</h1>
        <p className="text-sm text-[var(--color-muted)]">Licencja o podanym kluczu nie istnieje.</p>
        <a
          href="/portal"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:opacity-90 transition-opacity mt-2"
        >
          Spróbuj ponownie
        </a>
      </div>
    </main>
  )
}
