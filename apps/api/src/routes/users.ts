import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, asc } from '@overcms/core'
import { db, user } from '@overcms/core'
import { requireAuth, requireRole } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

// ─── GET / — lista użytkowników ───────────────────────────────────────────────

router.get('/', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  const rows = await db
    .select({
      id:            user.id,
      name:          user.name,
      email:         user.email,
      role:          user.role,
      emailVerified: user.emailVerified,
      image:         user.image,
      createdAt:     user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.createdAt))

  return c.json({ data: rows })
})

// ─── PUT /:id/role — zmień rolę ───────────────────────────────────────────────

router.put(
  '/:id/role',
  requireAuth,
  requireRole('super_admin', 'admin'),
  zValidator('json', z.object({
    role: z.enum(['super_admin', 'admin', 'editor', 'viewer']),
  })),
  async (c) => {
    const id      = c.req.param('id')!
    const { role } = c.req.valid('json')
    const caller  = c.get('user')

    if (id === caller.id) throw ApiError.badRequest('Nie możesz zmienić własnej roli')

    const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1)
    if (!row) throw ApiError.notFound('Użytkownik nie istnieje')

    // Tylko super_admin może nadawać rolę super_admin lub admin
    if (role === 'super_admin' && caller.role !== 'super_admin') {
      throw ApiError.forbidden('Tylko super_admin może nadać rolę super_admin')
    }

    const [updated] = await db
      .update(user)
      .set({ role })
      .where(eq(user.id, id))
      .returning({ id: user.id, name: user.name, email: user.email, role: user.role })

    return c.json({ data: updated })
  },
)

// ─── DELETE /:id — usuń użytkownika ──────────────────────────────────────────

router.delete('/:id', requireAuth, requireRole('super_admin'), async (c) => {
  const id     = c.req.param('id')!
  const caller = c.get('user')

  if (id === caller.id) throw ApiError.badRequest('Nie możesz usunąć własnego konta')

  const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1)
  if (!row) throw ApiError.notFound('Użytkownik nie istnieje')

  await db.delete(user).where(eq(user.id, id))
  return c.json({ success: true })
})

export default router
