import { Hono }            from 'hono'
import { db, modules, eq } from '@overcms/core'
import { getRegistry }     from '../modules/registry'
import { requireAuth, requireRole } from '../middleware/auth'
import { ApiError }        from '../middleware/error'
import type { AppEnv }     from '../types'

const router = new Hono<AppEnv>()

// ─── GET / — lista wszystkich zarejestrowanych modułów ────────────────────────

router.get('/', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  const registry = getRegistry()

  const dbRows = await db.select().from(modules)
  const dbMap  = new Map(dbRows.map((r) => [r.id, r]))

  const list = Array.from(registry.values()).map((mod) => {
    const row = dbMap.get(mod.id)
    return {
      id:          mod.id,
      name:        mod.name,
      version:     mod.version,
      description: mod.description ?? null,
      icon:        mod.icon ?? null,
      adminNav:    mod.adminNav ?? null,
      active:      row?.active ?? false,
      installedAt: row?.installedAt ?? null,
      config:      row?.config ?? {},
    }
  })

  return c.json({ data: list })
})

// ─── PUT /:id/toggle — włącz / wyłącz moduł ──────────────────────────────────

router.put('/:id/toggle', requireAuth, requireRole('super_admin'), async (c) => {
  const id = c.req.param('id')!

  const [row] = await db.select().from(modules).where(eq(modules.id, id)).limit(1)
  if (!row) throw ApiError.notFound('Moduł nie istnieje')

  const [updated] = await db
    .update(modules)
    .set({ active: !row.active, updatedAt: new Date() })
    .where(eq(modules.id, id))
    .returning()

  return c.json({ data: updated })
})

// ─── PUT /:id/config — zapisz konfigurację modułu ────────────────────────────

router.put('/:id/config', requireAuth, requireRole('super_admin'), async (c) => {
  const id     = c.req.param('id')!
  const config = await c.req.json<Record<string, unknown>>()

  const [row] = await db.select().from(modules).where(eq(modules.id, id)).limit(1)
  if (!row) throw ApiError.notFound('Moduł nie istnieje')

  const [updated] = await db
    .update(modules)
    .set({ config, updatedAt: new Date() })
    .where(eq(modules.id, id))
    .returning()

  return c.json({ data: updated })
})

export default router
