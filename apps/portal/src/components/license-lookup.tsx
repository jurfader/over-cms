'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'

export function LicenseLookup() {
  const [key,     setKey]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = key.trim().toUpperCase()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/check-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: trimmed }),
      })

      if (res.status === 404) {
        setError('Nie znaleziono licencji o podanym kluczu.')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('Server error')

      const data = await res.json() as { valid?: boolean }
      if (!data.valid) {
        setError('Licencja jest nieważna.')
        setLoading(false)
        return
      }

      router.push(`/portal/${trimmed}`)
    } catch {
      setError('Błąd połączenia. Spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="glass rounded-xl p-1 flex items-center gap-2">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          className="flex-1 bg-transparent px-4 py-3 text-sm font-mono placeholder:text-[var(--color-muted)] outline-none uppercase tracking-widest"
          maxLength={19}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !key.trim()}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Sprawdź
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </form>
  )
}
