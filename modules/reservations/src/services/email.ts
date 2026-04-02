import { Resend } from 'resend'
import { db, eq, modules } from '@overcms/core'

interface ReservationData {
  id: string
  date: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  guestCount: number
  totalPrice: number
  currency: string
  notes?: string | null
  serviceName: string
}

async function getConfig() {
  const [mod] = await db
    .select({ config: modules.config })
    .from(modules)
    .where(eq(modules.id, 'reservations'))
    .limit(1)
  return (mod?.config ?? {}) as Record<string, unknown>
}

function formatPrice(grosze: number, currency: string) {
  return `${(grosze / 100).toFixed(2)} ${currency}`
}

function getResend() {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) return null
  return new Resend(apiKey)
}

function getFrom() {
  const domain = process.env['RESEND_FROM_DOMAIN'] ?? 'overcms.pl'
  return `Rezerwacje <noreply@${domain}>`
}

// ─── Confirmation email to customer ───────────────────────────────────────────

export async function sendConfirmationEmail(reservation: ReservationData) {
  const resend = getResend()
  if (!resend) return

  const html = `
<div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#333">
  <div style="background:#7B2FE0;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:1.5rem">Rezerwacja potwierdzona</h1>
  </div>
  <div style="background:#f9f9f9;padding:24px 32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
    <p style="margin:0 0 16px">Cześć <strong>${reservation.customerName}</strong>,</p>
    <p style="margin:0 0 20px">Twoja rezerwacja została potwierdzona. Oto szczegóły:</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee">Usługa</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${reservation.serviceName}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee">Data</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${reservation.date}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee">Godzina</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${reservation.startTime} — ${reservation.endTime}</td>
      </tr>
      ${reservation.guestCount > 1 ? `
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee">Liczba osób</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${reservation.guestCount}</td>
      </tr>` : ''}
      ${reservation.totalPrice > 0 ? `
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee">Kwota</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;color:#7B2FE0">${formatPrice(reservation.totalPrice, reservation.currency)}</td>
      </tr>` : ''}
      ${reservation.notes ? `
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee">Uwagi</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${reservation.notes}</td>
      </tr>` : ''}
    </table>

    <p style="margin:0;color:#888;font-size:0.875rem">ID rezerwacji: ${reservation.id.slice(0, 8).toUpperCase()}</p>
  </div>
</div>`

  await resend.emails.send({
    from: getFrom(),
    to: [reservation.customerEmail],
    subject: `Potwierdzenie rezerwacji — ${reservation.serviceName} (${reservation.date})`,
    html,
  }).catch((err: unknown) => {
    console.error('[reservations] Confirmation email failed:', err)
  })
}

// ─── Cancellation email to customer ───────────────────────────────────────────

export async function sendCancellationEmail(reservation: ReservationData) {
  const resend = getResend()
  if (!resend) return

  const html = `
<div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#333">
  <div style="background:#dc2626;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:1.5rem">Rezerwacja anulowana</h1>
  </div>
  <div style="background:#f9f9f9;padding:24px 32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
    <p style="margin:0 0 16px">Cześć <strong>${reservation.customerName}</strong>,</p>
    <p style="margin:0 0 20px">Twoja rezerwacja została anulowana:</p>
    <p style="margin:0 0 8px"><strong>${reservation.serviceName}</strong></p>
    <p style="margin:0 0 8px">${reservation.date}, ${reservation.startTime} — ${reservation.endTime}</p>
    <p style="margin:20px 0 0;color:#888;font-size:0.875rem">
      Jeśli masz pytania, skontaktuj się z nami.
    </p>
  </div>
</div>`

  await resend.emails.send({
    from: getFrom(),
    to: [reservation.customerEmail],
    subject: `Rezerwacja anulowana — ${reservation.serviceName} (${reservation.date})`,
    html,
  }).catch((err: unknown) => {
    console.error('[reservations] Cancellation email failed:', err)
  })
}

// ─── Admin notification about new reservation ─────────────────────────────────

export async function sendAdminNotification(reservation: ReservationData) {
  const resend = getResend()
  if (!resend) return

  const config = await getConfig()
  const notifications = (config.notifications ?? {}) as Record<string, unknown>
  const adminEmail = notifications.adminEmail as string | undefined
  if (!adminEmail) return

  const html = `
<div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#333">
  <h2 style="margin:0 0 16px;color:#7B2FE0">Nowa rezerwacja</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#555">Klient</td>
      <td style="padding:6px 10px">${reservation.customerName} &lt;${reservation.customerEmail}&gt;</td>
    </tr>
    ${reservation.customerPhone ? `
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#555">Telefon</td>
      <td style="padding:6px 10px">${reservation.customerPhone}</td>
    </tr>` : ''}
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#555">Usługa</td>
      <td style="padding:6px 10px">${reservation.serviceName}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#555">Termin</td>
      <td style="padding:6px 10px">${reservation.date}, ${reservation.startTime} — ${reservation.endTime}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#555">Osoby</td>
      <td style="padding:6px 10px">${reservation.guestCount}</td>
    </tr>
    ${reservation.totalPrice > 0 ? `
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#555">Kwota</td>
      <td style="padding:6px 10px;font-weight:700">${formatPrice(reservation.totalPrice, reservation.currency)}</td>
    </tr>` : ''}
    ${reservation.notes ? `
    <tr>
      <td style="padding:6px 10px;font-weight:600;color:#555">Uwagi</td>
      <td style="padding:6px 10px">${reservation.notes}</td>
    </tr>` : ''}
  </table>
</div>`

  await resend.emails.send({
    from: getFrom(),
    to: [adminEmail],
    subject: `[Rezerwacja] ${reservation.customerName} — ${reservation.serviceName} (${reservation.date})`,
    html,
  }).catch((err: unknown) => {
    console.error('[reservations] Admin notification email failed:', err)
  })
}
