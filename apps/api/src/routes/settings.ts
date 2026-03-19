import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, inArray } from '@overcms/core'
import { db, settings } from '@overcms/core'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

// ─── GET / — wszystkie ustawienia ────────────────────────────────────────────

router.get('/', async (c) => {
  const rows = await db.select().from(settings)

  // Konwertuj array key-value na obiekt
  const result = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return c.json({ data: result })
})

// ─── PUT / — aktualizuj ustawienia (partial update) ──────────────────────────

router.put('/', requireAuth, requireRole('super_admin', 'admin'),
  zValidator('json', z.record(z.string(), z.unknown())),
  async (c) => {
    const body = c.req.valid('json')

    // Upsert każdego klucza
    const entries = Object.entries(body).map(([key, value]) => ({
      key,
      value: value ?? '',
      updatedAt: new Date(),
    }))

    if (entries.length === 0) return c.json({ data: {} })

    // Upsert jeden po drugim (bezpieczny sposób)
    for (const entry of entries) {
      await db
        .insert(settings)
        .values(entry)
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: entry.value, updatedAt: entry.updatedAt },
        })
    }

    // Pobierz zaktualizowane wartości
    const keys = entries.map((e) => e.key)
    const updated = await db.select().from(settings).where(inArray(settings.key, keys))
    const result = Object.fromEntries(updated.map((r) => [r.key, r.value]))

    return c.json({ data: result })
  }
)

// ─── GET /navigation/:name — pobierz menu ────────────────────────────────────

router.get('/navigation/:name', async (c) => {
  const name = c.req.param('name')!
  const key = `nav.${name}`

  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
  return c.json({ data: row?.value ?? [] })
})

// ─── PUT /navigation/:name — zapisz menu ─────────────────────────────────────

router.put('/navigation/:name', requireAuth, requireRole('super_admin', 'admin'),
  zValidator('json', z.array(z.any())),
  async (c) => {
    const name = c.req.param('name')!
    const key = `nav.${name}`
    const items = c.req.valid('json')

    await db
      .insert(settings)
      .values({ key, value: items, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: items, updatedAt: new Date() },
      })

    return c.json({ data: items })
  }
)

export default router
