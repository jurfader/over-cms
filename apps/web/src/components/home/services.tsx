'use client'

import { Reveal } from '@/components/gsap/reveal'
import { Code2, Layers, Zap, Shield, Globe, BarChart3 } from 'lucide-react'

const DEFAULT_SERVICES = [
  {
    icon:        Code2,
    title:       'Tworzenie stron',
    description: 'Projektujemy i budujemy strony internetowe dopasowane do Twoich celów biznesowych.',
  },
  {
    icon:        Layers,
    title:       'Headless CMS',
    description: 'Zarządzaj treścią w jednym miejscu i publikuj ją na wszystkich kanałach.',
  },
  {
    icon:        Zap,
    title:       'Wydajność',
    description: 'Core Web Vitals na poziomie 95+ dzięki Next.js, ISR i optymalizacji zasobów.',
  },
  {
    icon:        Shield,
    title:       'Bezpieczeństwo',
    description: 'Regularne audyty, szyfrowanie danych i ochrona przed atakami DDoS.',
  },
  {
    icon:        Globe,
    title:       'Wielojęzyczność',
    description: 'Obsługujemy projekty w wielu językach z pełną lokalizacją treści.',
  },
  {
    icon:        BarChart3,
    title:       'Analityka',
    description: 'Wbudowane dashboardy z kluczowymi wskaźnikami dla Twojego biznesu.',
  },
]

interface ServicesProps {
  title?:    string
  subtitle?: string
}

export function Services({
  title    = 'Co robimy',
  subtitle = 'Kompleksowe rozwiązania cyfrowe — od strategii po wdrożenie i utrzymanie.',
}: ServicesProps) {
  return (
    <section style={{ padding: 'var(--section-y) 0', background: 'var(--color-surface)' }}>
      <div className="container">
        {/* Header */}
        <Reveal style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p className="section-label" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            Usługi
          </p>
          <h2 className="display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1rem' }}>
            {title}
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)', maxWidth: '520px', margin: '0 auto' }}>
            {subtitle}
          </p>
        </Reveal>

        {/* Grid */}
        <div style={{
          display:               'grid',
          gridTemplateColumns:   'repeat(auto-fill, minmax(320px, 1fr))',
          gap:                   '1.25rem',
        }}>
          {DEFAULT_SERVICES.map(({ icon: Icon, title: t, description }, i) => (
            <Reveal key={t} delay={i * 0.07}>
              <div
                className="glass"
                style={{
                  borderRadius:  'var(--radius-lg)',
                  padding:       '2rem',
                  height:        '100%',
                  transition:    'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform  = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow  = '0 12px 40px color-mix(in oklch, var(--color-fg) 6%, transparent)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform  = 'none'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow  = 'none'
                }}
              >
                <div style={{
                  width:         '2.75rem',
                  height:        '2.75rem',
                  borderRadius:  'var(--radius-sm)',
                  background:    'color-mix(in oklch, var(--color-primary) 12%, transparent)',
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent:'center',
                  marginBottom:  '1.25rem',
                  color:         'var(--color-primary)',
                }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.625rem' }}>{t}</h3>
                <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
