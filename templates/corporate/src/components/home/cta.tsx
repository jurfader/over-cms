'use client'

import { useState } from 'react'
import { ArrowRight, Mail, Phone, Building2 } from 'lucide-react'
import { Reveal } from '@/components/gsap/reveal'
import type { ContactInfoCms } from '@/lib/cms-types'

const SERVICES_OPTIONS = [
  'Strona internetowa',
  'Sklep e-commerce',
  'Aplikacja mobilna',
  'Montaż wideo',
  'Rolki & Reels',
  'Social Media',
  'Kampanie Ads',
  'Serwis IT',
  'Inne',
]

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '0.75rem 1rem',
  borderRadius: 'var(--radius-sm)',
  background:   'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.1)',
  color:        '#fff',
  fontSize:     '0.9375rem',
  outline:      'none',
  transition:   'border-color 0.2s',
  boxSizing:    'border-box',
  fontFamily:   'inherit',
}

export function Cta({ cms }: { cms?: ContactInfoCms }) {
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({
    name: '', email: '', phone: '', service: '', message: '', gdpr: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // TODO: replace with your form endpoint (Formspree / Getform / API route)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
  }

  return (
    <section id="kontakt" style={{ padding: 'var(--section-y) 0', background: 'var(--color-surface)' }}>
      <div className="container">

        <Reveal style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p className="section-label" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            Kontakt z Agencją
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Bezpłatna Wycena Strony<br />
            <span className="gradient-text">lub Projektu</span>
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.55)', maxWidth: '560px', margin: '0 auto' }}>
            Potrzebujesz wyceny strony internetowej, sklepu e-commerce lub kampanii reklamowej?
            Wypełnij formularz kontaktowy, a odpowiemy w ciągu 24 godzin z indywidualną ofertą.
          </p>
        </Reveal>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap:                 '3rem',
          alignItems:          'start',
        }}>

          {/* Contact info */}
          <Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {[
                { icon: <Mail size={18} aria-hidden />,      label: 'Email',   value: cms?.email ?? 'kontakt@overmedia.pl',  href: `mailto:${cms?.email ?? 'kontakt@overmedia.pl'}`  },
                { icon: <Phone size={18} aria-hidden />,     label: 'Telefon', value: cms?.phone ?? '+48 571 501 896',        href: `tel:${(cms?.phone ?? '+48 571 501 896').replace(/\s/g, '')}`             },
                { icon: <Building2 size={18} aria-hidden />, label: 'NIP',     value: cms?.nip ?? '875-156-53-27',          href: undefined                      },
              ].map(({ icon, label, value, href }) => (
                <div
                  key={label}
                  className="glass"
                  style={{ borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(224,64,251,0.1)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, color: 'var(--color-primary)',
                  }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.2rem' }}>
                      {label}
                    </p>
                    {href ? (
                      <a href={href} style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '1rem', textDecoration: 'none' }}>
                        {value}
                      </a>
                    ) : (
                      <p style={{ fontWeight: 600, color: 'var(--color-fg)', fontSize: '1rem' }}>{value}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Hours + social */}
              <div className="glass" style={{ borderRadius: 'var(--radius)', padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.75rem' }}>
                    Godziny pracy
                  </p>
                  <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
                    {cms?.hours_text ?? 'Pon – Pt: 9:00 – 17:00'}<br />
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Sob – Nd: Zamknięte</span>
                  </p>
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.75rem' }}>
                  Szybka odpowiedź
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                  Zazwyczaj odpowiadamy w ciągu 24 godzin
                </p>
              </div>

              {/* Social */}
              <div className="glass" style={{ borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.875rem' }}>
                  Znajdziesz nas też na:
                </p>
                <div style={{ display: 'flex', gap: '0.875rem' }}>
                  {[
                    { label: 'Facebook', href: cms?.facebook_url || 'https://facebook.com', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                    { label: 'Instagram', href: cms?.instagram_url || 'https://instagram.com', path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M7.5 2h9a5.5 5.5 0 0 1 5.5 5.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z' },
                    { label: 'TikTok', href: cms?.tiktok_url || 'https://tiktok.com', path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.02-.08z' },
                    { label: 'YouTube', href: cms?.youtube_url || 'https://youtube.com', path: 'M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42C1 8.14 1 11.61 1 11.61s0 3.47.46 5.19a2.78 2.78 0 0 0 1.95 1.95C5.12 19.22 12 19.22 12 19.22s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.08 23 11.61 23 11.61s0-3.47-.46-5.19z M9.75 15.02 15.5 11.61 9.75 8.2 9.75 15.02' },
                  ].map(({ label, href, path }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      style={{
                        width:          '2.25rem',
                        height:         '2.25rem',
                        borderRadius:   '50%',
                        background:     'rgba(255,255,255,0.07)',
                        border:         '1px solid rgba(255,255,255,0.1)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        color:          'rgba(255,255,255,0.6)',
                        transition:     'background 0.2s, color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,64,251,0.2)'
                        ;(e.currentTarget as HTMLAnchorElement).style.color      = 'var(--color-primary)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.07)'
                        ;(e.currentTarget as HTMLAnchorElement).style.color      = 'rgba(255,255,255,0.6)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.12}>
            {sent ? (
              <div
                className="glass"
                style={{ borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', border: '1px solid rgba(224,64,251,0.25)' }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '0.75rem' }}>Wiadomość wysłana!</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                  Dziękujemy za kontakt. Odpiszemy w ciągu 24 godzin z indywidualną ofertą.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="glass"
                suppressHydrationWarning
                style={{ borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>
                      Imię i nazwisko *
                    </label>
                    <input
                      required type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jan Kowalski"
                      style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(224,64,251,0.5)' }}
                      onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+48 123 456 789"
                      style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(224,64,251,0.5)' }}
                      onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>
                    Email *
                  </label>
                  <input
                    required type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jan@firma.pl"
                    style={inputStyle}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(224,64,251,0.5)' }}
                    onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>
                    Usługa
                  </label>
                  <select
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = 'rgba(224,64,251,0.5)' }}
                    onBlur={(e)  => { (e.target as HTMLSelectElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                  >
                    <option value="" style={{ background: '#111' }}>Wybierz usługę...</option>
                    {SERVICES_OPTIONS.map((s) => (
                      <option key={s} value={s} style={{ background: '#111' }}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>
                    Wiadomość *
                  </label>
                  <textarea
                    required rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Opisz swój projekt lub zadaj pytanie..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(224,64,251,0.5)' }}
                    onBlur={(e)  => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                {/* GDPR */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    required
                    type="checkbox"
                    checked={form.gdpr}
                    onChange={(e) => setForm({ ...form, gdpr: e.target.checked })}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--color-primary)', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                    Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z Polityką Prywatności. *
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ justifyContent: 'center', fontSize: '1rem', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Wysyłanie...' : 'Wyślij wiadomość'}
                  {!loading && <ArrowRight size={18} aria-hidden />}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
