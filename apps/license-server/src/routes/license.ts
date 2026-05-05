import { Hono }       from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z }          from 'zod'
import { eq, and, count } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { db, licenses, activations, licAudit } from '../db/index.js'
import { normalizeDomain } from '../utils/license-key.js'
import { signPayload } from '../utils/sign.js'

// Etap 2c anti-piracy: rotujący token bindujący instalację
function generateBindingToken(): string {
  return randomBytes(32).toString('hex') // 64 znaki hex
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

// Telemetry phone-home (Etap 2b anti-piracy) — klient OVERCRM/OVERCMS wysyła
// metrics w activate i validate. Zapisywane w lic_audit (event=telemetry).
// Pomocne do wykrywania klonowania (różne build_hash dla solo plan, anomalie userów).
const telemetrySchema = z.object({
  app_version:     z.string().optional(),
  php_version:     z.string().optional(),
  laravel_version: z.string().optional(),
  users_count:     z.number().int().nonnegative().optional(),
  clients_count:   z.number().int().nonnegative().optional(),
  tasks_count:     z.number().int().nonnegative().optional(),
  modules:         z.array(z.string()).optional(),
  timezone:        z.string().optional(),
  locale:          z.string().optional(),
  error:           z.string().optional(),
}).passthrough().optional()

const activateSchema = z.object({
  licenseKey:     z.string().min(1),
  domain:         z.string().min(1),
  installationId: z.string().min(1),
  metrics:        telemetrySchema,
})

const validateSchema = z.object({
  licenseKey:     z.string().min(1),
  domain:         z.string().min(1),
  installationId: z.string().min(1),
  metrics:        telemetrySchema,
  bindingToken:   z.string().min(32).max(128).optional(), // Etap 2c
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
  const { licenseKey, domain: rawDomain, installationId, metrics } = c.req.valid('json')
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
    // Re-activate — wygeneruj NOWY binding token (poprzednie tokeny tracą ważność).
    // Pirat mógł sklonować z poprzednim tokenem — re-aktywacja przez prawdziwego
    // klienta zeruje pirata.
    const newToken = generateBindingToken()
    await db.update(activations)
      .set({
        active: true,
        installationId,
        lastSeenAt: new Date(),
        bindingToken: newToken,
        previousToken: null,        // re-activate = clean slate
        tokenRotatedAt: new Date(),
      })
      .where(eq(activations.id, existing.id))
    await audit(license.id, 'reactivate', domain, metrics)
    const data = {
      success:      true,
      plan:         license.plan,
      expiresAt:    license.expiresAt,
      bindingToken: newToken,
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

  // Create activation — pierwszy token bindujący
  const firstToken = generateBindingToken()
  await db.insert(activations).values({
    licenseId:      license.id,
    domain,
    installationId,
    bindingToken:   firstToken,
    tokenRotatedAt: new Date(),
  })

  await audit(license.id, 'activate', domain, metrics)

  const data = {
    success:      true,
    plan:         license.plan,
    expiresAt:    license.expiresAt,
    bindingToken: firstToken,
  }
  const signature = signPayload(data)
  const response: Record<string, unknown> = data
  if (signature) response.signature = signature
  return c.json(response)
})

// ── POST /validate ────────────────────────────────────────────────────────────
licenseRouter.post('/validate', zValidator('json', validateSchema), async (c) => {
  const { licenseKey, domain: rawDomain, installationId, metrics, bindingToken } = c.req.valid('json')
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

  // Etap 2c: binding token verification + rotation
  // Akceptujemy: aktualny bindingToken LUB previousToken (24h grace window).
  // Backward compat: gdy activation nie ma bindingToken (instalacja sprzed Etapu 2c),
  // pomijamy weryfikację — pierwszy validate ustawi token.
  if (activation.bindingToken) {
    if (!bindingToken) {
      // Klient ma starą wersję bez tokenu — wymagamy re-aktywacji
      await audit(license.id, 'binding-missing', domain, { hint: 'client has no token, has activation token' })
      return c.json({ valid: false, error: 'BINDING_REQUIRED' })
    }

    const matchesCurrent = bindingToken === activation.bindingToken
    const matchesPrevious = activation.previousToken && bindingToken === activation.previousToken
    const previousStillValid = activation.tokenRotatedAt &&
      (Date.now() - new Date(activation.tokenRotatedAt).getTime()) < 24 * 60 * 60 * 1000

    if (!matchesCurrent && !(matchesPrevious && previousStillValid)) {
      await audit(license.id, 'binding-mismatch', domain, {
        client_token_prefix: bindingToken.slice(0, 8),
        server_token_prefix: activation.bindingToken.slice(0, 8),
      })
      return c.json({ valid: false, error: 'BINDING_MISMATCH' })
    }
  }

  // Rotuj token: nowy aktualny, stary do previous (24h grace)
  const newToken = generateBindingToken()
  await db.update(activations)
    .set({
      lastSeenAt:     new Date(),
      installationId,
      previousToken:  activation.bindingToken,
      bindingToken:   newToken,
      tokenRotatedAt: new Date(),
    })
    .where(eq(activations.id, activation.id))

  if (metrics) {
    await audit(license.id, 'telemetry', domain, metrics)
  }

  const data = {
    valid:        true,
    plan:         license.plan,
    expiresAt:    license.expiresAt,
    bindingToken: newToken,
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
