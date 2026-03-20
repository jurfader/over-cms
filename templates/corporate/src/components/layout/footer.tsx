'use client'

import Image from 'next/image'

const COL_USLUGI = [
  'Tworzenie stron WWW',
  'Sklepy WooCommerce',
  'Aplikacje mobilne',
  'Montaż wideo',
  'Social Media Marketing',
  'Kampanie reklamowe',
  'Serwis IT',
]

const COL_FIRMA = [
  { label: 'O nas',           href: '#o-nas'     },
  { label: 'Portfolio',       href: '#portfolio' },
  { label: 'Opinie klientów', href: '#opinie'    },
  { label: 'Cennik',          href: '#cennik'    },
  { label: 'Blog',            href: '#blog'      },
]

const SOCIALS = [
  {
    label: 'Facebook',
    href:  'https://facebook.com',
    path:  'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  },
  {
    label: 'Instagram',
    href:  'https://instagram.com',
    path:  'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M7.5 2h9a5.5 5.5 0 0 1 5.5 5.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z',
  },
  {
    label: 'TikTok',
    href:  'https://tiktok.com',
    path:  'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.02-.08z',
  },
  {
    label: 'YouTube',
    href:  'https://youtube.com',
    path:  'M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42C1 8.14 1 11.61 1 11.61s0 3.47.46 5.19a2.78 2.78 0 0 0 1.95 1.95C5.12 19.22 12 19.22 12 19.22s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.08 23 11.61 23 11.61s0-3.47-.46-5.19z M9.75 15.02 15.5 11.61 9.75 8.2 9.75 15.02',
  },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#070707', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '2rem' }}>

        {/* Grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap:                 '3rem',
          marginBottom:        '3rem',
        }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <Image
              src="/images/logo.webp"
              alt="OVERMEDIA"
              width={160}
              height={40}
              style={{ height: '32px', width: 'auto', marginBottom: '1rem' }}
            />
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.75, maxWidth: '240px', marginBottom: '1rem' }}>
              Polska agencja interaktywna oferująca profesjonalne tworzenie stron WWW na WordPress, sklepy WooCommerce,
              aplikacje mobilne iOS/Android oraz marketing cyfrowy Google Ads i Meta Ads.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
              &ldquo;Nowa perspektywa Twojej Firmy&rdquo;
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              {SOCIALS.map(({ label, href, path }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width:          '2rem',
                    height:         '2rem',
                    borderRadius:   '50%',
                    background:     'rgba(255,255,255,0.07)',
                    border:         '1px solid rgba(255,255,255,0.1)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    color:          'rgba(255,255,255,0.5)',
                    transition:     'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,64,251,0.2)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color      = 'var(--color-primary)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.07)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color      = 'rgba(255,255,255,0.5)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Usługi Digital */}
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
              Usługi Digital
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {COL_USLUGI.map((s) => (
                <li key={s}>
                  <a
                    href="#uslugi"
                    style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.45)' }}
                  >
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Firma */}
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
              Firma
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {COL_FIRMA.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.45)' }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
              Kontakt
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <a href="mailto:kontakt@overmedia.pl" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-primary)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.45)' }}>
                kontakt@overmedia.pl
              </a>
              <a href="tel:+48571501896" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.45)' }}>
                +48 571 501 896
              </a>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)' }}>NIP: 875-156-53-27</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.65 }}>
              Pon – Pt: 9:00 – 17:00<br />Sob – Nd: Zamknięte
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop:     '1.5rem',
          borderTop:      '1px solid rgba(255,255,255,0.05)',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          flexWrap:       'wrap',
          gap:            '0.75rem',
        }}>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)' }}>
            &copy; {year} OVERMEDIA. Wszelkie prawa zastrzeżone.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {['Polityka prywatności', 'Regulamin', 'Cookies'].map((l) => (
              <a
                key={l}
                href="#"
                style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.6)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.25)' }}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
