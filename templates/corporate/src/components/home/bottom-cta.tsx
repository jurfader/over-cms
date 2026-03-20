'use client'

import { ArrowRight } from 'lucide-react'
import { Reveal }     from '@/components/gsap/reveal'

export function BottomCta() {
  return (
    <section style={{
      background:    'linear-gradient(135deg, #E040FB 0%, #7B2FE0 100%)',
      padding:       'clamp(4rem, 8vw, 6rem) 0',
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Decorative circles */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', bottom: '-40%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Reveal>
          <h2 style={{
            fontSize:      'clamp(1.75rem, 4vw, 3rem)',
            fontWeight:    800,
            letterSpacing: '-0.02em',
            color:         '#fff',
            marginBottom:  '1rem',
            lineHeight:    1.2,
          }}>
            Zamów Bezpłatną Wycenę<br />Projektu
          </h2>
          <p style={{
            fontSize:     'clamp(1rem, 1.8vw, 1.125rem)',
            color:        'rgba(255,255,255,0.8)',
            maxWidth:     '540px',
            margin:       '0 auto 2.5rem',
            lineHeight:   1.7,
          }}>
            Potrzebujesz profesjonalnej strony internetowej, sklepu e-commerce lub
            kampanii reklamowej? Skontaktuj się z nami i otrzymaj indywidualną ofertę
            w ciągu 24 godzin.
          </p>
          <a
            href="#kontakt"
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:             '0.5rem',
              padding:         '1rem 2.5rem',
              borderRadius:    '999px',
              background:      '#fff',
              color:           '#E040FB',
              fontWeight:      700,
              fontSize:        '1.0625rem',
              textDecoration:  'none',
              transition:      'transform 0.15s, box-shadow 0.15s',
              boxShadow:       '0 8px 32px rgba(0,0,0,0.25)',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.transform  = 'translateY(-2px)'
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow  = '0 16px 48px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.transform  = 'none'
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow  = '0 8px 32px rgba(0,0,0,0.25)'
            }}
          >
            Zamów bezpłatną wycenę
            <ArrowRight size={18} aria-hidden />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
