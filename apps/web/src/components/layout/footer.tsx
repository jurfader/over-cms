import Link           from 'next/link'
import type { NavItem } from '@overcms/sdk'

interface Props { nav: NavItem[] }

export function Footer({ nav }: Props) {
  const year = new Date().getFullYear()

  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', marginTop: 'auto' }}>
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          {/* Brand */}
          <div>
            <p style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
              Over<span style={{ color: 'var(--color-primary)' }}>CMS</span>
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.7, maxWidth: '260px' }}>
              Nowoczesny headless CMS dla profesjonalnych stron internetowych.
            </p>
          </div>

          {/* Navigation links */}
          {nav.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '1rem' }}>
                Menu
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {nav.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.url}
                      target={item.target}
                      style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '1rem' }}>
              Kontakt
            </p>
            <Link
              href="/kontakt"
              className="btn btn-outline"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
            >
              Napisz do nas
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
            &copy; {year} OverCMS. Wszelkie prawa zastrzeżone.
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
            Powered by{' '}
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>OverCMS</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
