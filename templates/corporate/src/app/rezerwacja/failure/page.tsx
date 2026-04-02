import Link from 'next/link'

export const metadata = {
  title: 'Płatność nieudana',
}

export default function FailurePage() {
  return (
    <section style={{ padding: 'clamp(4rem, 8vw, 8rem) 0' }}>
      <div className="container" style={{ maxWidth: '640px', textAlign: 'center' }}>
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
          Płatność nieudana
        </h1>
        <p style={{ opacity: 0.6, marginBottom: '2rem' }}>
          Płatność nie została zrealizowana. Możesz spróbować ponownie.
        </p>
        <Link href="/rezerwacja" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
          Spróbuj ponownie
        </Link>
      </div>
    </section>
  )
}
