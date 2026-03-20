'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const NAV = [
  { label: 'Start',     href: '#home'      },
  { label: 'Usługi',    href: '#uslugi'    },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'O nas',     href: '#o-nas'     },
  { label: 'Cennik',    href: '#cennik'    },
  { label: 'Opinie',    href: '#opinie'    },
]

export function Header() {
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = () => { if (window.innerWidth > 900) setOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    setOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header style={{
      position:       'fixed',
      top:            0,
      left:           0,
      right:          0,
      zIndex:         9999,
      transition:     'background 0.3s, box-shadow 0.3s',
      background:     scrolled ? 'rgba(10, 10, 10, 0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom:   scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      boxShadow:      scrolled ? '0 2px 32px rgba(0,0,0,0.4)' : 'none',
    }}>
      <div className="container" style={{
        display:    'flex',
        alignItems: 'center',
        height:     scrolled ? '3.75rem' : '4.5rem',
        gap:        '1.5rem',
        transition: 'height 0.3s',
      }}>

        {/* Logo */}
        <a href="#home" onClick={(e) => handleAnchorClick(e, '#home')} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <Image
            src="/images/logo.webp"
            alt="OVERMEDIA"
            width={160}
            height={40}
            style={{ height: scrolled ? '32px' : '38px', width: 'auto', transition: 'height 0.3s' }}
            priority
          />
        </a>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', marginLeft: 'auto' }}>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleAnchorClick(e, item.href)}
              style={{
                padding:        '0.5rem 1rem',
                borderRadius:   '8px',
                fontSize:       '0.9375rem',
                fontWeight:     500,
                color:          'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                transition:     'color 0.15s, background 0.15s',
                whiteSpace:     'nowrap',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color      = '#fff'
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color      = 'rgba(255,255,255,0.7)'
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <a
          href="#kontakt"
          onClick={(e) => handleAnchorClick(e, '#kontakt')}
          className="btn btn-primary"
          data-desktop-cta
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', whiteSpace: 'nowrap', display: 'none' }}
        >
          Bezpłatna wycena
        </a>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
          style={{
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'center',
            gap:            '5px',
            background:     'none',
            border:         'none',
            cursor:         'pointer',
            padding:        '0.25rem',
            marginLeft:     'auto',
            width:          '32px',
          }}
        >
          {[
            open ? 'translateY(7px) rotate(45deg)'  : 'none',
            undefined,
            open ? 'translateY(-7px) rotate(-45deg)' : 'none',
          ].map((transform, i) => (
            <span
              key={i}
              style={{
                display:        'block',
                height:         '2px',
                background:     '#fff',
                borderRadius:   '1px',
                transformOrigin:'center',
                transition:     'transform 0.25s, opacity 0.25s',
                ...(transform !== undefined ? { transform } : {}),
                ...(i === 1 ? { opacity: open ? 0 : 1 } : {}),
              }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      <div style={{
        overflow:   'hidden',
        maxHeight:  open ? '500px' : '0',
        transition: 'max-height 0.35s ease',
        background: '#0a0a0a',
        borderTop:  open ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <nav className="container" style={{
          display:       'flex',
          flexDirection: 'column',
          padding:       '1.5rem 0 2rem',
          gap:           '0.25rem',
        }}>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleAnchorClick(e, item.href)}
              style={{
                fontSize:       '1.25rem',
                fontWeight:     600,
                color:          'rgba(255,255,255,0.85)',
                textDecoration: 'none',
                padding:        '0.75rem 0',
                borderBottom:   '1px solid rgba(255,255,255,0.06)',
                textAlign:      'center',
              }}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#kontakt"
            onClick={(e) => handleAnchorClick(e, '#kontakt')}
            className="btn btn-primary"
            style={{ marginTop: '1.25rem', justifyContent: 'center', fontSize: '1rem' }}
          >
            Bezpłatna wycena
          </a>
        </nav>
      </div>

      <style>{`
        @media (min-width: 900px) {
          [data-desktop-cta] { display: inline-flex !important; }
          button[aria-label] { display: none !important; }
        }
      `}</style>
    </header>
  )
}
