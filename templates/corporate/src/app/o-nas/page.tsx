import type { Metadata }  from 'next'
import { Reveal }         from '@/components/gsap/reveal'
import { Cta }            from '@/components/home/cta'
import { cms }            from '@/lib/cms'

export const revalidate = 60

export const metadata: Metadata = {
  title:       'O nas',
  description: 'Poznaj nasz zespół i historię firmy.',
}

export default async function AboutPage() {
  const page = await cms.content
    .singleton<Record<string, string>>('about')
    .catch(() => null)

  const d = page?.data ?? {}

  const title = d['title'] ?? 'Kim jesteśmy'
  const lead  = d['lead']  ?? 'Jesteśmy agencją cyfrową z pasją do tworzenia wyjątkowych doświadczeń online.'
  const body  = d['body']  ?? ''

  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: '9rem', paddingBottom: 'var(--section-y)', background: 'var(--color-surface)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <Reveal>
            <p className="section-label" style={{ marginBottom: '1rem' }}>O nas</p>
            <h1
              className="display"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1.5rem' }}
            >
              {title}
            </h1>
            <p style={{ fontSize: 'clamp(1.0625rem, 2vw, 1.25rem)', color: 'var(--color-muted)', lineHeight: 1.7 }}>
              {lead}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Content from CMS */}
      {body && (
        <section style={{ padding: 'var(--section-y) 0' }}>
          <div
            className="container"
            style={{ maxWidth: '760px', fontSize: '1.0625rem', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </section>
      )}

      {/* Values */}
      {!body && (
        <section style={{ padding: 'var(--section-y) 0' }}>
          <div className="container">
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap:                 '1.25rem',
            }}>
              {[
                { num: '01', title: 'Jakość',       desc: 'Każdy projekt traktujemy z pełnym zaangażowaniem — bez skrótów.' },
                { num: '02', title: 'Transparentność', desc: 'Jasne umowy, realistyczne wyceny i otwarta komunikacja.' },
                { num: '03', title: 'Innowacja',    desc: 'Stale rozwijamy nasze kompetencje i śledzamy trendy technologiczne.' },
                { num: '04', title: 'Partnerstwo',  desc: 'Budujemy długoterminowe relacje, a nie jednorazowe transakcje.' },
              ].map(({ num, title: t, desc }, i) => (
                <Reveal key={num} delay={i * 0.08}>
                  <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                      {num}
                    </p>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.625rem' }}>{t}</h3>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Cta />
    </>
  )
}
