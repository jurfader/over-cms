'use client'

import { useEffect, useRef }  from 'react'
import Link                   from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

interface HeroProps {
  title?:    string
  subtitle?: string
  ctaLabel?: string
  ctaUrl?:   string
  badge?:    string
}

export function Hero({
  title    = 'Twoja marka.\nNowa jakość.',
  subtitle = 'Tworzymy strony internetowe, które sprzedają — szybkie, nowoczesne i zarządzane przez OverCMS.',
  ctaLabel = 'Sprawdź nasze usługi',
  ctaUrl   = '/uslugi',
  badge    = 'Nowa generacja CMS',
}: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { gsap } = await import('gsap')

      if (!heroRef.current) return

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo('[data-hero-badge]',    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo('[data-hero-title]',    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
        .fromTo('[data-hero-sub]',      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .fromTo('[data-hero-actions]',  { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
        .fromTo('[data-hero-bg]',       { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 1.2 }, 0)
    }
    void init()
  }, [])

  const lines = title.split('\n')

  return (
    <section
      ref={heroRef}
      style={{
        position:        'relative',
        minHeight:       '100svh',
        display:         'flex',
        alignItems:      'center',
        paddingTop:      '8rem',
        paddingBottom:   '5rem',
        overflow:        'hidden',
      }}
    >
      {/* Background blobs */}
      <div
        data-hero-bg
        style={{
          position:     'absolute',
          inset:        0,
          zIndex:       0,
          pointerEvents: 'none',
          opacity:      0,
        }}
        aria-hidden
      >
        <div style={{
          position:     'absolute',
          top:          '-10%',
          right:        '-5%',
          width:        '60vw',
          height:       '60vw',
          maxWidth:     '800px',
          maxHeight:    '800px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, color-mix(in oklch, var(--color-primary) 12%, transparent) 0%, transparent 70%)',
          filter:       'blur(40px)',
        }} />
        <div style={{
          position:     'absolute',
          bottom:       '-10%',
          left:         '-5%',
          width:        '50vw',
          height:       '50vw',
          maxWidth:     '600px',
          maxHeight:    '600px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, color-mix(in oklch, var(--color-accent) 8%, transparent) 0%, transparent 70%)',
          filter:       'blur(60px)',
        }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <div data-hero-badge style={{ opacity: 0, marginBottom: '1.75rem' }}>
          <span style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '0.5rem',
            padding:      '0.375rem 0.875rem',
            borderRadius: '999px',
            fontSize:     '0.8125rem',
            fontWeight:   600,
            background:   'color-mix(in oklch, var(--color-primary) 10%, transparent)',
            color:        'var(--color-primary)',
            border:       '1px solid color-mix(in oklch, var(--color-primary) 25%, transparent)',
          }}>
            <Sparkles size={13} />
            {badge}
          </span>
        </div>

        {/* Title */}
        <h1
          data-hero-title
          className="display"
          style={{
            opacity:       0,
            fontSize:      'clamp(2.75rem, 7vw, 5.5rem)',
            fontWeight:    700,
            marginBottom:  '1.5rem',
            maxWidth:      '900px',
          }}
        >
          {lines.map((line, i) => (
            <span key={i} style={{ display: 'block' }}>
              {i === 1
                ? <span style={{ color: 'var(--color-primary)' }}>{line}</span>
                : line}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p
          data-hero-sub
          style={{
            opacity:      0,
            fontSize:     'clamp(1rem, 2vw, 1.25rem)',
            color:        'var(--color-muted)',
            maxWidth:     '580px',
            marginBottom: '2.5rem',
            lineHeight:   1.7,
          }}
        >
          {subtitle}
        </p>

        {/* Actions */}
        <div
          data-hero-actions
          style={{ opacity: 0, display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}
        >
          <Link href={ctaUrl} className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
            {ctaLabel}
            <ArrowRight size={18} />
          </Link>
          <Link href="/blog" className="btn btn-outline" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
            Nasze realizacje
          </Link>
        </div>

        {/* Stats row */}
        <div
          data-hero-actions
          style={{
            opacity:       0,
            marginTop:     '4rem',
            display:       'flex',
            flexWrap:      'wrap',
            gap:           '2.5rem',
            paddingTop:    '2.5rem',
            borderTop:     '1px solid var(--color-border)',
          }}
        >
          {[
            { value: '200+', label: 'Zrealizowanych projektów' },
            { value: '12 lat', label: 'Doświadczenia' },
            { value: '98%', label: 'Zadowolonych klientów' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-fg)' }}>
                {value}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '0.125rem' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
