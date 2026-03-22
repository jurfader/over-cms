import type { Metadata } from 'next'
import { CheckCircle2, Zap, Building2, Rocket } from 'lucide-react'
import { CheckoutButton } from '@/components/checkout-button'

export const metadata: Metadata = {
  title: 'Cennik',
}

// ─── Plan definitions ─────────────────────────────────────────────────────────

const plans = [
  {
    id:          'trial' as const,
    icon:        Rocket,
    name:        'Trial',
    price:       'Bezpłatny',
    period:      '14 dni',
    description: 'Przetestuj OverCMS bez zobowiązań.',
    features: [
      '1 instalacja',
      'Wszystkie funkcje',
      'Pełna dokumentacja',
      'Wsparcie e-mail',
    ],
    cta:      'Zacznij za darmo',
    href:     'mailto:hello@overcms.pl?subject=Trial',
    featured: false,
    disabled: false,
  },
  {
    id:          'solo' as const,
    icon:        Zap,
    name:        'Solo',
    price:       '299 zł',
    period:      'jednorazowo',
    description: 'Dla freelancerów i pojedynczych projektów.',
    features: [
      '1 instalacja',
      'Dożywotnia licencja',
      'Wszystkie moduły core',
      'Aktualizacje 12 miesięcy',
      'Wsparcie e-mail',
    ],
    cta:      'Kup Solo',
    featured: false,
    disabled: false,
  },
  {
    id:          'agency' as const,
    icon:        Building2,
    name:        'Agency',
    price:       '999 zł',
    period:      'jednorazowo',
    description: 'Dla agencji i wielu projektów klientów.',
    features: [
      'Nielimitowane instalacje',
      'Dożywotnia licencja',
      'Wszystkie moduły core',
      'Aktualizacje 12 miesięcy',
      'Wsparcie priorytetowe',
      'White-label',
    ],
    cta:      'Kup Agency',
    featured: true,
    disabled: false,
  },
]

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-6">
      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="py-24 text-center fade-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium glass mb-6 text-[var(--color-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          Headless CMS nowej generacji
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          Prosty cennik,<br />
          <span className="gradient-text">zero niespodzianek</span>
        </h1>
        <p className="text-lg text-[var(--color-muted)] max-w-xl mx-auto">
          Jednorazowa płatność. Dożywotnia licencja. Bez subskrypcji.
        </p>
      </section>

      {/* ─── Pricing cards ──────────────────────────────────────────────────── */}
      <section id="pricing" className="pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={[
                  'relative rounded-2xl p-8 flex flex-col gap-6 transition-transform hover:-translate-y-1',
                  plan.featured
                    ? 'gradient-border bg-[var(--color-surface)]'
                    : 'glass',
                ].join(' ')}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
                      Najpopularniejszy
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{plan.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{plan.description}</p>
                  </div>
                </div>

                <div>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-[var(--color-muted)] ml-2">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--color-muted)]">
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === 'trial' ? (
                  <a
                    href={plan.href}
                    className="block text-center py-3 rounded-xl text-sm font-semibold border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <CheckoutButton plan={plan.id} label={plan.cta} featured={plan.featured} />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="pb-24 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Często zadawane pytania</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Czy licencja jest dożywotnia?',
              a: 'Tak. Płacisz raz i korzystasz bez limitu czasowego. Aktualizacje są dołączone przez 12 miesięcy.',
            },
            {
              q: 'Jak aktywować licencję?',
              a: 'Po zakupie otrzymasz klucz licencyjny e-mailem. Wpisz go w ustawieniach panelu admina OverCMS.',
            },
            {
              q: 'Czy mogę zmieniać instalację?',
              a: 'Tak. W portalu klienta możesz deaktywować starą instalację i aktywować CMS na nowej domenie.',
            },
            {
              q: 'Co obejmuje wsparcie?',
              a: 'Wsparcie e-mail dla wszystkich planów. Plan Agency ma priorytetowy czas odpowiedzi (do 24h).',
            },
          ].map(({ q, a }) => (
            <details key={q} className="glass rounded-xl p-5 group">
              <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
                {q}
                <span className="text-[var(--color-muted)] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-[var(--color-muted)] leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
