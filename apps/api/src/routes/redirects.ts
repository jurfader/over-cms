import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, asc } from '@overcms/core'
import { db, redirects } from '@overcms/core'
import { requireAuth, requireRole } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

const redirectSchema = z.object({
  fromPath:   z.string().min(1).startsWith('/'),
  toPath:     z.string().min(1),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
})

// ─── GET / ────────────────────────────────────────────────────────────────────

router.get('/', requireAuth, async (c) => {
  const rows = await db.select().from(redirects).orderBy(asc(redirects.createdAt))
  return c.json({ data: rows })
})

// ─── POST / ───────────────────────────────────────────────────────────────────

router.post('/', requireAuth, requireRole('super_admin', 'admin'),
  zValidator('json', redirectSchema),
  async (c) => {
    const body = c.req.valid('json')

    const [existing] = await db
      .select({ id: redirects.id })
      .from(redirects)
      .where(eq(redirects.fromPath, body.fromPath))
      .limit(1)

    if (existing) throw ApiError.conflict(`Redirect from "${body.fromPath}" already exists`)

    const [created] = await db.insert(redirects).values(body).returning()
    return c.json({ data: created }, 201)
  },
)

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

router.put('/:id', requireAuth, requireRole('super_admin', 'admin'),
  zValidator('json', redirectSchema.partial()),
  async (c) => {
    const id   = c.req.param('id')!
    const body = c.req.valid('json')

    const [updated] = await db
      .update(redirects)
      .set(body)
      .where(eq(redirects.id, id))
      .returning()

    if (!updated) throw ApiError.notFound('Redirect not found')
    return c.json({ data: updated })
  },
)

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

router.delete('/:id', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  const id = c.req.param('id')!

  const [row] = await db.select().from(redirects).where(eq(redirects.id, id)).limit(1)
  if (!row) throw ApiError.notFound('Redirect not found')

  await db.delete(redirects).where(eq(redirects.id, id))
  return c.json({ success: true })
})

export default router
