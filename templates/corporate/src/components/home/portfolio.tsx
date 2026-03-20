'use client'

import { useState }  from 'react'
import { ArrowRight } from 'lucide-react'
import { Reveal }     from '@/components/gsap/reveal'
import Image          from 'next/image'
import type { PortfolioItemCms } from '@/lib/cms-types'

type Category = 'Wszystkie' | 'Aplikacje' | 'Branding' | 'Sklepy' | 'Strony WWW' | 'Video'

const ALL_CATEGORIES: Category[] = ['Wszystkie', 'Aplikacje', 'Branding', 'Sklepy', 'Strony WWW', 'Video']

const DEFAULT_PROJECTS = [
  {
    id:          'chicken-king-app',
    title:       'iOS/Android Chicken King APP',
    category:    'Aplikacje' as Category,
    tags:        ['Flutter', 'Dart', 'PHP'],
    description: 'Aplikacja mobilna iOS i Android dla sieci restauracji. Zamówienia online, program lojalnościowy i powiadomienia push.',
    image:       '/images/portfolio-chicken-king-app.webp',
  },
  {
    id:          'angielski-od-podstaw',
    title:       'Angielski od Podstaw',
    category:    'Strony WWW' as Category,
    tags:        ['WordPress', 'Elementor'],
    description: 'Strona internetowa szkoły językowej z systemem zapisów online, blogiem i bazą materiałów edukacyjnych.',
    image:       '/images/portfolio-angielski.webp',
  },
  {
    id:          'raptor',
    title:       'Strona wizytówkowa dla sklepu RAPTOR',
    category:    'Strony WWW' as Category,
    tags:        ['WordPress', 'Elementor', 'PHP', 'JavaScript'],
    description: 'Profesjonalna strona wizytówkowa z animacjami, formularzem kontaktowym i integracją z Google Maps.',
    image:       '/images/portfolio-raptor.webp',
  },
  {
    id:          'chicken-king-family',
    title:       'Chicken King Family',
    category:    'Sklepy' as Category,
    tags:        ['WordPress', 'Divi', 'PHP', 'JavaScript'],
    description: 'Sklep internetowy z menu restauracyjnym, zamówieniami online, integracją PayU i BLIK.',
    image:       '/images/portfolio-chicken-king-family.webp',
  },
]

export function Portfolio({ cms }: { cms?: PortfolioItemCms[] }) {
  const projects = cms
    ? [...cms]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((p) => ({
          id:          p._id,
          title:       p.title,
          category:    p.category as Category,
          tags:        p.tags.split(',').map((t) => t.trim()).filter(Boolean),
          description: p.description,
          image:       p.image,
        }))
    : DEFAULT_PROJECTS

  const categories: Category[] = ['Wszystkie', ...Array.from(new Set(projects.map((p) => p.category)))] as Category[]

  const [active, setActive] = useState<Category>('Wszystkie')

  const filtered = active === 'Wszystkie'
    ? projects
    : projects.filter((p) => p.category === active)

  return (
    <section id="portfolio" style={{ padding: 'var(--section-y) 0' }}>
      <div className="container">

        <Reveal style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p className="section-label" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            Portfolio Realizacji
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Przykłady Stron i{' '}
            <span className="gradient-text">Projektów</span>
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.55)', maxWidth: '540px', margin: '0 auto' }}>
            Prezentujemy wybrane realizacje stron internetowych, sklepów e-commerce i projektów wideo.
            Każdy projekt jest indywidualnie dopasowany do potrzeb klienta i jego branży.
          </p>
        </Reveal>

        {/* Filter tabs */}
        <Reveal style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
          {(cms ? categories : ALL_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                padding:      '0.5rem 1.125rem',
                borderRadius: '999px',
                fontSize:     '0.875rem',
                fontWeight:   600,
                border:       '1px solid',
                borderColor:  active === cat ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                cursor:       'pointer',
                transition:   'all 0.2s',
                background:   active === cat ? 'var(--color-primary)' : 'transparent',
                color:        active === cat ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            >
              {cat}
            </button>
          ))}
        </Reveal>

        {/* Grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap:                 '1.5rem',
          marginBottom:        '3rem',
        }}>
          {filtered.map((project, i) => (
            <Reveal key={project.id} delay={i * 0.07}>
              <div
                className="glass"
                style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                }}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative', height: '220px', background: '#161616', overflow: 'hidden' }}>
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    style={{ objectFit: 'cover', transition: 'transform 0.4s' }}
                    sizes="(max-width: 768px) 100vw, 400px"
                    onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)' }}
                    onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
                  />
                  <span style={{
                    position:       'absolute',
                    top:            '0.75rem',
                    left:           '0.75rem',
                    fontSize:       '0.6875rem',
                    fontWeight:     700,
                    letterSpacing:  '0.1em',
                    textTransform:  'uppercase',
                    color:          'rgba(255,255,255,0.9)',
                    padding:        '0.3rem 0.75rem',
                    borderRadius:   '999px',
                    background:     'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(8px)',
                  }}>
                    {project.category}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.625rem', lineHeight: 1.3 }}>
                    {project.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '1rem' }}>
                    {project.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding:      '0.2rem 0.625rem',
                          borderRadius: '4px',
                          fontSize:     '0.75rem',
                          fontWeight:   600,
                          background:   'rgba(224,64,251,0.1)',
                          color:        'var(--color-primary)',
                          border:       '1px solid rgba(224,64,251,0.2)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal style={{ textAlign: 'center' }}>
          <a href="#kontakt" className="btn btn-outline" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
            Zobacz więcej projektów
            <ArrowRight size={17} aria-hidden />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
