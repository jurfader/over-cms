import type { Metadata } from 'next'
import Link               from 'next/link'
import Image              from 'next/image'
import { ArrowRight }     from 'lucide-react'
import { Reveal }         from '@/components/gsap/reveal'
import { cms }            from '@/lib/cms'

export const revalidate = 60

export const metadata: Metadata = {
  title:       'Portfolio',
  description: 'Wybrane projekty i realizacje.',
}

interface ProjectData {
  excerpt?:  string
  cover?:    string
  tags?:     string[]
  client?:   string
}

export default async function PortfolioPage() {
  const projects = await cms.content
    .list<ProjectData>('project', { status: 'published', limit: 48 })
    .catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 48, pages: 0 } }))

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: 'var(--section-y)' }}>
      <div className="container">

        <Reveal style={{ marginBottom: '3.5rem' }}>
          <p className="section-label" style={{ marginBottom: '0.75rem' }}>Portfolio</p>
          <h1
            className="display"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem' }}
          >
            Nasze realizacje
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)', maxWidth: '520px' }}>
            Projekty, które tworzymy z pasją i dbałością o każdy szczegół.
          </p>
        </Reveal>

        {projects.data.length === 0 ? (
          <Reveal>
            <div
              className="glass"
              style={{ borderRadius: 'var(--radius-lg)', padding: '4rem 2rem', textAlign: 'center' }}
            >
              <p style={{ color: 'var(--color-muted)', fontSize: '1.0625rem' }}>
                Brak opublikowanych projektów.
              </p>
            </div>
          </Reveal>
        ) : (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap:                 '1.5rem',
          }}>
            {projects.data.map((project, i) => (
              <Reveal key={project.id} delay={i * 0.06}>
                <Link
                  href={`/portfolio/${project.slug}`}
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <article
                    className="glass"
                    style={{
                      borderRadius:  'var(--radius-lg)',
                      overflow:      'hidden',
                      transition:    'transform 0.25s, box-shadow 0.25s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = 'translateY(-5px)'
                      el.style.boxShadow = '0 16px 48px color-mix(in oklch, var(--color-fg) 8%, transparent)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = 'none'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    {/* Cover */}
                    <div style={{
                      position:   'relative',
                      height:     '220px',
                      background: 'var(--color-surface)',
                      overflow:   'hidden',
                    }}>
                      {project.data.cover ? (
                        <Image
                          src={project.data.cover}
                          alt={project.title}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          height:          '100%',
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  'center',
                          color:           'var(--color-muted)',
                          fontSize:        '2.5rem',
                          fontWeight:      700,
                          fontFamily:      'var(--font-display)',
                        }}>
                          {project.title[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '1.5rem' }}>
                      {project.data.client && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: '0.35rem' }}>
                          {project.data.client}
                        </p>
                      )}
                      <h3 style={{
                        fontSize:   '1.125rem',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        color:      'var(--color-fg)',
                        marginBottom: project.data.excerpt ? '0.625rem' : '0.875rem',
                      }}>
                        {project.title}
                      </h3>
                      {project.data.excerpt && (
                        <p style={{
                          fontSize:   '0.9375rem',
                          color:      'var(--color-muted)',
                          lineHeight: 1.6,
                          marginBottom: '1rem',
                        }}>
                          {project.data.excerpt}
                        </p>
                      )}

                      {/* Tags */}
                      {project.data.tags && project.data.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {project.data.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize:        '0.75rem',
                                fontWeight:      500,
                                padding:         '0.2em 0.65em',
                                borderRadius:    '999px',
                                background:      'var(--color-surface)',
                                border:          '1px solid var(--color-border)',
                                color:           'var(--color-muted)',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <span style={{
                        display:    'inline-flex',
                        alignItems: 'center',
                        gap:        '0.375rem',
                        fontSize:   '0.9rem',
                        fontWeight: 600,
                        color:      'var(--color-primary)',
                      }}>
                        Zobacz projekt <ArrowRight size={14} />
                      </span>
                    </div>
                  </article>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
