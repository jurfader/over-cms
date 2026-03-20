import Link          from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Reveal }    from '@/components/gsap/reveal'

const HIGHLIGHTS = [
  'Indywidualne podejście do każdego projektu',
  'Transparentne ceny i terminy',
  'Wsparcie techniczne po wdrożeniu',
  'Optymalizacja pod SEO i Core Web Vitals',
]

interface AboutPreviewProps {
  title?:    string
  body?:     string
}

export function AboutPreview({
  title = 'Dlaczego my?',
  body  = 'Łączymy doświadczenie agencji z elastycznością i szybkością start-upu. Nie sprzedajemy szablonów — budujemy rozwiązania skrojone na miarę, które rosną razem z Twoim biznesem.',
}: AboutPreviewProps) {
  return (
    <section style={{ padding: 'var(--section-y) 0' }}>
      <div
        className="container"
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap:                 'clamp(2.5rem, 6vw, 5rem)',
          alignItems:          'center',
        }}
      >
        {/* Text side */}
        <div>
          <Reveal>
            <p className="section-label" style={{ marginBottom: '1rem' }}>O nas</p>
            <h2
              className="display"
              style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)', marginBottom: '1.25rem' }}
            >
              {title}
            </h2>
            <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
              {body}
            </p>
            <Link href="/o-nas" className="btn btn-primary">
              Poznaj nas lepiej
              <ArrowRight size={17} />
            </Link>
          </Reveal>
        </div>

        {/* Highlights */}
        <Reveal delay={0.1}>
          <div
            className="glass"
            style={{
              borderRadius: 'var(--radius-lg)',
              padding:      '2.5rem',
            }}
          >
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {HIGHLIGHTS.map((text) => (
                <li key={text} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <CheckCircle2
                    size={20}
                    style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '0.125rem' }}
                  />
                  <span style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
