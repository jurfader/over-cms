import { Hono }       from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z }          from 'zod'
import { eq, and }    from 'drizzle-orm'
import { db, licenses, activations } from '../db/index.js'

export const customerRouter = new Hono()

// ─── GET /customer/:key — pobierz licencję + aktywacje ────────────────────────

customerRouter.get('/:key', async (c) => {
  const key = c.req.param('key').toUpperCase()

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, key))
    .limit(1)

  if (!license) {
    return c.json({ error: 'License not found' }, 404)
  }

  const acts = await db
    .select({
      id:             activations.id,
      domain:         activations.domain,
      installationId: activations.installationId,
      active:         activations.active,
      activatedAt:    activations.activatedAt,
      lastSeenAt:     activations.lastSeenAt,
    })
    .from(activations)
    .where(eq(activations.licenseId, license.id))

  const activeCount = acts.filter((a) => a.active).length

  return c.json({
    data: {
      key:              license.key,
      plan:             license.plan,
      status:           license.status,
      buyerName:        license.buyerName,
      buyerEmail:       license.buyerEmail,
      maxInstallations: license.maxInstallations,
      expiresAt:        license.expiresAt,
      createdAt:        license.createdAt,
      activeCount,
      activations:      acts,
    },
  })
})

// ─── POST /customer/:key/deactivate — self-service deaktywacja instalacji ────

const deactivateSchema = z.object({
  domain: z.string().min(1),
})

customerRouter.post('/:key/deactivate',
  zValidator('json', deactivateSchema),
  async (c) => {
    const key    = c.req.param('key').toUpperCase()
    const { domain } = c.req.valid('json')

    const [license] = await db
      .select({ id: licenses.id, status: licenses.status })
      .from(licenses)
      .where(eq(licenses.key, key))
      .limit(1)

    if (!license) {
      return c.json({ error: 'License not found' }, 404)
    }

    // Normalize domain — remove protocol + trailing slash
    const normalized = domain
      .replace(/^https?:\/\//i, '')
      .replace(/\/$/, '')
      .toLowerCase()

    const result = await db
      .update(activations)
      .set({ active: false })
      .where(
        and(
          eq(activations.licenseId, license.id),
          eq(activations.domain, normalized),
        ),
      )
      .returning({ id: activations.id })

    if (result.length === 0) {
      return c.json({ error: 'Activation not found for this domain' }, 404)
    }

    return c.json({ ok: true, deactivated: normalized })
  },
)
