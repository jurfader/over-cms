import { Hono } from 'hono'
import { db, contentTypes, contentItems, settings } from '@overcms/core'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

// ─── GET /api/transfer/export ─────────────────────────────────────────────────

router.get('/export', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  const [types, items, settingsRows] = await Promise.all([
    db.select().from(contentTypes).orderBy(contentTypes.name),
    db.select().from(contentItems).orderBy(contentItems.createdAt),
    db.select().from(settings),
  ])

  const payload = {
    version:      '1.0',
    exportedAt:   new Date().toISOString(),
    contentTypes: types,
    contentItems: items,
    settings:     Object.fromEntries(settingsRows.map((r) => [r.key, r.value])),
  }

  const filename = `overcms-export-${new Date().toISOString().slice(0, 10)}.json`
  c.header('Content-Type', 'application/json')
  c.header('Content-Disposition', `attachment; filename="${filename}"`)
  return c.body(JSON.stringify(payload, null, 2))
})

// ─── POST /api/transfer/import ────────────────────────────────────────────────

router.post('/import', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  const body = await c.req.json() as {
    contentTypes?: Record<string, unknown>[]
    contentItems?: Record<string, unknown>[]
    settings?:     Record<string, unknown>
  }

  const importedTypes    = body.contentTypes ?? []
  const importedItems    = body.contentItems ?? []
  const importedSettings = body.settings     ?? {}

  const stats = { types: 0, items: 0, settings: 0 }

  await db.transaction(async (tx) => {
    // ── 1. Content types (upsert by slug) — build oldId → newId map ──────────
    const typeIdMap: Record<string, string> = {}

    for (const type of importedTypes) {
      const { id: oldId, createdAt: _ca, updatedAt: _ua, ...rest } = type as {
        id: string; createdAt: unknown; updatedAt: unknown;
        slug: string; name: string; description?: string | null;
        icon?: string | null; fieldsSchema: unknown; isSingleton: boolean
      }

      const [upserted] = await tx
        .insert(contentTypes)
        .values({
          slug:         rest.slug,
          name:         rest.name,
          description:  rest.description ?? null,
          icon:         rest.icon ?? null,
          fieldsSchema: rest.fieldsSchema as never,
          isSingleton:  rest.isSingleton,
        })
        .onConflictDoUpdate({
          target: contentTypes.slug,
          set: {
            name:         rest.name,
            description:  rest.description ?? null,
            icon:         rest.icon ?? null,
            fieldsSchema: rest.fieldsSchema as never,
            isSingleton:  rest.isSingleton,
            updatedAt:    new Date(),
          },
        })
        .returning({ id: contentTypes.id })

      if (upserted) {
        typeIdMap[oldId] = upserted.id
        stats.types++
      }
    }

    // ── 2. Content items (upsert by typeId+slug) ──────────────────────────────
    for (const item of importedItems) {
      const {
        id: _id, typeId: oldTypeId,
        createdAt: _ca, updatedAt: _ua,
        ...rest
      } = item as {
        id: string; typeId: string; createdAt: unknown; updatedAt: unknown;
        slug: string; title: string; data: unknown;
        status: 'draft' | 'published' | 'scheduled' | 'archived';
        publishedAt?: string | null; scheduledAt?: string | null;
        seo?: unknown; authorId?: string | null
      }

      const newTypeId = typeIdMap[oldTypeId]
      if (!newTypeId) continue

      await tx
        .insert(contentItems)
        .values({
          typeId:      newTypeId,
          slug:        rest.slug,
          title:       rest.title,
          data:        rest.data as never,
          status:      rest.status,
          seo:         (rest.seo ?? null) as never,
          publishedAt: rest.publishedAt ? new Date(rest.publishedAt) : null,
          scheduledAt: rest.scheduledAt ? new Date(rest.scheduledAt) : null,
          authorId:    null,
        })
        .onConflictDoUpdate({
          target: [contentItems.typeId, contentItems.slug],
          set: {
            title:       rest.title,
            data:        rest.data as never,
            status:      rest.status,
            seo:         (rest.seo ?? null) as never,
            publishedAt: rest.publishedAt ? new Date(rest.publishedAt) : null,
            updatedAt:   new Date(),
          },
        })

      stats.items++
    }

    // ── 3. Settings (upsert by key) ───────────────────────────────────────────
    for (const [key, value] of Object.entries(importedSettings)) {
      await tx
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target:    settings.key,
          set:       { value, updatedAt: new Date() },
        })
      stats.settings++
    }
  })

  return c.json({ success: true, imported: stats })
})

export default router
