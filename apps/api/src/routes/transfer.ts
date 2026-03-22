import { Hono } from 'hono'
import { eq } from '@overcms/core'
import { db, contentTypes, contentItems, settings, media } from '@overcms/core'
import type { FieldDefinition } from '@overcms/core'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'
import fs from 'node:fs/promises'
import path from 'node:path'

const router = new Hono<AppEnv>()

const UPLOAD_DIR = path.resolve('public/uploads')
const BASE_URL   = (process.env['API_BASE_URL'] ?? 'http://localhost:3001').replace(/\/$/, '')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively replace every string value in a JSON tree */
function replaceUrls(val: unknown, from: string, to: string): unknown {
  if (typeof val === 'string') return val.replaceAll(from, to)
  if (Array.isArray(val))      return val.map((v) => replaceUrls(v, from, to))
  if (val && typeof val === 'object')
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).map(([k, v]) => [k, replaceUrls(v, from, to)])
    )
  return val
}

/** Remap relation field values using itemIdMap — handles nested repeaters */
function remapRelations(
  data:      Record<string, unknown>,
  schema:    FieldDefinition[],
  itemIdMap: Record<string, string>,
): Record<string, unknown> {
  const out = { ...data }
  for (const field of schema) {
    const v = out[field.name]
    if (field.type === 'relation' && typeof v === 'string') {
      out[field.name] = itemIdMap[v] ?? v
    } else if (field.type === 'repeater' && Array.isArray(v) && field.fields?.length) {
      out[field.name] = v.map((entry) =>
        remapRelations(entry as Record<string, unknown>, field.fields!, itemIdMap)
      )
    }
  }
  return out
}

// ─── GET /api/transfer/export ─────────────────────────────────────────────────

router.get('/export', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  const [types, items, settingsRows, mediaRows] = await Promise.all([
    db.select().from(contentTypes).orderBy(contentTypes.name),
    db.select().from(contentItems).orderBy(contentItems.createdAt),
    db.select().from(settings),
    db.select().from(media).orderBy(media.createdAt),
  ])

  // Read actual files from disk → base64
  const files: Record<string, string> = {}
  let filesSkipped = 0

  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  for (const m of mediaRows) {
    const filePath = path.join(UPLOAD_DIR, path.basename(m.filename))
    try {
      const buf = await fs.readFile(filePath)
      files[m.filename] = buf.toString('base64')
    } catch {
      filesSkipped++
    }
  }

  const payload = {
    version:      '2.0',
    exportedAt:   new Date().toISOString(),
    sourceUrl:    BASE_URL,
    contentTypes: types,
    contentItems: items,
    settings:     Object.fromEntries(settingsRows.map((r) => [r.key, r.value])),
    media:        mediaRows,
    files,
    meta: { totalFiles: mediaRows.length, filesSkipped },
  }

  const filename = `overcms-export-${new Date().toISOString().slice(0, 10)}.json`
  c.header('Content-Type', 'application/json')
  c.header('Content-Disposition', `attachment; filename="${filename}"`)
  return c.body(JSON.stringify(payload, null, 2))
})

// ─── POST /api/transfer/import ────────────────────────────────────────────────

router.post('/import', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  type ExportPayload = {
    version?:      string
    sourceUrl?:    string
    contentTypes?: RawType[]
    contentItems?: RawItem[]
    settings?:     Record<string, unknown>
    media?:        RawMedia[]
    files?:        Record<string, string>
  }
  type RawType = {
    id: string; slug: string; name: string; description?: string | null
    icon?: string | null; fieldsSchema: FieldDefinition[]; isSingleton: boolean
    createdAt: unknown; updatedAt: unknown
  }
  type RawItem = {
    id: string; typeId: string; slug: string; title: string
    data: Record<string, unknown>
    status: 'draft' | 'published' | 'scheduled' | 'archived'
    publishedAt?: string | null; scheduledAt?: string | null
    seo?: unknown; authorId?: string | null
    createdAt: unknown; updatedAt: unknown
  }
  type RawMedia = {
    id: string; filename: string; originalName: string; url: string
    size: number; mimeType: string; width?: number | null; height?: number | null
    alt?: string | null; caption?: string | null; folder?: string | null
    tags?: string[]; uploadedBy: unknown; createdAt: unknown
  }

  const body = await c.req.json() as ExportPayload

  const importedTypes    = body.contentTypes ?? []
  const importedItems    = body.contentItems ?? []
  const importedSettings = body.settings     ?? {}
  const importedMedia    = body.media        ?? []
  const importedFiles    = body.files        ?? {}
  const sourceUrl        = body.sourceUrl?.replace(/\/$/, '') ?? ''
  const urlsChanged      = sourceUrl !== '' && sourceUrl !== BASE_URL

  const stats = { types: 0, items: 0, settings: 0, media: 0, files: 0 }

  // ── 1. Save media files to disk ────────────────────────────────────────────
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  for (const [filename, base64] of Object.entries(importedFiles)) {
    const safe = path.basename(filename) // prevent path traversal
    await fs.writeFile(path.join(UPLOAD_DIR, safe), Buffer.from(base64, 'base64'))
    stats.files++
  }

  await db.transaction(async (tx) => {
    // ── 2. Media records — build oldUrl → newUrl map ───────────────────────
    const mediaUrlMap: Record<string, string> = {}

    for (const m of importedMedia) {
      const { id: _id, uploadedBy: _ub, createdAt: _ca, url: oldUrl, ...rest } = m
      const newUrl = urlsChanged ? (oldUrl ?? '').replace(sourceUrl, BASE_URL) : oldUrl

      // Check if record with this filename already exists
      const [existing] = await tx
        .select({ id: media.id, url: media.url })
        .from(media)
        .where(eq(media.filename, rest.filename))
        .limit(1)

      if (existing) {
        await tx
          .update(media)
          .set({ url: newUrl, alt: rest.alt ?? null, caption: rest.caption ?? null })
          .where(eq(media.id, existing.id))
        mediaUrlMap[oldUrl] = newUrl
      } else {
        const [inserted] = await tx
          .insert(media)
          .values({ ...rest, url: newUrl, uploadedBy: null })
          .returning({ id: media.id, url: media.url })
        if (inserted) mediaUrlMap[oldUrl] = inserted.url
      }
      stats.media++
    }

    // ── 3. Content types (upsert by slug) → typeId map ────────────────────
    const typeIdMap: Record<string, string> = {}

    for (const t of importedTypes) {
      const { id: oldId, createdAt: _ca, updatedAt: _ua, ...rest } = t

      const [upserted] = await tx
        .insert(contentTypes)
        .values({
          slug: rest.slug, name: rest.name,
          description: rest.description ?? null, icon: rest.icon ?? null,
          fieldsSchema: rest.fieldsSchema as never, isSingleton: rest.isSingleton,
        })
        .onConflictDoUpdate({
          target: contentTypes.slug,
          set: {
            name: rest.name, description: rest.description ?? null,
            icon: rest.icon ?? null, fieldsSchema: rest.fieldsSchema as never,
            isSingleton: rest.isSingleton, updatedAt: new Date(),
          },
        })
        .returning({ id: contentTypes.id })

      if (upserted) { typeIdMap[oldId] = upserted.id; stats.types++ }
    }

    // ── 4. Content items (upsert by typeId+slug) → itemId map ─────────────
    const itemIdMap: Record<string, string> = {}

    for (const item of importedItems) {
      const { id: oldId, typeId: oldTypeId, createdAt: _ca, updatedAt: _ua, ...rest } = item
      const newTypeId = typeIdMap[oldTypeId]
      if (!newTypeId) continue

      // Remap media URLs inside data
      const data = urlsChanged
        ? replaceUrls(rest.data, sourceUrl, BASE_URL) as Record<string, unknown>
        : rest.data

      const [upserted] = await tx
        .insert(contentItems)
        .values({
          typeId: newTypeId, slug: rest.slug, title: rest.title,
          data: data as never, status: rest.status,
          seo: (rest.seo ?? null) as never,
          publishedAt: rest.publishedAt ? new Date(rest.publishedAt) : null,
          scheduledAt: rest.scheduledAt ? new Date(rest.scheduledAt) : null,
          authorId: null,
        })
        .onConflictDoUpdate({
          target: [contentItems.typeId, contentItems.slug],
          set: {
            title: rest.title, data: data as never, status: rest.status,
            seo: (rest.seo ?? null) as never,
            publishedAt: rest.publishedAt ? new Date(rest.publishedAt) : null,
            updatedAt: new Date(),
          },
        })
        .returning({ id: contentItems.id })

      if (upserted) { itemIdMap[oldId] = upserted.id; stats.items++ }
    }

    // ── 5. Remap relation IDs inside content data ──────────────────────────
    // Only needed if any type has relation/repeater fields
    const typeSchemaMap: Record<string, FieldDefinition[]> = {}
    for (const t of importedTypes) {
      const newId = typeIdMap[t.id]
      if (newId && t.fieldsSchema.some((f) => f.type === 'relation' || f.type === 'repeater'))
        typeSchemaMap[newId] = t.fieldsSchema
    }

    for (const item of importedItems) {
      const newTypeId = typeIdMap[item.typeId]
      const newItemId = itemIdMap[item.id]
      if (!newTypeId || !newItemId) continue

      const schema = typeSchemaMap[newTypeId]
      if (!schema) continue

      const [current] = await tx
        .select({ data: contentItems.data })
        .from(contentItems)
        .where(eq(contentItems.id, newItemId))
        .limit(1)

      if (!current) continue
      const remapped = remapRelations(current.data as Record<string, unknown>, schema, itemIdMap)
      await tx.update(contentItems).set({ data: remapped as never }).where(eq(contentItems.id, newItemId))
    }

    // ── 6. Settings (upsert by key) — remap URLs in string values ─────────
    for (const [key, value] of Object.entries(importedSettings)) {
      const finalValue = urlsChanged && typeof value === 'string'
        ? value.replace(sourceUrl, BASE_URL)
        : value
      await tx
        .insert(settings)
        .values({ key, value: finalValue })
        .onConflictDoUpdate({ target: settings.key, set: { value: finalValue, updatedAt: new Date() } })
      stats.settings++
    }
  })

  return c.json({ success: true, imported: stats })
})

export default router
