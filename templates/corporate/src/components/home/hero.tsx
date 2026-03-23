'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight, ChevronDown, Monitor, Smartphone, Video, Target } from 'lucide-react'
import Image from 'next/image'
import type { HeroCms } from '@/lib/cms-types'

// Floating service badges around the logo
const BADGES = [
  { icon: Monitor,    label: 'Strony WWW', top: '14%',  left: '-8%',  right: 'auto' },
  { icon: Smartphone, label: 'Aplikacje',  top: '22%',  left: 'auto', right: '-12%' },
  { icon: Video,      label: 'Video',      top: 'auto', left: '-4%',  right: 'auto', bottom: '26%' },
  { icon: Target,     label: 'Marketing',  top: 'auto', left: 'auto', right: '-10%', bottom: '16%' },
]

export function Hero({ cms }: { cms: HeroCms }) {
  const stats = [
    { value: cms.stat1_value, label: cms.stat1_label },
    { value: cms.stat2_value, label: cms.stat2_label },
    { value: cms.stat3_value, label: cms.stat3_label },
  ]

  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    async function init() {
      const { gsap } = await import('gsap')
      if (!ref.current) return
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo('[data-h-badge]',   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo('[data-h-title]',   { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.3')
        .fromTo('[data-h-sub]',     { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .fromTo('[data-h-actions]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
        .fromTo('[data-h-stats]',   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
        .fromTo('[data-h-visual]',  { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1 }, 0)

      // Subtle float animation on the logo
      gsap.to('[data-h-logo]', {
        y:        -12,
        duration: 3,
        ease:     'sine.inOut',
        yoyo:     true,
        repeat:   -1,
      })

      // Stagger float on badges
      gsap.to('[data-h-floatbadge]', {
        y:        -8,
        duration: 2.5,
        ease:     'sine.inOut',
        yoyo:     true,
        repeat:   -1,
        stagger:  0.4,
      })
    }
    void init()
  }, [])

  return (
    <section
      id="home"
      ref={ref}
      style={{
        position:      'relative',
        minHeight:     '100svh',
        display:       'flex',
        alignItems:    'center',
        paddingTop:    '7rem',
        paddingBottom: '5rem',
        overflow:      'hidden',
      }}
    >
      {/* Background glows */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position:     'absolute',
          top:          '-20%',
          right:        '-5%',
          width:        '70vw',
          height:       '70vw',
          maxWidth:     '900px',
          maxHeight:    '900px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(224,64,251,0.1) 0%, transparent 60%)',
          filter:       'blur(60px)',
        }} />
        <div style={{
          position:     'absolute',
          bottom:       '-10%',
          left:         '-5%',
          width:        '50vw',
          height:       '50vw',
          maxWidth:     '600px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(123,47,224,0.07) 0%, transparent 65%)',
          filter:       'blur(80px)',
        }} />
      </div>

      <div className="container" style={{
        position:            'relative',
        zIndex:              1,
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 '2rem',
        alignItems:          'center',
      }}>

        {/* ── Left: text content ─────────────────────────────── */}
        <div>
          {/* Badge */}
          <div data-h-badge style={{ opacity: 0, marginBottom: '1.5rem' }}>
            <span style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '0.5rem',
              padding:       '0.375rem 1rem',
              borderRadius:  '999px',
              fontSize:      '0.8125rem',
              fontWeight:    600,
              background:    'rgba(224,64,251,0.1)',
              color:         'var(--color-primary)',
              border:        '1px solid rgba(224,64,251,0.25)',
              letterSpacing: '0.04em',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              {cms.badge_text}
            </span>
          </div>

          {/* Heading */}
          <h1
            data-h-title
            style={{
              opacity:       0,
              fontSize:      'clamp(2.5rem, 5.5vw, 4.5rem)',
              fontWeight:    800,
              lineHeight:    1.1,
              letterSpacing: '-0.02em',
              marginBottom:  '1.5rem',
            }}
          >
            {cms.title_before}<br />
            <span className="gradient-text">{cms.title_gradient}</span><br />
            {cms.title_after}
          </h1>

          {/* Subtitle */}
          <p
            data-h-sub
            style={{
              opacity:      0,
              fontSize:     'clamp(0.9rem, 1.5vw, 1.0625rem)',
              color:        'rgba(255,255,255,0.6)',
              maxWidth:     '520px',
              marginBottom: '2.5rem',
              lineHeight:   1.75,
            }}
          >
            {cms.subtitle}
          </p>

          {/* CTAs */}
          <div data-h-actions style={{ opacity: 0, display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '3.5rem' }}>
            <a href="#kontakt" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
              {cms.cta_primary_text}
              <ArrowRight size={18} aria-hidden />
            </a>
            <a href="#portfolio" className="btn btn-outline" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
              {cms.cta_secondary_text}
            </a>
          </div>

          {/* Stats */}
          <div
            data-h-stats
            style={{
              opacity:    0,
              display:    'flex',
              flexWrap:   'wrap',
              gap:        '2.5rem',
              paddingTop: '2.5rem',
              borderTop:  '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                  {value}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: visual ──────────────────────────────────── */}
        <div
          data-h-visual
          style={{
            opacity:        0,
            position:       'relative',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            minHeight:      '480px',
          }}
        >
          {/* Outer glow ring */}
          <div style={{
            position:     'absolute',
            width:        '380px',
            height:       '380px',
            borderRadius: '50%',
            background:   'radial-gradient(circle, rgba(123,47,224,0.25) 0%, rgba(224,64,251,0.05) 60%, transparent 80%)',
            border:       '1px dashed rgba(224,64,251,0.2)',
          }} aria-hidden />

          {/* Logo centered */}
          <div data-h-logo style={{ position: 'relative', zIndex: 2 }}>
            <Image
              src="/images/logo.webp"
              alt="OVERMEDIA"
              width={220}
              height={220}
              style={{ width: 'clamp(160px, 18vw, 220px)', height: 'auto', filter: 'drop-shadow(0 0 48px rgba(224,64,251,0.45))' }}
              priority
            />
          </div>

          {/* Floating service badges */}
          {BADGES.map(({ icon: Icon, label, top, left, right, bottom }) => (
            <div
              key={label}
              data-h-floatbadge
              style={{
                position:       'absolute',
                top,
                left,
                right,
                bottom,
                display:        'flex',
                alignItems:     'center',
                gap:            '0.625rem',
                padding:        '0.625rem 1.125rem',
                borderRadius:   '12px',
                background:     'rgba(20, 20, 28, 0.85)',
                backdropFilter: 'blur(16px)',
                border:         '1px solid rgba(255,255,255,0.1)',
                boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
                fontWeight:     600,
                fontSize:       '0.9375rem',
                color:          '#fff',
                whiteSpace:     'nowrap',
                zIndex:         3,
              }}
            >
              <span style={{
                width:          '2rem',
                height:         '2rem',
                borderRadius:   '8px',
                background:     'rgba(224,64,251,0.15)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'var(--color-primary)',
                flexShrink:     0,
              }}>
                <Icon size={16} aria-hidden />
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position:      'absolute',
        bottom:        '1.5rem',
        left:          '50%',
        transform:     'translateX(-50%)',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '0.25rem',
        color:         'rgba(255,255,255,0.25)',
        fontSize:      '0.6875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        animation:     'bounce 2s ease infinite',
      }}>
        <span>Przewiń w dół</span>
        <ChevronDown size={16} aria-hidden />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        @media (max-width: 860px) {
          [data-h-visual] { display: none !important; }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
