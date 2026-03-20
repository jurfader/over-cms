import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, asc, count, desc, eq, or, sql } from '@overcms/core'
import { db, contentTypes, contentItems, contentVersions, user } from '@overcms/core'
import { requireAuth } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterCard: z.enum(['summary', 'summary_large_image']).optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
}).optional().nullable()

const createSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9_-]+$/, 'Slug może zawierać tylko małe litery, cyfry, _ i -'),
  title: z.string().min(1).max(500),
  data: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  scheduledAt: z.string().datetime().optional().nullable(),
  seo: seoSchema,
})

const updateSchema = createSchema.partial()

// ─── Helper: znajdź content type po slugu ─────────────────────────────────────

async function findContentType(typeSlug: string) {
  const [type] = await db
    .select()
    .from(contentTypes)
    .where(eq(contentTypes.slug, typeSlug))
    .limit(1)

  if (!type) throw ApiError.notFound(`Content type "${typeSlug}" not found`)
  return type
}

// ─── Helper: utwórz snapshot wersji ──────────────────────────────────────────

type ItemRow = typeof contentItems.$inferSelect

async function createVersionSnapshot(item: ItemRow) {
  const [maxRes] = await db
    .select({ v: sql<number>`COALESCE(MAX(${contentVersions.version}), 0)` })
    .from(contentVersions)
    .where(eq(contentVersions.itemId, item.id))

  const nextVersion = (maxRes?.v ?? 0) + 1

  await db.insert(contentVersions).values({
    itemId:   item.id,
    version:  nextVersion,
    title:    item.title,
    data:     item.data as Record<string, unknown>,
    status:   item.status,
    seo:      item.seo ?? undefined,
    authorId: item.authorId,
  })
}

// ─── GET /:typeSlug — lista elementów ─────────────────────────────────────────

router.get('/:typeSlug', async (c) => {
  const typeSlug = c.req.param('typeSlug')!
  const { page = '1', limit = '20', status, sort = 'createdAt', order = 'desc' } = c.req.query()

  const type = await findContentType(typeSlug)

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const offset = (pageNum - 1) * limitNum

  // Buduj warunki filtrowania
  const conditions = [eq(contentItems.typeId, type.id)]
  if (status) {
    conditions.push(eq(contentItems.status, status as 'draft' | 'published' | 'scheduled' | 'archived'))
  }

  const orderFn = order === 'asc' ? asc : desc
  const sortColumn = sort === 'title' ? contentItems.title
    : sort === 'publishedAt' ? contentItems.publishedAt
    : sort === 'updatedAt' ? contentItems.updatedAt
    : contentItems.createdAt

  const [items, totalResult] = await Promise.all([
    db
      .select({
        item: contentItems,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(contentItems)
      .leftJoin(user, eq(contentItems.authorId, user.id))
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ total: count() })
      .from(contentItems)
      .where(and(...conditions)),
  ])

  const total = totalResult[0]?.total ?? 0

  return c.json({
    data: items,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  })
})

// ─── GET /:typeSlug/:slug — pojedynczy element ────────────────────────────────

router.get('/:typeSlug/:idOrSlug', async (c) => {
  const typeSlug = c.req.param('typeSlug')!
  const idOrSlug = c.req.param('idOrSlug')!

  const type = await findContentType(typeSlug)

  const [row] = await db
    .select({
      item: contentItems,
      author: { id: user.id, name: user.name, email: user.email },
    })
    .from(contentItems)
    .leftJoin(user, eq(contentItems.authorId, user.id))
    .where(and(
      eq(contentItems.typeId, type.id),
      or(eq(contentItems.id, idOrSlug), eq(contentItems.slug, idOrSlug)),
    ))
    .limit(1)

  if (!row) throw ApiError.notFound(`Item "${idOrSlug}" not found in "${typeSlug}"`)
  return c.json({ data: row })
})

// ─── POST /:typeSlug — utwórz element ────────────────────────────────────────

router.post('/:typeSlug', requireAuth,
  zValidator('json', createSchema),
  async (c) => {
    const typeSlug = c.req.param('typeSlug')!
    const body = c.req.valid('json')
    const author = c.get('user')

    const type = await findContentType(typeSlug)

    // Sprawdź unikalność sluga w obrębie tego typu
    const [existing] = await db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(and(eq(contentItems.typeId, type.id), eq(contentItems.slug, body.slug)))
      .limit(1)

    if (existing) throw ApiError.conflict(`Item with slug "${body.slug}" already exists in "${typeSlug}"`)

    const [created] = await db
      .insert(contentItems)
      .values({
        ...body,
        typeId: type.id,
        authorId: author.id,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        publishedAt: body.status === 'published' ? new Date() : null,
      })
      .returning()

    return c.json({ data: created }, 201)
  }
)

// ─── PUT /:typeSlug/:id — aktualizuj element ──────────────────────────────────

router.put('/:typeSlug/:id', requireAuth,
  zValidator('json', updateSchema),
  async (c) => {
    const typeSlug = c.req.param('typeSlug')!
    const id = c.req.param('id')!
    const body = c.req.valid('json')

    const type = await findContentType(typeSlug)

    const [existing] = await db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.typeId, type.id), eq(contentItems.id, id)))
      .limit(1)

    if (!existing) throw ApiError.notFound('Item not found')

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() }
    if (body.scheduledAt !== undefined) {
      updateData['scheduledAt'] = body.scheduledAt ? new Date(body.scheduledAt) : null
    }
    if (body.status === 'published' && existing.status !== 'published') {
      updateData['publishedAt'] = new Date()
    }

    const [updated] = await db
      .update(contentItems)
      .set(updateData)
      .where(eq(contentItems.id, id))
      .returning()

    if (!updated) throw ApiError.notFound('Item not found after update')

    // Auto-snapshot po każdym zapisie
    await createVersionSnapshot(updated)

    return c.json({ data: updated })
  }
)

// ─── POST /:typeSlug/:id/publish — publikuj / cofnij do draftu ────────────────

router.post('/:typeSlug/:id/publish', requireAuth, async (c) => {
  const typeSlug = c.req.param('typeSlug')!
  const id = c.req.param('id')!

  const type = await findContentType(typeSlug)

  const [existing] = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.typeId, type.id), eq(contentItems.id, id)))
    .limit(1)

  if (!existing) throw ApiError.notFound('Item not found')

  const isPublished = existing.status === 'published'
  const newStatus = isPublished ? 'draft' : 'published'

  const [updated] = await db
    .update(contentItems)
    .set({
      status: newStatus,
      publishedAt: isPublished ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, id))
    .returning()

  return c.json({ data: updated })
})

// ─── GET /:typeSlug/:id/versions — lista wersji ──────────────────────────────

router.get('/:typeSlug/:id/versions', requireAuth, async (c) => {
  const typeSlug = c.req.param('typeSlug')!
  const id       = c.req.param('id')!

  const type = await findContentType(typeSlug)

  const [existing] = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(and(eq(contentItems.typeId, type.id), eq(contentItems.id, id)))
    .limit(1)

  if (!existing) throw ApiError.notFound('Item not found')

  const versions = await db
    .select({
      version:   contentVersions,
      author:    { id: user.id, name: user.name, email: user.email },
    })
    .from(contentVersions)
    .leftJoin(user, eq(contentVersions.authorId, user.id))
    .where(eq(contentVersions.itemId, id))
    .orderBy(desc(contentVersions.version))
    .limit(50)

  return c.json({ data: versions })
})

// ─── POST /:typeSlug/:id/versions/:versionId/restore — przywróć wersję ────────

router.post('/:typeSlug/:id/versions/:versionId/restore', requireAuth, async (c) => {
  const typeSlug  = c.req.param('typeSlug')!
  const id        = c.req.param('id')!
  const versionId = c.req.param('versionId')!

  const type = await findContentType(typeSlug)

  const [existing] = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.typeId, type.id), eq(contentItems.id, id)))
    .limit(1)

  if (!existing) throw ApiError.notFound('Item not found')

  const [ver] = await db
    .select()
    .from(contentVersions)
    .where(and(eq(contentVersions.id, versionId), eq(contentVersions.itemId, id)))
    .limit(1)

  if (!ver) throw ApiError.notFound('Version not found')

  const [restored] = await db
    .update(contentItems)
    .set({
      title:     ver.title,
      data:      ver.data,
      seo:       ver.seo,
      status:    ver.status,
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, id))
    .returning()

  if (!restored) throw ApiError.notFound('Item not found after restore')

  // Snapshot przywróconego stanu
  await createVersionSnapshot(restored)

  return c.json({ data: restored })
})

// ─── DELETE /:typeSlug/:id ────────────────────────────────────────────────────

router.delete('/:typeSlug/:id', requireAuth, async (c) => {
  const typeSlug = c.req.param('typeSlug')!
  const id = c.req.param('id')!

  const type = await findContentType(typeSlug)

  const [existing] = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(and(eq(contentItems.typeId, type.id), eq(contentItems.id, id)))
    .limit(1)

  if (!existing) throw ApiError.notFound('Item not found')

  await db.delete(contentItems).where(eq(contentItems.id, existing.id))

  return c.json({ success: true })
})

export default router
