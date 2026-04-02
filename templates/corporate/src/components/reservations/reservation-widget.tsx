'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  slug: string
  name: string
  description: string | null
  durationMinutes: number
  capacity: number
  price: number
  currency: string
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
  remainingCapacity: number
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReservationWidgetProps {
  apiUrl: string
  serviceSlug?: string
  locale?: 'pl' | 'en'
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(grosze: number, currency: string) {
  return grosze === 0 ? 'Bezpłatne' : `${(grosze / 100).toFixed(2)} ${currency}`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]!
}

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 'service' | 'date' | 'time' | 'details' | 'summary' | 'redirecting'

export function ReservationWidget({
  apiUrl,
  serviceSlug,
  className = '',
}: ReservationWidgetProps) {
  const moduleApi = `${apiUrl}/api/m/reservations`

  // State
  const [step, setStep] = useState<Step>(serviceSlug ? 'date' : 'service')
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    guestCount: 1,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch services ────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`${moduleApi}/services`)
      .then(r => r.json())
      .then(r => {
        setServices(r.data ?? [])
        if (serviceSlug) {
          const svc = (r.data ?? []).find((s: Service) => s.slug === serviceSlug)
          if (svc) setSelectedService(svc)
        }
      })
      .catch(() => {})
  }, [moduleApi, serviceSlug])

  // ── Fetch slots when date changes ─────────────────────────────────────

  useEffect(() => {
    if (!selectedService || !selectedDate) return
    setSlots([])
    setSelectedSlot(null)
    fetch(`${moduleApi}/services/${selectedService.slug}/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(r => setSlots(r.data ?? []))
      .catch(() => {})
  }, [moduleApi, selectedService, selectedDate])

  // ── Handlers ──────────────────────────────────────────────────────────

  const selectService = (svc: Service) => {
    setSelectedService(svc)
    setStep('date')
  }

  const selectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep('details')
  }

  const goToSummary = () => {
    if (!form.customerName || !form.customerEmail) return
    setStep('summary')
  }

  const submitBooking = async () => {
    if (!selectedService || !selectedSlot) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${moduleApi}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: selectedService.slug,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          ...form,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Wystąpił błąd')
        setLoading(false)
        return
      }

      if (data.data.redirectUrl) {
        setStep('redirecting')
        window.location.href = data.data.redirectUrl
      } else {
        // Free service — redirect to success
        window.location.href = `/rezerwacja/success?id=${data.data.reservationId}`
      }
    } catch {
      setError('Nie udało się utworzyć rezerwacji. Spróbuj ponownie.')
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={`rsv-widget ${className}`} style={{
      fontFamily: 'var(--rsv-font, var(--font-sans, system-ui))',
      color: 'var(--rsv-text, var(--color-fg, #fff))',
      maxWidth: '640px',
      margin: '0 auto',
    }}>

      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem' }}>
        {['service', 'date', 'time', 'details', 'summary'].map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: '3px',
              borderRadius: '2px',
              background: ['service', 'date', 'time', 'details', 'summary'].indexOf(step) >= i
                ? 'var(--rsv-primary, var(--color-primary, #E040FB))'
                : 'var(--rsv-border, rgba(255,255,255,0.1))',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Step 1: Select service */}
      {step === 'service' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Wybierz usługę</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {services.map(svc => (
              <button
                key={svc.slug}
                onClick={() => selectService(svc)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '1.25rem',
                  borderRadius: 'var(--rsv-radius, 12px)',
                  border: '1px solid var(--rsv-border, rgba(255,255,255,0.1))',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'inherit',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem' }}>{svc.name}</div>
                {svc.description && (
                  <div style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: '0.5rem' }}>{svc.description}</div>
                )}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', opacity: 0.5 }}>
                  <span>{svc.durationMinutes} min</span>
                  <span style={{ fontWeight: 600, color: 'var(--rsv-primary, #E040FB)' }}>
                    {formatPrice(svc.price, svc.currency)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select date */}
      {step === 'date' && selectedService && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {selectedService.name}
          </h2>
          <p style={{ opacity: 0.5, marginBottom: '1.5rem', fontSize: '0.875rem' }}>Wybierz datę</p>
          <input
            type="date"
            value={selectedDate}
            min={todayStr()}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--rsv-radius, 8px)',
              border: '1px solid var(--rsv-border, rgba(255,255,255,0.1))',
              background: 'rgba(255,255,255,0.05)',
              color: 'inherit',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            {!serviceSlug && (
              <button onClick={() => setStep('service')} style={btnOutline}>Wstecz</button>
            )}
            <button onClick={() => setStep('time')} style={btnPrimary}>Dalej</button>
          </div>
        </div>
      )}

      {/* Step 3: Select time */}
      {step === 'time' && selectedService && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Wybierz godzinę
          </h2>
          <p style={{ opacity: 0.5, marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {selectedDate} · {selectedService.name}
          </p>

          {slots.length === 0 ? (
            <p style={{ opacity: 0.4, textAlign: 'center', padding: '2rem' }}>
              Brak dostępnych terminów w tym dniu
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
              {slots.map(slot => (
                <button
                  key={slot.startTime}
                  onClick={() => slot.available && selectSlot(slot)}
                  disabled={!slot.available}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--rsv-radius, 8px)',
                    border: '1px solid',
                    borderColor: !slot.available ? 'transparent' : selectedSlot?.startTime === slot.startTime
                      ? 'var(--rsv-primary, #E040FB)'
                      : 'var(--rsv-border, rgba(255,255,255,0.1))',
                    background: !slot.available ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    color: !slot.available ? 'rgba(255,255,255,0.2)' : 'inherit',
                    cursor: slot.available ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep('date')} style={btnOutline}>Wstecz</button>
          </div>
        </div>
      )}

      {/* Step 4: Customer details */}
      {step === 'details' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Twoje dane</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Imię i nazwisko *</label>
              <input
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="Jan Kowalski"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                placeholder="jan@firma.pl"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Telefon</label>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                placeholder="+48 123 456 789"
                style={inputStyle}
              />
            </div>
            {selectedService && selectedService.capacity > 1 && (
              <div>
                <label style={labelStyle}>Liczba osób</label>
                <input
                  type="number"
                  min={1}
                  max={selectedService.capacity}
                  value={form.guestCount}
                  onChange={e => setForm(f => ({ ...f, guestCount: Number(e.target.value) }))}
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>Uwagi</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Dodatkowe informacje..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' as const }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep('time')} style={btnOutline}>Wstecz</button>
            <button
              onClick={goToSummary}
              disabled={!form.customerName || !form.customerEmail}
              style={btnPrimary}
            >
              Dalej
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Summary */}
      {step === 'summary' && selectedService && selectedSlot && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Podsumowanie</h2>
          <div style={{
            padding: '1.5rem',
            borderRadius: 'var(--rsv-radius, 12px)',
            border: '1px solid var(--rsv-border, rgba(255,255,255,0.1))',
            background: 'rgba(255,255,255,0.04)',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9375rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.6 }}>Usługa</span>
                <span style={{ fontWeight: 600 }}>{selectedService.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.6 }}>Data</span>
                <span style={{ fontWeight: 600 }}>{selectedDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.6 }}>Godzina</span>
                <span style={{ fontWeight: 600 }}>{selectedSlot.startTime} — {selectedSlot.endTime}</span>
              </div>
              {form.guestCount > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.6 }}>Osoby</span>
                  <span style={{ fontWeight: 600 }}>{form.guestCount}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--rsv-border, rgba(255,255,255,0.1))', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Do zapłaty</span>
                <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--rsv-primary, #E040FB)' }}>
                  {formatPrice(selectedService.price * form.guestCount, selectedService.currency)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(220,38,38,0.1)', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setStep('details')} style={btnOutline}>Wstecz</button>
            <button onClick={submitBooking} disabled={loading} style={btnPrimary}>
              {loading ? 'Przetwarzanie...' : selectedService.price > 0 ? 'Przejdź do płatności' : 'Potwierdź rezerwację'}
            </button>
          </div>
        </div>
      )}

      {/* Redirecting */}
      {step === 'redirecting' && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid var(--rsv-primary, #E040FB)',
            borderTopColor: 'transparent',
            margin: '0 auto 1rem',
            animation: 'rsv-spin 0.8s linear infinite',
          }} />
          <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>Przekierowanie do płatności...</p>
          <style>{`@keyframes rsv-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}

// ─── Shared styles ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--rsv-radius, 8px)',
  border: '1px solid var(--rsv-border, rgba(255,255,255,0.1))',
  background: 'rgba(255,255,255,0.05)',
  color: 'inherit',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  marginBottom: '0.375rem',
  opacity: 0.7,
}

const btnPrimary: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1.5rem',
  borderRadius: '999px',
  border: 'none',
  background: 'var(--rsv-primary, var(--color-primary, #E040FB))',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.9375rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'opacity 0.2s',
}

const btnOutline: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '999px',
  border: '1.5px solid var(--rsv-border, rgba(255,255,255,0.2))',
  background: 'transparent',
  color: 'inherit',
  fontWeight: 600,
  fontSize: '0.9375rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
}
