import { Reveal } from '@/components/gsap/reveal'
import type { TestimonialCms } from '@/lib/cms-types'

const DEFAULT_TESTIMONIALS = [
  {
    id:      't1',
    name:    'Piotr Wiśniewski',
    role:    'Właściciel',
    company: 'Chicken King',
    rating:  5,
    text:    'OVERMEDIA wykonała dla nas zarówno stronę internetową, sklep WooCommerce jak i aplikację mobilną. Efekty przeszły nasze oczekiwania — sprzedaż online wzrosła o 40% w ciągu pierwszego kwartału.',
  },
  {
    id:      't2',
    name:    'Anna Kowalczyk',
    role:    'Dyrektor',
    company: 'Szkoła Językowa',
    rating:  5,
    text:    'Profesjonalne podejście, terminowość i świetny kontakt przez cały projekt. Strona wygląda doskonale na każdym urządzeniu, a liczba zapisów na kursy wzrosła dwukrotnie.',
  },
  {
    id:      't3',
    name:    'Marek Nowak',
    role:    'CEO',
    company: 'RAPTOR Sp. z o.o.',
    rating:  5,
    text:    'Polecam OVERMEDIA każdemu, kto szuka solidnej agencji digital. Realizacja szybka, cena uczciwa, a strona wizytówkowa wygląda super profesjonalnie. Kampanie Google Ads przyniosły wymierny efekt.',
  },
]

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < n ? '#E040FB' : 'rgba(255,255,255,0.15)'}
          aria-hidden
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      ))}
    </div>
  )
}

export function Testimonials({ cms }: { cms?: TestimonialCms[] }) {
  const testimonials = cms ?? DEFAULT_TESTIMONIALS
  return (
    <section id="opinie" style={{ padding: 'var(--section-y) 0' }}>
      <div className="container">

        <Reveal style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p className="section-label" style={{ justifyContent: 'center', marginBottom: '1rem' }}>Opinie Klientów</p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Co mówią nasi klienci?
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.55)', maxWidth: '440px', margin: '0 auto' }}>
            Zaufali nam — i wrócili po więcej.
          </p>
        </Reveal>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap:                 '1.5rem',
        }}>
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div
                className="glass"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding:      '2rem',
                  height:       '100%',
                  display:      'flex',
                  flexDirection:'column',
                  gap:          '1.25rem',
                }}
              >
                <Stars n={t.rating} />

                <blockquote style={{ flex: 1, fontSize: '0.9375rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, margin: 0 }}>
                  &ldquo;{t.text}&rdquo;
                </blockquote>

                <div style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '0.875rem',
                  paddingTop: '1.25rem',
                  borderTop:  '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{
                    width:          '2.5rem',
                    height:         '2.5rem',
                    borderRadius:   '50%',
                    background:     'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontWeight:     700,
                    fontSize:       '1rem',
                    flexShrink:     0,
                  }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{t.name}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
