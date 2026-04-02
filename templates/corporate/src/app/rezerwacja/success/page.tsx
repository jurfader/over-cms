'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function SuccessContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [status, setStatus] = useState<string>('loading')
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!id) { setStatus('error'); return }

    let attempts = 0
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/m/reservations/reservation/${id}/status`)
        const json = await res.json()
        const d = json.data
        setData(d)

        if (d.status === 'confirmed' || d.status === 'completed') {
          setStatus('confirmed')
        } else if (d.paymentStatus === 'failure') {
          setStatus('failed')
        } else if (attempts < 20) {
          attempts++
          setTimeout(poll, 3000)
        } else {
          setStatus('timeout')
        }
      } catch {
        setStatus('error')
      }
    }
    poll()
  }, [id])

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '3px solid var(--color-primary)', borderTopColor: 'transparent',
          margin: '0 auto 1rem',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>Weryfikacja płatności...</p>
        <p style={{ opacity: 0.5, fontSize: '0.875rem', marginTop: '0.5rem' }}>
          To może potrwać kilka sekund
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Rezerwacja potwierdzona!
        </h1>
        <p style={{ opacity: 0.6, marginBottom: '0.5rem' }}>
          {data?.serviceName ? `${data.serviceName} — ` : ''}
          {data?.date as string} o {data?.startTime as string}
        </p>
        <p style={{ opacity: 0.4, fontSize: '0.875rem', marginBottom: '2rem' }}>
          Potwierdzenie zostało wysłane na email.
        </p>
        <Link href="/" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
          Wróć na stronę główną
        </Link>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
        {status === 'failed' ? 'Płatność nie powiodła się' : 'Coś poszło nie tak'}
      </h1>
      <p style={{ opacity: 0.6, marginBottom: '2rem' }}>
        Spróbuj ponownie lub skontaktuj się z nami.
      </p>
      <Link href="/rezerwacja" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
        Spróbuj ponownie
      </Link>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <section style={{ padding: 'clamp(4rem, 8vw, 8rem) 0' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Ładowanie...</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </section>
  )
}
