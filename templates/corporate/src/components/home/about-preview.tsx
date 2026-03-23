import Image    from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/gsap/reveal'
import type { AboutCms } from '@/lib/cms-types'

export function AboutPreview({ cms }: { cms: AboutCms }) {
  return (
    <section id="o-nas" style={{ padding: 'var(--section-y) 0' }}>
      <div className="container">

        {/* Top: photo + text */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap:                 'clamp(2.5rem, 6vw, 5rem)',
          alignItems:          'center',
          marginBottom:        '4rem',
        }}>

          {/* Left: person photo with stat badges */}
          <Reveal>
            <div style={{ position: 'relative', maxWidth: '440px' }}>
              <div style={{
                borderRadius:  'var(--radius-lg)',
                overflow:      'hidden',
                position:      'relative',
                aspectRatio:   '3/4',
                maxHeight:     '520px',
                background:    '#161616',
              }}>
                <Image
                  src={cms.photo}
                  alt="Paweł — OVERMEDIA"
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'top center' }}
                  sizes="(max-width: 768px) 100vw, 440px"
                />
              </div>

              {/* Stat badge — lat na rynku */}
              <div style={{
                position:      'absolute',
                bottom:        '2rem',
                left:          '-1.5rem',
                background:    'rgba(10,10,10,0.9)',
                backdropFilter:'blur(12px)',
                border:        '1px solid rgba(224,64,251,0.3)',
                borderRadius:  'var(--radius)',
                padding:       '1rem 1.5rem',
              }}>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{cms.years_on_market}</p>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>Lat na rynku</p>
              </div>

              {/* Stat badge — projektów */}
              <div style={{
                position:      'absolute',
                top:           '2rem',
                right:         '-1.5rem',
                background:    'rgba(10,10,10,0.9)',
                backdropFilter:'blur(12px)',
                border:        '1px solid rgba(224,64,251,0.3)',
                borderRadius:  'var(--radius)',
                padding:       '1rem 1.5rem',
              }}>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{cms.projects_count}</p>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>Projektów</p>
              </div>

              {/* Top label */}
              <div style={{
                position:      'absolute',
                top:           '1.25rem',
                left:          '1.25rem',
                background:    'rgba(10,10,10,0.85)',
                backdropFilter:'blur(12px)',
                border:        '1px solid rgba(255,255,255,0.1)',
                borderRadius:  '999px',
                padding:       '0.375rem 0.875rem',
                fontSize:      '0.75rem',
                fontWeight:    600,
                letterSpacing: '0.08em',
                color:         'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
              }}>
                Zaufany partner biznesowy
              </div>
            </div>
          </Reveal>

          {/* Right: text + values */}
          <Reveal delay={0.15}>
            <p className="section-label" style={{ marginBottom: '1rem' }}>
              O Agencji OVERMEDIA
            </p>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.25rem', lineHeight: 1.15 }}>
              Agencja Interaktywna<br />z{' '}
              <span className="gradient-text">Wieloletnim Doświadczeniem</span>
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: '0.875rem' }}>
              {cms.description1}
            </p>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: '2rem' }}>
              {cms.description2}
            </p>

            {/* Values */}
            {cms.values && cms.values.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              {cms.values.map(({ title, description }) => (
                <div key={title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width:          '8px',
                    height:         '8px',
                    borderRadius:   '50%',
                    background:     'var(--color-primary)',
                    flexShrink:     0,
                    marginTop:      '0.45rem',
                    boxShadow:      '0 0 8px rgba(224,64,251,0.6)',
                  }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{title}</p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>{description}</p>
                  </div>
                </div>
              ))}
            </div>}

            <a href="#kontakt" className="btn btn-primary">
              Porozmawiajmy
              <ArrowRight size={17} aria-hidden />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
