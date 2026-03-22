import { Hono }       from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z }          from 'zod'
import { eq, and, count } from 'drizzle-orm'
import { db, licenses, activations, licAudit } from '../db/index.js'
import { normalizeDomain } from '../utils/license-key.js'
import { signPayload } from '../utils/sign.js'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const activateSchema = z.object({
  licenseKey:     z.string().min(1),
  domain:         z.string().min(1),
  installationId: z.string().min(1),
})

const validateSchema = z.object({
  licenseKey:     z.string().min(1),
  domain:         z.string().min(1),
  installationId: z.string().min(1),
})

const deactivateSchema = z.object({
  licenseKey:     z.string().min(1),
  domain:         z.string().min(1),
  installationId: z.string().min(1),
})

// ─── Audit helper ─────────────────────────────────────────────────────────────

async function audit(licenseId: string | null, event: string, domain?: string, meta?: unknown) {
  await db.insert(licAudit).values({
    licenseId,
    event,
    domain,
    meta: meta != null ? JSON.stringify(meta) : undefined,
  }).catch(() => {})
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const licenseRouter = new Hono()

// ── POST /activate ────────────────────────────────────────────────────────────
licenseRouter.post('/activate', zValidator('json', activateSchema), async (c) => {
  const { licenseKey, domain: rawDomain, installationId } = c.req.valid('json')
  const domain = normalizeDomain(rawDomain)

  // Find license
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, licenseKey))
    .limit(1)

  if (!license) {
    return c.json({ success: false, error: 'INVALID_LICENSE' }, 404)
  }

  if (license.status !== 'active') {
    return c.json({ success: false, error: 'LICENSE_INACTIVE', status: license.status }, 403)
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    await db.update(licenses).set({ status: 'expired' }).where(eq(licenses.id, license.id))
    return c.json({ success: false, error: 'LICENSE_EXPIRED' }, 403)
  }

  // Check if this domain is already activated for this license
  const [existing] = await db
    .select()
    .from(activations)
    .where(and(eq(activations.licenseId, license.id), eq(activations.domain, domain)))
    .limit(1)

  if (existing) {
    // Re-activate (update installationId + lastSeen)
    await db.update(activations)
      .set({ active: true, installationId, lastSeenAt: new Date() })
      .where(eq(activations.id, existing.id))
    await audit(license.id, 'reactivate', domain)
    const data = {
      success:   true,
      plan:      license.plan,
      expiresAt: license.expiresAt,
    }
    const signature = signPayload(data)
    const response: Record<string, unknown> = data
    if (signature) response.signature = signature
    return c.json(response)
  }

  // Count active installations
  const countRows = await db
    .select({ value: count() })
    .from(activations)
    .where(and(eq(activations.licenseId, license.id), eq(activations.active, true)))
  const activeCount = Number(countRows[0]?.value ?? 0)

  if (license.plan !== 'agency' && activeCount >= license.maxInstallations) {
    return c.json({
      success: false,
      error:   'MAX_INSTALLATIONS_REACHED',
      active:  activeCount,
      max:     license.maxInstallations,
    }, 403)
  }

  // Create activation
  await db.insert(activations).values({
    licenseId:      license.id,
    domain,
    installationId,
  })

  await audit(license.id, 'activate', domain)

  const data = {
    success:   true,
    plan:      license.plan,
    expiresAt: license.expiresAt,
  }
  const signature = signPayload(data)
  const response: Record<string, unknown> = data
  if (signature) response.signature = signature
  return c.json(response)
})

// ── POST /validate ────────────────────────────────────────────────────────────
licenseRouter.post('/validate', zValidator('json', validateSchema), async (c) => {
  const { licenseKey, domain: rawDomain, installationId } = c.req.valid('json')
  const domain = normalizeDomain(rawDomain)

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, licenseKey))
    .limit(1)

  if (!license) return c.json({ valid: false, error: 'INVALID_LICENSE' })

  if (license.status !== 'active') {
    return c.json({ valid: false, error: 'LICENSE_INACTIVE', status: license.status })
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    await db.update(licenses).set({ status: 'expired' }).where(eq(licenses.id, license.id))
    return c.json({ valid: false, error: 'LICENSE_EXPIRED' })
  }

  // Check activation exists
  const [activation] = await db
    .select()
    .from(activations)
    .where(and(
      eq(activations.licenseId, license.id),
      eq(activations.domain, domain),
      eq(activations.active, true),
    ))
    .limit(1)

  if (!activation) return c.json({ valid: false, error: 'DOMAIN_NOT_ACTIVATED' })

  // Update lastSeen
  await db.update(activations)
    .set({ lastSeenAt: new Date(), installationId })
    .where(eq(activations.id, activation.id))

  const data = {
    valid:     true,
    plan:      license.plan,
    expiresAt: license.expiresAt,
  }
  const signature = signPayload(data)
  const response: Record<string, unknown> = data
  if (signature) response.signature = signature
  return c.json(response)
})

// ── POST /deactivate ──────────────────────────────────────────────────────────
licenseRouter.post('/deactivate', zValidator('json', deactivateSchema), async (c) => {
  const { licenseKey, domain: rawDomain } = c.req.valid('json')
  const domain = normalizeDomain(rawDomain)

  const [license] = await db
    .select({ id: licenses.id })
    .from(licenses)
    .where(eq(licenses.key, licenseKey))
    .limit(1)

  if (!license) return c.json({ success: false, error: 'INVALID_LICENSE' }, 404)

  await db.update(activations)
    .set({ active: false })
    .where(and(eq(activations.licenseId, license.id), eq(activations.domain, domain)))

  await audit(license.id, 'deactivate', domain)

  return c.json({ success: true })
})

// ── GET /status ───────────────────────────────────────────────────────────────
licenseRouter.get('/status', async (c) => {
  const { licenseKey, domain } = c.req.query()
  if (!licenseKey || !domain) {
    return c.json({ error: 'Missing licenseKey or domain' }, 400)
  }

  const normalDomain = normalizeDomain(domain)

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, licenseKey))
    .limit(1)

  if (!license) return c.json({ valid: false, error: 'INVALID_LICENSE' })

  const [activation] = await db
    .select()
    .from(activations)
    .where(and(
      eq(activations.licenseId, license.id),
      eq(activations.domain, normalDomain),
      eq(activations.active, true),
    ))
    .limit(1)

  const totalRows = await db
    .select({ value: count() })
    .from(activations)
    .where(and(eq(activations.licenseId, license.id), eq(activations.active, true)))
  const totalActivations = Number(totalRows[0]?.value ?? 0)

  return c.json({
    valid:            license.status === 'active' && !!activation,
    plan:             license.plan,
    status:           license.status,
    domainActivated:  !!activation,
    totalActivations,
    maxInstallations: license.maxInstallations,
    expiresAt:        license.expiresAt,
  })
})
