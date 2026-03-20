'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { Menu, X }             from 'lucide-react'
import type { NavItem }        from '@overcms/sdk'

interface Props { nav: NavItem[] }

export function Header({ nav }: Props) {
  const [open,      setOpen]      = useState(false)
  const [scrolled,  setScrolled]  = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        right:           0,
        zIndex:          50,
        transition:      'background 0.3s, border-color 0.3s, box-shadow 0.3s',
        background:      scrolled ? 'color-mix(in oklch, var(--color-bg) 88%, transparent)' : 'transparent',
        backdropFilter:  scrolled ? 'blur(16px)' : 'none',
        borderBottom:    scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '4.5rem', gap: '2rem' }}>
        {/* Logo */}
        <Link href="/" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', color: 'var(--color-fg)', textDecoration: 'none' }}>
          Over<span style={{ color: 'var(--color-primary)' }}>CMS</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
          {nav.map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/kontakt"
          className="btn btn-primary"
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', display: 'none' }}
          data-desktop-cta
        >
          Kontakt
        </Link>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          style={{ marginLeft: 'auto', color: 'var(--color-fg)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          background:   'var(--color-bg)',
          borderTop:    '1px solid var(--color-border)',
          padding:      '1rem 0 1.5rem',
        }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {nav.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target={item.target}
                onClick={() => setOpen(false)}
                style={{ padding: '0.625rem 0', fontSize: '1rem', color: 'var(--color-fg)', textDecoration: 'none', borderBottom: '1px solid var(--color-border)' }}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/kontakt" className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              Kontakt
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.url}
      target={item.target}
      style={{
        padding:        '0.375rem 0.875rem',
        borderRadius:   '999px',
        fontSize:       '0.9375rem',
        fontWeight:     500,
        color:          'var(--color-muted)',
        textDecoration: 'none',
        transition:     'color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.color      = 'var(--color-fg)'
        ;(e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.color      = 'var(--color-muted)'
        ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
      }}
    >
      {item.label}
    </Link>
  )
}
