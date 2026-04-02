import { ReservationWidget } from '@/components/reservations/reservation-widget'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const metadata = {
  title: 'Rezerwacja online',
  description: 'Zarezerwuj termin online. Wybierz usługę, datę i godzinę.',
}

export default function ReservationPage() {
  return (
    <section style={{ padding: 'clamp(4rem, 8vw, 8rem) 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}>
            Rezerwacja <span className="gradient-text">online</span>
          </h1>
          <p style={{
            fontSize: '1.0625rem',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            Wybierz usługę, termin i zarezerwuj wizytę. Płatność online przez Autopay.
          </p>
        </div>

        <ReservationWidget apiUrl={API_URL} />
      </div>
    </section>
  )
}
