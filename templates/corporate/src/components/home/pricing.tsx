'use client'

import { useState }  from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { Reveal }    from '@/components/gsap/reveal'
import type { PricingPlanCms } from '@/lib/cms-types'

const PLAN_ICONS: Record<string, React.ReactNode> = {
  basic: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  pro: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  ),
  ecommerce: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
    </svg>
  ),
}

const DEFAULT_EXTRA = [
  { label: 'Montaż video',     price: 'od 80 zł/min'       },
  { label: 'Social Media',     price: 'od 1500 zł/mies'    },
  { label: 'Kampanie Ads',     price: 'od 500 zł + budżet' },
  { label: 'Serwis IT',        price: 'od 50 zł/h'         },
  { label: 'Hosting WWW',      price: 'od 400 zł/rok'      },
  { label: 'Domena',           price: 'od 120 zł/rok'      },
  { label: 'Aplikacje mobilne',price: 'od 5000 zł'         },
]

const DEFAULT_PLANS = [
  {
    id:       'basic',
    name:     'Strona Basic',
    tagline:  'Idealna dla małych firm i freelancerów',
    monthly:  800,
    onetime:  1000,
    featured: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    features: [
      'Do 5 podstron',
      'Responsywny design',
      'Podstawowe SEO',
      'Formularz kontaktowy',
      'Certyfikat SSL',
      'Blog',
      'Integracje zewnętrzne',
      '1 miesiąc wsparcia',
    ],
  },
  {
    id:       'pro',
    name:     'Strona Pro',
    tagline:  'Dla firm szukających więcej możliwości',
    monthly:  1300,
    onetime:  1625,
    featured: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
    ),
    features: [
      'Do 15 podstron',
      'Premium design',
      'Zaawansowane SEO',
      'Blog + CMS',
      'Animacje i efekty',
      'Google Analytics',
      'Priorytetowe wsparcie',
      '6 miesięcy wsparcia',
    ],
  },
  {
    id:       'ecommerce',
    name:     'Sklep E-commerce',
    tagline:  'Zacznij sprzedawać online',
    monthly:  3000,
    onetime:  3750,
    featured: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
    ),
    features: [
      'WooCommerce',
      'Integracja płatności',
      'Kurierzy (InPost, DHL)',
      'Do 100 produktów',
      'Panel zarządzania',
      'Szkolenie z obsługi',
      '',
      '12 miesięcy wsparcia',
    ],
  },
]

function fmt(n: number) {
  return n.toLocaleString('pl-PL') + ' zł'
}

export function Pricing({ cms }: { cms?: PricingPlanCms[] }) {
  const plans = cms
    ? [...cms]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((p) => ({
          id:       p._id,
          name:     p.name,
          tagline:  p.tagline,
          monthly:  p.price_monthly,
          onetime:  p.price_onetime,
          featured: p.is_featured,
          icon:     PLAN_ICONS[p.icon_key] ?? PLAN_ICONS['basic'],
          features: p.features.split('\n').map((f) => f.trim()).filter(Boolean),
        }))
    : DEFAULT_PLANS

  const [abonament, setAbonament] = useState(false)

  return (
    <section id="cennik" style={{ padding: 'var(--section-y) 0', background: 'var(--color-surface)' }}>
      <div className="container">

        <Reveal style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p className="section-label" style={{ justifyContent: 'center', marginBottom: '1rem' }}>Cennik Usług</p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Ile Kosztuje Strona{' '}
            <span className="gradient-text">Internetowa?</span>
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.55)', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Przejrzyste ceny stron WWW, sklepów e-commerce i kampanii reklamowych.
            Oferujemy konkurencyjne stawki z gwarancją jakości. Każdy projekt wyceniamy indywidualnie.
          </p>

          {/* Toggle */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', padding: '4px' }}>
            {[false, true].map((val) => (
              <button
                key={String(val)}
                onClick={() => setAbonament(val)}
                style={{
                  padding:      '0.5rem 1.25rem',
                  borderRadius: '999px',
                  border:       'none',
                  cursor:       'pointer',
                  fontSize:     '0.875rem',
                  fontWeight:   600,
                  transition:   'background 0.2s, color 0.2s',
                  background:   abonament === val ? 'var(--color-primary)' : 'transparent',
                  color:        abonament === val ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontFamily:   'inherit',
                }}
              >
                {val ? 'Abonament −20%' : 'Jednorazowo'}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Dodatkowe usługi */}
        <Reveal style={{ marginBottom: '3rem' }}>
          <div style={{
            background:    'rgba(255,255,255,0.03)',
            border:        '1px solid rgba(255,255,255,0.07)',
            borderRadius:  'var(--radius-lg)',
            padding:       '1.25rem 2rem',
          }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>
              Dodatkowe usługi
            </p>
            <div style={{
              display:             'flex',
              flexWrap:            'wrap',
              gap:                 '0.5rem 2rem',
            }}>
              {DEFAULT_EXTRA.map(({ label, price }) => (
                <div
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)' }}>{label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>{price}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Main pricing cards */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap:                 '1.5rem',
          marginBottom:        '2rem',
        }}>
          {plans.map((plan) => (
            <Reveal key={plan.id}>
              <div style={{
                borderRadius: 'var(--radius-lg)',
                padding:      '2rem',
                height:       '100%',
                position:     'relative',
                border:       plan.featured ? '1px solid rgba(224,64,251,0.45)' : '1px solid rgba(255,255,255,0.08)',
                background:   plan.featured ? 'rgba(224,64,251,0.05)' : 'rgba(255,255,255,0.025)',
                display:      'flex',
                flexDirection:'column',
              }}>
                {plan.featured && (
                  <div style={{
                    position:      'absolute',
                    top:           '-1px',
                    left:          '50%',
                    transform:     'translateX(-50%)',
                    padding:       '0.25rem 1.125rem',
                    borderRadius:  '0 0 999px 999px',
                    background:    'var(--color-primary)',
                    fontSize:      '0.6875rem',
                    fontWeight:    700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color:         '#fff',
                    whiteSpace:    'nowrap',
                  }}>
                    Najpopularniejszy
                  </div>
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
                  color:          'var(--color-primary)',
                  marginBottom:   '1.25rem',
                  marginTop:      plan.featured ? '1.25rem' : 0,
                }}>
                  {plan.icon}
                </div>

                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.375rem' }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1.5rem' }}>
                  {plan.tagline}
                </p>

                <div style={{ marginBottom: '1.75rem' }}>
                  <span style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {fmt(abonament ? plan.monthly : plan.onetime)}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.375rem' }}>
                    {abonament ? '/mies.' : 'jednorazowo'}
                  </span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {plan.features.filter(Boolean).map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                      <Check size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#kontakt"
                  className={plan.featured ? 'btn btn-primary' : 'btn btn-outline'}
                  style={{ justifyContent: 'center' }}
                >
                  Zamów wycenę
                  <ArrowRight size={16} aria-hidden />
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom note */}
        <Reveal style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.4)' }}>
            Potrzebujesz indywidualnej wyceny? Każdy projekt jest unikalny —{' '}
            <a href="#kontakt" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              zapytaj o wycenę.
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
