'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CheckoutButtonProps {
  plan:     'solo' | 'agency'
  label:    string
  featured?: boolean
}

export function CheckoutButton({ plan, label, featured }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const licenseUrl = process.env.NEXT_PUBLIC_LICENSE_URL ?? 'http://localhost:3002'
      const res = await fetch(`${licenseUrl}/checkout/session`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan }),
      })
      if (!res.ok) throw new Error('Checkout unavailable')
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch {
      setError('Nie udało się uruchomić płatności. Spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={[
          'w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
          featured
            ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:opacity-90'
            : 'border border-white/10 hover:bg-white/5',
          loading ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Przekierowanie...' : label}
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  )
}
