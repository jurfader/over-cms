'use client'

import { useState } from 'react'
import { Send, CheckCircle2, Loader2 } from 'lucide-react'

interface FormState {
  name:    string
  email:   string
  message: string
}

export function ContactForm() {
  const [form,   setForm]   = useState<FormState>({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const field = (key: keyof FormState) => ({
    value:    form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/m/forms/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          formId: 'contact',
          name:   form.name,
          email:  form.email,
          data:   { message: form.message },
        }),
      })
      if (!res.ok) throw new Error('submit failed')
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border:       '1.5px solid var(--color-border)',
    background:   'var(--color-surface)',
    color:        'var(--color-fg)',
    fontSize:     '0.9375rem',
    outline:      'none',
    transition:   'border-color 0.15s',
    fontFamily:   'inherit',
  }

  if (status === 'sent') {
    return (
      <div
        className="glass"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding:      '3rem 2rem',
          textAlign:    'center',
          display:      'flex',
          flexDirection:'column',
          alignItems:   'center',
          gap:          '1rem',
        }}
      >
        <CheckCircle2 size={40} style={{ color: 'var(--color-primary)' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Wiadomość wysłana!</h3>
        <p style={{ color: 'var(--color-muted)' }}>Odezwiemy się wkrótce.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass"
      style={{ borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Imię i nazwisko</label>
          <input
            {...field('name')}
            required
            placeholder="Jan Kowalski"
            style={inputStyle}
            onFocus={(e)  => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e)   => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Email</label>
          <input
            {...field('email')}
            required
            type="email"
            placeholder="jan@firma.pl"
            style={inputStyle}
            onFocus={(e)  => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e)   => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Wiadomość</label>
        <textarea
          {...field('message')}
          required
          rows={6}
          placeholder="Opisz swój projekt lub zapytanie..."
          style={{ ...inputStyle, resize: 'vertical', minHeight: '140px' }}
          onFocus={(e)  => (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={(e)   => (e.target.style.borderColor = 'var(--color-border)')}
        />
      </div>

      {status === 'error' && (
        <p style={{ fontSize: '0.875rem', color: '#ef4444' }}>
          Wystąpił błąd. Spróbuj ponownie lub napisz bezpośrednio na email.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn btn-primary"
        style={{ justifyContent: 'center', fontSize: '1rem', padding: '0.875rem 2rem' }}
      >
        {status === 'sending'
          ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Wysyłanie...</>
          : <><Send size={18} /> Wyślij wiadomość</>
        }
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
