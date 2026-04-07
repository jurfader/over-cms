import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { plugins, licenses, activations } from '../db/schema.js'
import { signPayload } from '../utils/sign.js'

const router = new Hono()

// ─── GET /plugins — public plugin list (marketplace) ──────────────────────────

router.get('/plugins', async (c) => {
  const rows = await db
    .select({
      id: plugins.id,
      name: plugins.name,
      description: plugins.description,
      version: plugins.version,
      icon: plugins.icon,
      author: plugins.author,
      minCmsVersion: plugins.minCmsVersion,
      requiredPlan: plugins.requiredPlan,
      price: plugins.price,
      currency: plugins.currency,
      downloads: plugins.downloads,
      updatedAt: plugins.updatedAt,
    })
    .from(plugins)
    .where(eq(plugins.active, true))
    .orderBy(plugins.name)

  const payload = JSON.stringify({ data: rows })
  const signature = signPayload(payload)

  return c.json({
    data: rows,
    ...(signature ? { signature } : {}),
  })
})

// ─── GET /plugins/:id — single plugin detail ─────────────────────────────────

router.get('/plugins/:id', async (c) => {
  const [plugin] = await db
    .select()
    .from(plugins)
    .where(eq(plugins.id, c.req.param('id')))
    .limit(1)

  if (!plugin) return c.json({ error: 'Plugin not found' }, 404)

  return c.json({ data: plugin })
})

// ─── POST /plugins/:id/download — download plugin (requires valid license) ────

router.post('/plugins/:id/download', async (c) => {
  const pluginId = c.req.param('id')
  const body = await c.req.json<{
    licenseKey: string
    domain: string
    installationId: string
  }>()

  if (!body.licenseKey || !body.domain) {
    return c.json({ error: 'licenseKey and domain required' }, 400)
  }

  // Find plugin
  const [plugin] = await db
    .select()
    .from(plugins)
    .where(eq(plugins.id, pluginId))
    .limit(1)

  if (!plugin || !plugin.active) {
    return c.json({ error: 'Plugin not found' }, 404)
  }

  // Verify license
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, body.licenseKey))
    .limit(1)

  if (!license) {
    return c.json({ error: 'Invalid license key', code: 'INVALID_LICENSE' }, 403)
  }

  if (license.status !== 'active') {
    return c.json({ error: 'License is not active', code: 'LICENSE_INACTIVE' }, 403)
  }

  // Check plan requirement
  const planOrder = { trial: 0, solo: 1, agency: 2 }
  const userPlan = planOrder[license.plan] ?? 0
  const requiredPlan = planOrder[plugin.requiredPlan ?? 'solo'] ?? 1

  if (userPlan < requiredPlan) {
    return c.json({
      error: `This plugin requires "${plugin.requiredPlan}" plan or higher`,
      code: 'PLAN_INSUFFICIENT',
      requiredPlan: plugin.requiredPlan,
    }, 403)
  }

  // Check if license has an active activation for this domain
  const [activation] = await db
    .select()
    .from(activations)
    .where(
      sql`${activations.licenseId} = ${license.id} AND ${activations.domain} = ${body.domain} AND ${activations.active} = true`,
    )
    .limit(1)

  if (!activation) {
    return c.json({
      error: 'No active installation for this domain',
      code: 'DOMAIN_NOT_ACTIVATED',
    }, 403)
  }

  if (!plugin.downloadUrl) {
    return c.json({ error: 'Plugin package not available yet' }, 503)
  }

  // Increment download counter
  await db
    .update(plugins)
    .set({ downloads: sql`${plugins.downloads} + 1` })
    .where(eq(plugins.id, pluginId))

  // Return download URL (signed so OverCMS can verify it came from us)
  const response = {
    pluginId: plugin.id,
    version: plugin.version,
    downloadUrl: plugin.downloadUrl,
  }

  const signature = signPayload(JSON.stringify(response))

  return c.json({
    data: response,
    ...(signature ? { signature } : {}),
  })
})

// ─── Admin: POST /plugins — add/update plugin (requires admin key) ────────────

router.post('/plugins', async (c) => {
  const expected = process.env['ADMIN_API_KEY']
  const adminKey = c.req.header('x-admin-key')
  if (!expected || !adminKey || adminKey !== expected) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<{
    id: string
    name: string
    description?: string
    version: string
    icon?: string
    author?: string
    minCmsVersion?: string
    requiredPlan?: string
    price?: number
    currency?: string
    downloadUrl?: string
    changelog?: string
  }>()

  const [row] = await db
    .insert(plugins)
    .values({
      id: body.id,
      name: body.name,
      description: body.description,
      version: body.version,
      icon: body.icon,
      author: body.author,
      minCmsVersion: body.minCmsVersion,
      requiredPlan: (body.requiredPlan as 'trial' | 'solo' | 'agency') ?? 'solo',
      price: body.price ?? 0,
      currency: body.currency ?? 'PLN',
      downloadUrl: body.downloadUrl,
      changelog: body.changelog,
      active: true,
    })
    .onConflictDoUpdate({
      target: plugins.id,
      set: {
        name: body.name,
        description: body.description,
        version: body.version,
        icon: body.icon,
        author: body.author,
        minCmsVersion: body.minCmsVersion,
        downloadUrl: body.downloadUrl,
        changelog: body.changelog,
        price: body.price ?? 0,
        updatedAt: new Date(),
      },
    })
    .returning()

  return c.json({ data: row })
})

export default router
