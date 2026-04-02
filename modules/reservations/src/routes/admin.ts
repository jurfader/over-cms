import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  db,
  eq,
  and,
  desc,
  sql,
  rsvServices,
  rsvAvailability,
  rsvBlockedDates,
  rsvReservations,
  rsvPayments,
} from '@overcms/core'
import type { ModuleMiddleware } from '@overcms/module-kit'

// ─── Validators ───────────────────────────────────────────────────────────────

const serviceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(5).max(1440).default(60),
  capacity: z.number().int().min(1).max(1000).default(1),
  price: z.number().int().min(0).default(0),
  currency: z.string().max(3).default('PLN'),
  active: z.boolean().default(true),
})

const availabilityRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().int().min(5).optional(),
  active: z.boolean().default(true),
})

const blockedDateSchema = z.object({
  serviceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(255).optional(),
})

// ─── Factory (needs middleware injected) ──────────────────────────────────────

export function adminRoutes(middleware: ModuleMiddleware) {
  const app = new Hono()

  // All admin routes require auth
  app.use('*', middleware.requireAuth)

  // ── Services CRUD ─────────────────────────────────────────────────────

  app.get('/services', async (c) => {
    const rows = await db.select().from(rsvServices).orderBy(rsvServices.name)
    return c.json({ data: rows })
  })

  app.get('/services/:id', async (c) => {
    const [row] = await db
      .select()
      .from(rsvServices)
      .where(eq(rsvServices.id, c.req.param('id')))
      .limit(1)
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: row })
  })

  app.post('/services', zValidator('json', serviceSchema), async (c) => {
    const body = c.req.valid('json')
    const [row] = await db.insert(rsvServices).values(body).returning()
    return c.json({ data: row }, 201)
  })

  app.put('/services/:id', zValidator('json', serviceSchema.partial()), async (c) => {
    const body = c.req.valid('json')
    const [row] = await db
      .update(rsvServices)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(rsvServices.id, c.req.param('id')))
      .returning()
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: row })
  })

  app.delete('/services/:id', async (c) => {
    const [row] = await db
      .delete(rsvServices)
      .where(eq(rsvServices.id, c.req.param('id')))
      .returning()
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: { deleted: true } })
  })

  // ── Availability rules ────────────────────────────────────────────────

  app.get('/availability/:serviceId', async (c) => {
    const rows = await db
      .select()
      .from(rsvAvailability)
      .where(eq(rsvAvailability.serviceId, c.req.param('serviceId')))
      .orderBy(rsvAvailability.dayOfWeek)
    return c.json({ data: rows })
  })

  app.put(
    '/availability/:serviceId',
    zValidator('json', z.array(availabilityRuleSchema)),
    async (c) => {
      const serviceId = c.req.param('serviceId')
      const rules = c.req.valid('json')

      // Replace all rules for this service
      await db.delete(rsvAvailability).where(eq(rsvAvailability.serviceId, serviceId))

      if (rules.length > 0) {
        await db.insert(rsvAvailability).values(
          rules.map((r) => ({ ...r, serviceId })),
        )
      }

      return c.json({ data: { updated: rules.length } })
    },
  )

  // ── Blocked dates ─────────────────────────────────────────────────────

  app.get('/blocked-dates', async (c) => {
    const serviceId = c.req.query('serviceId')
    const rows = await db
      .select()
      .from(rsvBlockedDates)
      .where(serviceId ? eq(rsvBlockedDates.serviceId, serviceId) : undefined)
      .orderBy(rsvBlockedDates.date)
    return c.json({ data: rows })
  })

  app.post('/blocked-dates', zValidator('json', blockedDateSchema), async (c) => {
    const body = c.req.valid('json')
    const [row] = await db.insert(rsvBlockedDates).values(body).returning()
    return c.json({ data: row }, 201)
  })

  app.delete('/blocked-dates/:id', async (c) => {
    await db.delete(rsvBlockedDates).where(eq(rsvBlockedDates.id, c.req.param('id')))
    return c.json({ data: { deleted: true } })
  })

  // ── Reservations ──────────────────────────────────────────────────────

  app.get('/reservations', async (c) => {
    const status = c.req.query('status')
    const serviceId = c.req.query('serviceId')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
    const offset = Number(c.req.query('offset') ?? 0)

    const conditions = []
    if (status) conditions.push(eq(rsvReservations.status, status as 'pending'))
    if (serviceId) conditions.push(eq(rsvReservations.serviceId, serviceId))
    if (dateFrom) conditions.push(sql`${rsvReservations.date} >= ${dateFrom}`)
    if (dateTo) conditions.push(sql`${rsvReservations.date} <= ${dateTo}`)

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: rsvReservations.id,
        date: rsvReservations.date,
        startTime: rsvReservations.startTime,
        endTime: rsvReservations.endTime,
        status: rsvReservations.status,
        customerName: rsvReservations.customerName,
        customerEmail: rsvReservations.customerEmail,
        guestCount: rsvReservations.guestCount,
        totalPrice: rsvReservations.totalPrice,
        currency: rsvReservations.currency,
        serviceName: rsvServices.name,
        createdAt: rsvReservations.createdAt,
      })
      .from(rsvReservations)
      .innerJoin(rsvServices, eq(rsvReservations.serviceId, rsvServices.id))
      .where(where)
      .orderBy(desc(rsvReservations.date), desc(rsvReservations.startTime))
      .limit(limit)
      .offset(offset)

    return c.json({ data: rows })
  })

  app.get('/reservations/today', async (c) => {
    const today = new Date().toISOString().split('T')[0]!
    const rows = await db
      .select({
        id: rsvReservations.id,
        date: rsvReservations.date,
        startTime: rsvReservations.startTime,
        endTime: rsvReservations.endTime,
        status: rsvReservations.status,
        customerName: rsvReservations.customerName,
        guestCount: rsvReservations.guestCount,
        serviceName: rsvServices.name,
      })
      .from(rsvReservations)
      .innerJoin(rsvServices, eq(rsvReservations.serviceId, rsvServices.id))
      .where(eq(rsvReservations.date, today))
      .orderBy(rsvReservations.startTime)
    return c.json({ data: rows })
  })

  app.get('/reservations/stats', async (c) => {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${rsvReservations.status} = 'pending')::int`,
        confirmed: sql<number>`count(*) filter (where ${rsvReservations.status} = 'confirmed')::int`,
        completed: sql<number>`count(*) filter (where ${rsvReservations.status} = 'completed')::int`,
        cancelled: sql<number>`count(*) filter (where ${rsvReservations.status} = 'cancelled')::int`,
        revenue: sql<number>`coalesce(sum(${rsvReservations.totalPrice}) filter (where ${rsvReservations.status} in ('confirmed', 'completed')), 0)::int`,
      })
      .from(rsvReservations)

    return c.json({ data: stats })
  })

  app.get('/reservations/:id', async (c) => {
    const [row] = await db
      .select()
      .from(rsvReservations)
      .where(eq(rsvReservations.id, c.req.param('id')))
      .limit(1)
    if (!row) return c.json({ error: 'Not found' }, 404)

    // Get payment info
    const [payment] = await db
      .select()
      .from(rsvPayments)
      .where(eq(rsvPayments.reservationId, row.id))
      .limit(1)

    return c.json({ data: { ...row, payment: payment ?? null } })
  })

  app.put(
    '/reservations/:id/status',
    zValidator('json', z.object({ status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']) })),
    async (c) => {
      const { status } = c.req.valid('json')
      const [row] = await db
        .update(rsvReservations)
        .set({ status, updatedAt: new Date() })
        .where(eq(rsvReservations.id, c.req.param('id')))
        .returning()
      if (!row) return c.json({ error: 'Not found' }, 404)
      return c.json({ data: row })
    },
  )

  app.delete('/reservations/:id', async (c) => {
    await db.delete(rsvReservations).where(eq(rsvReservations.id, c.req.param('id')))
    return c.json({ data: { deleted: true } })
  })

  // ── Calendar data ─────────────────────────────────────────────────────

  app.get('/calendar', async (c) => {
    const month = c.req.query('month') // YYYY-MM
    if (!month) return c.json({ error: 'month required (YYYY-MM)' }, 400)

    const startDate = `${month}-01`
    const endDate = `${month}-31`

    const rows = await db
      .select({
        id: rsvReservations.id,
        date: rsvReservations.date,
        startTime: rsvReservations.startTime,
        endTime: rsvReservations.endTime,
        status: rsvReservations.status,
        customerName: rsvReservations.customerName,
        serviceName: rsvServices.name,
      })
      .from(rsvReservations)
      .innerJoin(rsvServices, eq(rsvReservations.serviceId, rsvServices.id))
      .where(
        and(
          sql`${rsvReservations.date} >= ${startDate}`,
          sql`${rsvReservations.date} <= ${endDate}`,
        ),
      )
      .orderBy(rsvReservations.date, rsvReservations.startTime)

    return c.json({ data: rows })
  })

  return app
}
