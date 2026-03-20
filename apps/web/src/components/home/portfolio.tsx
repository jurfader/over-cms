'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/gsap/reveal'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PortfolioItem {
  id:          string
  title:       string
  slug:        string
  excerpt?:    string
  cover?:      string
  category?:   string
  url?:        string
  tags?:       string[]
}

interface PortfolioProps {
  items:       PortfolioItem[]
  label?:      string
  title?:      string
  subtitle?:   string
  categories?: string[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Portfolio({
  items,
  label    = 'Portfolio',
  title    = 'Nasze realizacje',
  subtitle = 'Wybrane projekty, które zrealizowaliśmy dla naszych klientów.',
  categories,
}: PortfolioProps) {
  const [active, setActive] = useState<string | null>(null)

  const allCategories = categories ?? [
    ...new Set(items.map((p) => p.category).filter(Boolean) as string[]),
  ]

  const filtered = active
    ? items.filter((p) => p.category === active)
    : items

  return (
    <section style={{ paddingBlock: 'var(--section-y)' }} id="portfolio">
      <div className="container">

        <Reveal>
          <div className="text-center mb-14">
            <span className="section-label mb-4">{label}</span>
            <h2 className="display text-4xl md:text-5xl font-bold mt-3 mb-4">{title}</h2>
            <p className="text-[var(--color-muted)] max-w-xl mx-auto">{subtitle}</p>
          </div>
        </Reveal>

        {/* Category filter */}
        {allCategories.length > 0 && (
          <Reveal delay={0.1}>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setActive(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  active === null
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-fg)]'
                }`}
              >
                Wszystkie
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    active === cat
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-fg)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <Reveal key={item.id} delay={0.05 * (i % 6)}>
              <a
                href={item.url ?? `/portfolio/${item.slug}`}
                className="group block rounded-[var(--radius)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-border)]">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-sm">
                      Brak zdjęcia
                    </div>
                  )}
                  {item.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-base leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                      {item.title}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                  </div>
                  {item.excerpt && (
                    <p className="text-sm text-[var(--color-muted)] mt-2 line-clamp-2">{item.excerpt}</p>
                  )}
                  {!!item.tags?.length && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-border)] text-[var(--color-muted)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
