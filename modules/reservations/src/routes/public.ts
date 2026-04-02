import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  db,
  eq,
  and,
  rsvServices,
  rsvReservations,
  rsvPayments,
  modules,
} from '@overcms/core'
import { getAvailableSlots } from '../services/availability'
import { createBooking } from '../services/booking'
import { buildPaymentUrl } from '../services/payment'
import { sendConfirmationEmail, sendAdminNotification } from '../services/email'

export const publicRoutes = new Hono()

// ─── GET /services — list active services ─────────────────────────────────────

publicRoutes.get('/services', async (c) => {
  const rows = await db
    .select({
      slug: rsvServices.slug,
      name: rsvServices.name,
      description: rsvServices.description,
      durationMinutes: rsvServices.durationMinutes,
      price: rsvServices.price,
      currency: rsvServices.currency,
    })
    .from(rsvServices)
    .where(eq(rsvServices.active, true))
    .orderBy(rsvServices.name)

  return c.json({ data: rows })
})

// ─── GET /services/:slug/slots?date=YYYY-MM-DD ───────────────────────────────

publicRoutes.get('/services/:slug/slots', async (c) => {
  const slug = c.req.param('slug')
  const dateStr = c.req.query('date')

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return c.json({ error: 'Query param "date" required (YYYY-MM-DD)' }, 400)
  }

  const [service] = await db
    .select()
    .from(rsvServices)
    .where(and(eq(rsvServices.slug, slug), eq(rsvServices.active, true)))
    .limit(1)

  if (!service) return c.json({ error: 'Service not found' }, 404)

  const slots = await getAvailableSlots(service, dateStr)
  return c.json({ data: slots })
})

// ─── POST /book — create reservation + initiate payment ──────────────────────

const bookSchema = z.object({
  serviceSlug: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().max(50).optional(),
  guestCount: z.number().int().min(1).max(100).default(1),
  notes: z.string().max(2000).optional(),
})

publicRoutes.post('/book', zValidator('json', bookSchema), async (c) => {
  const body = c.req.valid('json')
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? ''

  // Find service
  const [service] = await db
    .select()
    .from(rsvServices)
    .where(and(eq(rsvServices.slug, body.serviceSlug), eq(rsvServices.active, true)))
    .limit(1)

  if (!service) return c.json({ error: 'Service not found' }, 404)

  // Create reservation
  const reservation = await createBooking(service, body, ip)
  if ('error' in reservation) {
    return c.json({ error: reservation.error }, 409)
  }

  // If free service, confirm immediately and send emails
  if (service.price === 0) {
    const emailData = {
      id: reservation.id,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerPhone: reservation.customerPhone,
      guestCount: reservation.guestCount,
      totalPrice: reservation.totalPrice,
      currency: reservation.currency,
      notes: reservation.notes,
      serviceName: service.name,
    }
    sendConfirmationEmail(emailData).catch(() => {})
    sendAdminNotification(emailData).catch(() => {})

    return c.json({
      data: {
        reservationId: reservation.id,
        status: 'confirmed',
        redirectUrl: null,
      },
    })
  }

  // Build Autopay payment URL
  const paymentResult = await buildPaymentUrl(reservation, service)
  if ('error' in paymentResult) {
    return c.json({ error: paymentResult.error }, 500)
  }

  return c.json({
    data: {
      reservationId: reservation.id,
      status: 'pending',
      redirectUrl: paymentResult.redirectUrl,
    },
  })
})

// ─── GET /reservation/:id/status ──────────────────────────────────────────────

publicRoutes.get('/reservation/:id/status', async (c) => {
  const id = c.req.param('id')

  const [reservation] = await db
    .select({
      id: rsvReservations.id,
      status: rsvReservations.status,
      date: rsvReservations.date,
      startTime: rsvReservations.startTime,
      endTime: rsvReservations.endTime,
      serviceName: rsvServices.name,
    })
    .from(rsvReservations)
    .innerJoin(rsvServices, eq(rsvReservations.serviceId, rsvServices.id))
    .where(eq(rsvReservations.id, id))
    .limit(1)

  if (!reservation) return c.json({ error: 'Not found' }, 404)

  // Check payment status
  const [payment] = await db
    .select({ status: rsvPayments.status })
    .from(rsvPayments)
    .where(eq(rsvPayments.reservationId, id))
    .limit(1)

  return c.json({
    data: {
      ...reservation,
      paymentStatus: payment?.status ?? null,
    },
  })
})

// ─── GET /widget-css — custom CSS for reservation widget ──────────────────────

publicRoutes.get('/widget-css', async (c) => {
  const [mod] = await db
    .select({ config: modules.config })
    .from(modules)
    .where(eq(modules.id, 'reservations'))
    .limit(1)

  const config = (mod?.config ?? {}) as Record<string, unknown>
  const customCss = (config.customCss as string) ?? ''
  const preset = (config.cssPreset as string) ?? 'inherit'

  // Base CSS variables
  let css = `
.rsv-widget {
  --rsv-primary: var(--color-primary, #E040FB);
  --rsv-bg: var(--color-bg, #0a0a0a);
  --rsv-text: var(--color-fg, #ffffff);
  --rsv-muted: var(--color-muted, rgba(255,255,255,0.55));
  --rsv-border: var(--color-border, rgba(255,255,255,0.08));
  --rsv-radius: 0.875rem;
  --rsv-font: var(--font-sans, 'Open Sans', system-ui, sans-serif);
  font-family: var(--rsv-font);
}
`

  if (preset === 'light') {
    css += `
.rsv-widget {
  --rsv-bg: #ffffff;
  --rsv-text: #1a1a1a;
  --rsv-muted: rgba(0,0,0,0.55);
  --rsv-border: rgba(0,0,0,0.1);
}
`
  }

  if (customCss) {
    css += '\n' + customCss
  }

  c.header('Content-Type', 'text/css; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=60')
  return c.body(css)
})
