import { Reveal } from '@/components/gsap/reveal'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestimonialItem {
  id:       string
  name:     string
  role?:    string
  company?: string
  avatar?:  string
  text:     string
  rating?:  number
}

interface TestimonialsProps {
  items:    TestimonialItem[]
  label?:   string
  title?:   string
  subtitle?: string
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-[var(--color-accent)]' : 'text-[var(--color-border)]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Single card ──────────────────────────────────────────────────────────────

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] h-full">
      {/* Rating */}
      {item.rating && <Stars rating={item.rating} />}

      {/* Text */}
      <blockquote className="flex-1 text-[var(--color-fg)] leading-relaxed">
        &ldquo;{item.text}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)]">
        {item.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.avatar}
            alt={item.name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm shrink-0">
            {item.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{item.name}</p>
          {(item.role || item.company) && (
            <p className="text-xs text-[var(--color-muted)] truncate">
              {[item.role, item.company].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Testimonials({
  items,
  label    = 'Opinie',
  title    = 'Co mówią nasi klienci',
  subtitle = 'Zaufali nam i wrócili po więcej.',
}: TestimonialsProps) {
  if (!items.length) return null

  return (
    <section style={{ paddingBlock: 'var(--section-y)' }} className="bg-[var(--color-surface)]">
      <div className="container">

        <Reveal>
          <div className="text-center mb-14">
            <span className="section-label mb-4">{label}</span>
            <h2 className="display text-4xl md:text-5xl font-bold mt-3 mb-4">{title}</h2>
            <p className="text-[var(--color-muted)] max-w-xl mx-auto">{subtitle}</p>
          </div>
        </Reveal>

        <div className={`grid gap-6 ${
          items.length === 1 ? 'max-w-lg mx-auto' :
          items.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' :
          'sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {items.map((item, i) => (
            <Reveal key={item.id} delay={0.08 * i}>
              <TestimonialCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
