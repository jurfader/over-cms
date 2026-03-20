'use client'

import { Reveal } from '@/components/gsap/reveal'
import type { ServiceItemCms } from '@/lib/cms-types'

// Icon map: icon_key → SVG element
const ICON_MAP: Record<string, React.ReactNode> = {
  web: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  shop: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
    </svg>
  ),
  app: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
    </svg>
  ),
  video: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  reels: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42C1 8.14 1 11.61 1 11.61s0 3.47.46 5.19a2.78 2.78 0 0 0 1.95 1.95C5.12 19.22 12 19.22 12 19.22s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.08 23 11.61 23 11.61s0-3.47-.46-5.19z"/><polygon points="9.75 15.02 15.5 11.61 9.75 8.2 9.75 15.02"/>
    </svg>
  ),
  social: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  it: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  ads: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>
    </svg>
  ),
}

const DEFAULT_SERVICES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    title:       'Tworzenie Stron Internetowych',
    description: 'Profesjonalne strony WWW dla firm, wizytówki, landing page. Responsywne, zoptymalizowane pod SEO.',
    price:       'od 800 zł',
    badge:       null,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
    ),
    title:       'Sklepy E-commerce WooCommerce',
    description: 'Sklepy internetowe z PayU, Przelewy24, BLIK. Integracje z InPost, DPD, DHL i pełne zarządzanie.',
    price:       'od 3 000 zł',
    badge:       null,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
      </svg>
    ),
    title:       'Aplikacje Mobilne iOS i Android',
    description: 'Natywne aplikacje mobilne w React Native i Flutter — od MVP po publikację w App Store i Google Play.',
    price:       'od 5 000 zł',
    badge:       null,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
    title:       'Profesjonalny Montaż Wideo',
    description: 'Filmy promocyjne, reklamy, materiały YouTube. Color grading, animacje, efekty specjalne i sound design.',
    price:       'od 80 zł/min',
    badge:       null,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42C1 8.14 1 11.61 1 11.61s0 3.47.46 5.19a2.78 2.78 0 0 0 1.95 1.95C5.12 19.22 12 19.22 12 19.22s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.08 23 11.61 23 11.61s0-3.47-.46-5.19z"/><polygon points="9.75 15.02 15.5 11.61 9.75 8.2 9.75 15.02"/>
      </svg>
    ),
    title:       'Rolki & Reels',
    description: 'Viralowe treści wideo na Instagram Reels, TikTok i YouTube Shorts. Scenariusz, nagranie i montaż.',
    price:       'od 450 zł / 5 rolek',
    badge:       null,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title:       'Social Media',
    description: 'Kompleksowe prowadzenie mediów społecznościowych: strategia, content, publikacja, moderacja i raportowanie.',
    price:       'od 1 500 zł/m-c',
    badge:       null,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title:       'Serwis IT',
    description: 'Wsparcie techniczne dla firm: konfiguracja sprzętu, serwerów, oprogramowania i sieci komputerowych.',
    price:       'od 50 zł/h',
    badge:       null,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>
      </svg>
    ),
    title:       'Kampanie Ads',
    description: 'Google Ads, Meta Ads i TikTok Ads — skuteczne kampanie reklamowe z gwarancją mierzalnych wyników.',
    price:       'od 500 zł + budżet',
    badge:       'Popularne',
  },
]

export function Services({ cms }: { cms?: ServiceItemCms[] }) {
  const services = cms
    ? [...cms]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s) => ({
          icon:        ICON_MAP[s.icon_key] ?? ICON_MAP['web'],
          title:       s.title,
          description: s.description,
          price:       s.price,
          badge:       s.badge || null,
        }))
    : DEFAULT_SERVICES

  return (
    <section id="uslugi" style={{ padding: 'var(--section-y) 0', background: 'var(--color-surface)' }}>
      <div className="container">

        <Reveal style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p className="section-label" style={{ justifyContent: 'center', marginBottom: '1rem' }}>Usługi Digital i IT</p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Kompleksowe Usługi Tworzenia<br />Stron i Marketingu
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.55)', maxWidth: '540px', margin: '0 auto' }}>
            Od strategii przez wdrożenie aż po stałą obsługę — wszystko w jednym miejscu.
          </p>
        </Reveal>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap:                 '1.25rem',
        }}>
          {services.map(({ icon, title, description, price, badge }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div
                className="glass"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding:      '1.75rem',
                  height:       '100%',
                  position:     'relative',
                  transition:   'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(224,64,251,0.1)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                }}
              >
                {badge && (
                  <span style={{
                    position:     'absolute',
                    top:          '1.25rem',
                    right:        '1.25rem',
                    padding:      '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize:     '0.6875rem',
                    fontWeight:   700,
                    letterSpacing:'0.06em',
                    background:   'rgba(224,64,251,0.15)',
                    color:        'var(--color-primary)',
                    border:       '1px solid rgba(224,64,251,0.3)',
                  }}>
                    {badge}
                  </span>
                )}

                {/* Icon */}
                <div style={{
                  width:          '3rem',
                  height:         '3rem',
                  borderRadius:   'var(--radius-sm)',
                  background:     'rgba(224,64,251,0.1)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  marginBottom:   '1.25rem',
                  color:          'var(--color-primary)',
                }}>
                  {icon}
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.625rem', lineHeight: 1.3 }}>
                  {title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '1rem' }}>
                  {description}
                </p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {price}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
