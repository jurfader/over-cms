import Link       from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal }  from '@/components/gsap/reveal'

interface CtaProps {
  title?:       string
  description?: string
}

export function Cta({
  title       = 'Gotowy na zmiany?',
  description = 'Porozmawiajmy o Twoim projekcie. Pierwsza konsultacja jest bezpłatna.',
}: CtaProps) {
  return (
    <section style={{ padding: 'var(--section-y) 0' }}>
      <div className="container">
        <Reveal>
          <div
            style={{
              borderRadius:  'var(--radius-lg)',
              padding:       'clamp(3rem, 6vw, 5rem)',
              textAlign:     'center',
              background:    'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in oklch, var(--color-primary) 60%, #7c3aed) 100%)',
              position:      'relative',
              overflow:      'hidden',
            }}
          >
            {/* Decorative circle */}
            <div aria-hidden style={{
              position:     'absolute',
              top:          '-30%',
              right:        '-10%',
              width:        '400px',
              height:       '400px',
              borderRadius: '50%',
              border:       '1px solid rgba(255,255,255,0.15)',
              pointerEvents:'none',
            }} />
            <div aria-hidden style={{
              position:     'absolute',
              bottom:       '-40%',
              left:         '-5%',
              width:        '300px',
              height:       '300px',
              borderRadius: '50%',
              border:       '1px solid rgba(255,255,255,0.1)',
              pointerEvents:'none',
            }} />

            <h2
              className="display"
              style={{
                color:        '#fff',
                fontSize:     'clamp(2rem, 4vw, 3.25rem)',
                marginBottom: '1rem',
                position:     'relative',
              }}
            >
              {title}
            </h2>
            <p style={{
              color:         'rgba(255,255,255,0.8)',
              fontSize:      '1.125rem',
              marginBottom:  '2.5rem',
              maxWidth:      '480px',
              margin:        '0 auto 2.5rem',
              position:      'relative',
            }}>
              {description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', position: 'relative' }}>
              <Link
                href="/kontakt"
                style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          '0.5rem',
                  padding:      '0.875rem 2rem',
                  borderRadius: '999px',
                  background:   '#fff',
                  color:        'var(--color-primary)',
                  fontWeight:   700,
                  fontSize:     '1rem',
                  textDecoration: 'none',
                  transition:   'transform 0.15s, box-shadow 0.15s',
                }}
              >
                Skontaktuj się
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
