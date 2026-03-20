import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from '@overcms/core'
import { db, contentTypes } from '@overcms/core'
import { requireAuth, requireRole } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const fieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  type: z.enum([
    'text', 'textarea', 'richtext', 'blocks', 'number', 'boolean',
    'date', 'image', 'file', 'relation', 'repeater',
    'select', 'slug', 'color', 'json',
  ]),
  required: z.boolean(),
  unique: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  options: z.array(z.string()).optional(),
  relationTo: z.string().optional(),
  fields: z.array(z.any()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
})

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/, 'Slug może zawierać tylko małe litery, cyfry, _ i -'),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  icon: z.string().max(100).optional(),
  isSingleton: z.boolean().default(false),
  fieldsSchema: z.array(fieldSchema).default([]),
})

const updateSchema = createSchema.partial()

// ─── GET / — lista typów treści ───────────────────────────────────────────────

router.get('/', async (c) => {
  const types = await db.select().from(contentTypes).orderBy(contentTypes.name)
  return c.json({ data: types })
})

// ─── GET /:id ─────────────────────────────────────────────────────────────────

router.get('/:id', async (c) => {
  const id = c.req.param('id')!
  const [type] = await db
    .select()
    .from(contentTypes)
    .where(eq(contentTypes.id, id))
    .limit(1)

  if (!type) throw ApiError.notFound('Content type not found')
  return c.json({ data: type })
})

// ─── POST / — utwórz typ ─────────────────────────────────────────────────────

router.post('/', requireAuth, requireRole('super_admin', 'admin'),
  zValidator('json', createSchema),
  async (c) => {
    const body = c.req.valid('json')

    // Sprawdź unikalność sluga
    const [existing] = await db
      .select({ id: contentTypes.id })
      .from(contentTypes)
      .where(eq(contentTypes.slug, body.slug))
      .limit(1)

    if (existing) throw ApiError.conflict(`Content type with slug "${body.slug}" already exists`)

    const [created] = await db.insert(contentTypes).values(body).returning()
    return c.json({ data: created }, 201)
  }
)

// ─── PUT /:id — aktualizuj typ ────────────────────────────────────────────────

router.put('/:id', requireAuth, requireRole('super_admin', 'admin'),
  zValidator('json', updateSchema),
  async (c) => {
    const id = c.req.param('id')!
    const body = c.req.valid('json')

    const [existing] = await db
      .select()
      .from(contentTypes)
      .where(eq(contentTypes.id, id))
      .limit(1)

    if (!existing) throw ApiError.notFound('Content type not found')

    const [updated] = await db
      .update(contentTypes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(contentTypes.id, id))
      .returning()

    return c.json({ data: updated })
  }
)

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

router.delete('/:id', requireAuth, requireRole('super_admin'),
  async (c) => {
    const id = c.req.param('id')!

    const [existing] = await db
      .select()
      .from(contentTypes)
      .where(eq(contentTypes.id, id))
      .limit(1)

    if (!existing) throw ApiError.notFound('Content type not found')

    await db.delete(contentTypes).where(eq(contentTypes.id, id))
    return c.json({ success: true })
  }
)

export default router
