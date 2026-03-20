import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight:      '100svh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      textAlign:      'center',
      padding:        '2rem',
      gap:            '1.5rem',
    }}>
      <p style={{ fontSize: '6rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-border)' }}>
        404
      </p>
      <h1 className="display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
        Strona nie istnieje
      </h1>
      <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)', maxWidth: '420px' }}>
        Podstrona, której szukasz, nie została znaleziona lub została przeniesiona.
      </p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
        Wróć na stronę główną
      </Link>
    </div>
  )
}
