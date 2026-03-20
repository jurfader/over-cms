import type { Metadata } from 'next'
import { Reveal }        from '@/components/gsap/reveal'
import { ContactForm }   from '@/components/contact/contact-form'
import { cms }           from '@/lib/cms'
import { Mail, Phone, MapPin } from 'lucide-react'

export const revalidate = 60

export const metadata: Metadata = {
  title:       'Kontakt',
  description: 'Skontaktuj się z nami.',
}

export default async function ContactPage() {
  const settings = await cms.settings.all().catch((): Record<string, unknown> => ({}))

  const email   = (settings['site.contactEmail'] as string | undefined) ?? 'hello@example.com'
  const address = (settings['site.address']      as string | undefined) ?? ''
  const phone   = (settings['site.phone']        as string | undefined) ?? ''

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: 'var(--section-y)' }}>
      <div className="container">
        {/* Header */}
        <Reveal style={{ marginBottom: '4rem', maxWidth: '600px' }}>
          <p className="section-label" style={{ marginBottom: '1rem' }}>Kontakt</p>
          <h1 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem' }}>
            Porozmawiajmy
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
            Wypełnij formularz lub napisz bezpośrednio na poniższy adres email — odpiszemy w ciągu jednego dnia roboczego.
          </p>
        </Reveal>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap:                 'clamp(2.5rem, 6vw, 5rem)',
          alignItems:          'start',
        }}>
          {/* Form */}
          <Reveal>
            <ContactForm />
          </Reveal>

          {/* Contact details */}
          <Reveal delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <ContactDetail icon={Mail} label="Email" value={email} href={`mailto:${email}`} />
              {phone   && <ContactDetail icon={Phone}  label="Telefon" value={phone}   href={`tel:${phone}`} />}
              {address && <ContactDetail icon={MapPin} label="Adres"   value={address} />}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}

function ContactDetail({
  icon: Icon, label, value, href,
}: { icon: React.ElementType; label: string; value: string; href?: string }) {
  return (
    <div
      className="glass"
      style={{ borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
    >
      <div style={{
        width:         '2.5rem',
        height:        '2.5rem',
        borderRadius:  'var(--radius-sm)',
        background:    'color-mix(in oklch, var(--color-primary) 10%, transparent)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        color:         'var(--color-primary)',
        flexShrink:    0,
      }}>
        <Icon size={18} />
      </div>
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
          {label}
        </p>
        {href
          ? <a href={href} style={{ fontSize: '0.9375rem', color: 'var(--color-fg)', textDecoration: 'none', fontWeight: 500 }}>{value}</a>
          : <p style={{ fontSize: '0.9375rem', color: 'var(--color-fg)', fontWeight: 500 }}>{value}</p>
        }
      </div>
    </div>
  )
}
