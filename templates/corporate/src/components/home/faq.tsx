'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Reveal } from '@/components/gsap/reveal'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FaqItem {
  id:       string
  question: string
  answer:   string
}

interface FaqProps {
  items:     FaqItem[]
  label?:    string
  title?:    string
  subtitle?: string
  columns?:  1 | 2
}

// ─── Single item ──────────────────────────────────────────────────────────────

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
      >
        <span className="font-semibold leading-snug">{item.question}</span>
        <span
          className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] flex items-center justify-center transition-transform ${open ? 'rotate-45' : ''}`}
          aria-hidden
        >
          <Plus className="w-3.5 h-3.5" />
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '600px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 text-[var(--color-muted)] leading-relaxed">
          {item.answer}
        </p>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Faq({
  items,
  label    = 'FAQ',
  title    = 'Często zadawane pytania',
  subtitle = 'Odpowiedzi na najczęstsze pytania naszych klientów.',
  columns  = 1,
}: FaqProps) {
  if (!items.length) return null

  const half = Math.ceil(items.length / 2)
  const col1 = columns === 2 ? items.slice(0, half) : items
  const col2 = columns === 2 ? items.slice(half)    : []

  return (
    <section style={{ paddingBlock: 'var(--section-y)' }} id="faq">
      <div className="container">

        <Reveal>
          <div className="text-center mb-14">
            <span className="section-label mb-4">{label}</span>
            <h2 className="display text-4xl md:text-5xl font-bold mt-3 mb-4">{title}</h2>
            <p className="text-[var(--color-muted)] max-w-xl mx-auto">{subtitle}</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {columns === 2 ? (
            <div className="grid md:grid-cols-2 gap-x-16">
              <div>
                {col1.map((item) => <FaqRow key={item.id} item={item} />)}
              </div>
              <div>
                {col2.map((item) => <FaqRow key={item.id} item={item} />)}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {col1.map((item) => <FaqRow key={item.id} item={item} />)}
            </div>
          )}
        </Reveal>

      </div>
    </section>
  )
}
