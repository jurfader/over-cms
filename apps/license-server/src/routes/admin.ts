import { Hono }       from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z }          from 'zod'
import { eq, desc, count, sql, and } from 'drizzle-orm'
import { Resend }     from 'resend'
import { db, licenses, activations, licAudit } from '../db/index.js'
import { licenseBundles } from '../db/schema.js'
import { generateLicenseKey } from '../utils/license-key.js'
import { OVERCRM_BUNDLES, isKnownBundle } from '../utils/bundles.js'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createLicenseSchema = z.object({
  product:          z.enum(['overcms', 'overcrm']).default('overcms'),
  plan:             z.enum(['trial', 'solo', 'agency']).default('trial'),
  buyerEmail:       z.string().email(),
  buyerName:        z.string().optional(),
  maxInstallations: z.number().int().positive().optional(),
  expiresAt:        z.string().datetime().optional(),    // ISO string
  notes:            z.string().optional(),
  sendEmail:        z.boolean().default(false),
})

const grantBundleSchema = z.object({
  bundle:    z.string().min(1),
  // 'trial' nie jest tu wymuszane razem z expiresAt celowo — bywa, że dajemy
  // komuś pakiet na próbę bezterminowo (partner, wdrożenie pilotażowe).
  source:    z.enum(['manual', 'stripe', 'trial']).default('manual'),
  expiresAt: z.string().datetime().nullable().optional(),
  notes:     z.string().optional(),
})

const updateLicenseSchema = z.object({
  product:          z.enum(['overcms', 'overcrm']).optional(),
  plan:             z.enum(['trial', 'solo', 'agency']).optional(),
  status:           z.enum(['active', 'suspended', 'expired', 'revoked']).optional(),
  maxInstallations: z.number().int().positive().optional(),
  expiresAt:        z.string().datetime().nullable().optional(),
  notes:            z.string().optional(),
})

// ─── Plan defaults ────────────────────────────────────────────────────────────

function planDefaults(plan: string) {
  switch (plan) {
    case 'agency': return { maxInstallations: 9999, daysValid: null }
    case 'solo':   return { maxInstallations: 1,    daysValid: null }
    case 'trial':  return { maxInstallations: 1,    daysValid: 14   }
    default:       return { maxInstallations: 1,    daysValid: null }
  }
}

// ─── Email helper ─────────────────────────────────────────────────────────────

async function sendLicenseEmail(email: string, name: string | undefined, licenseKey: string, plan: string, expiresAt: Date | null) {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) return

  const resend = new Resend(apiKey)
  const fromDomain = process.env['RESEND_FROM_DOMAIN'] ?? 'overcms.pl'

  const planName = plan === 'agency' ? 'Agency' : plan === 'solo' ? 'Solo' : 'Trial'
  const expiry   = expiresAt ? `ważna do ${new Date(expiresAt).toLocaleDateString('pl-PL')}` : 'bezterminowa'

  await resend.emails.send({
    from:    `OverCMS Licencje <noreply@${fromDomain}>`,
    to:      [email],
    subject: `Twoja licencja OverCMS (${planName})`,
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2>Dziękujemy za zakup OverCMS!</h2>
  ${name ? `<p>Cześć ${name},</p>` : ''}
  <p>Twoja licencja jest gotowa. Oto szczegóły:</p>
  <table style="width:100%;border-collapse:collapse;margin:1.5rem 0">
    <tr><td style="padding:8px;font-weight:600;background:#f5f5f5">Klucz licencji</td><td style="padding:8px;font-family:monospace;font-size:1.1rem;letter-spacing:0.1em;font-weight:700">${licenseKey}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f5f5f5">Plan</td><td style="padding:8px">${planName}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f5f5f5">Ważność</td><td style="padding:8px">${expiry}</td></tr>
  </table>
  <p>Aby aktywować licencję, przejdź do panelu administracyjnego OverCMS i wpisz klucz w ustawieniach.</p>
  <p style="font-size:0.875rem;color:#666">W razie pytań: <a href="mailto:support@overcms.pl">support@overcms.pl</a></p>
</div>`,
  }).catch((err: unknown) => console.error('[license] Email send failed:', err))
}

// ─── Admin router ─────────────────────────────────────────────────────────────

export const adminRouter = new Hono()

// ── GET /admin/licenses ───────────────────────────────────────────────────────
// Optional query: ?product=overcms|overcrm
adminRouter.get('/licenses', async (c) => {
  const productFilter = c.req.query('product')
  const select = {
    id:               licenses.id,
    key:              licenses.key,
    product:          licenses.product,
    plan:             licenses.plan,
    status:           licenses.status,
    buyerEmail:       licenses.buyerEmail,
    buyerName:        licenses.buyerName,
    maxInstallations: licenses.maxInstallations,
    expiresAt:        licenses.expiresAt,
    createdAt:        licenses.createdAt,
    activeCount:      sql<number>`(
      SELECT COUNT(*) FROM lic_activations a
      WHERE a.license_id = ${licenses.id} AND a.active = true
    )`,
  }

  const rows = productFilter === 'overcms' || productFilter === 'overcrm'
    ? await db.select(select).from(licenses).where(eq(licenses.product, productFilter)).orderBy(desc(licenses.createdAt))
    : await db.select(select).from(licenses).orderBy(desc(licenses.createdAt))

  return c.json({ data: rows })
})

// ── GET /admin/licenses/:key ──────────────────────────────────────────────────
adminRouter.get('/licenses/:key', async (c) => {
  const key = c.req.param('key')!

  const [license] = await db.select().from(licenses).where(eq(licenses.key, key)).limit(1)
  if (!license) return c.json({ error: 'Not found' }, 404)

  const acts = await db
    .select()
    .from(activations)
    .where(eq(activations.licenseId, license.id))
    .orderBy(desc(activations.activatedAt))

  const logs = await db
    .select()
    .from(licAudit)
    .where(eq(licAudit.licenseId, license.id))
    .orderBy(desc(licAudit.createdAt))
    .limit(50)

  // Wszystkie nadania, także wygasłe — panel ma pokazywać historię, a nie tylko
  // stan bieżący. Co jest aktywne, rozstrzyga expiresAt przy każdym wierszu.
  const bundles = await db
    .select()
    .from(licenseBundles)
    .where(eq(licenseBundles.licenseId, license.id))
    .orderBy(licenseBundles.bundle)

  return c.json({ data: { license, activations: acts, audit: logs, bundles } })
})

// ── GET /admin/bundles — katalog pakietów ─────────────────────────────────────
adminRouter.get('/bundles', (c) => {
  return c.json({
    data: Object.entries(OVERCRM_BUNDLES).map(([id, label]) => ({ id, label })),
  })
})

// ── POST /admin/licenses/:key/bundles — nadanie pakietu ───────────────────────
//
// UPSERT, nie INSERT: ponowne nadanie tego samego pakietu ma przedłużyć albo
// zmienić warunki, a nie wywalić się na unikalnym indeksie ani zostawić
// duplikatu. Typowy przypadek: klient przedłuża trial albo kupuje na stałe
// coś, co miał na próbę.
adminRouter.post('/licenses/:key/bundles', zValidator('json', grantBundleSchema), async (c) => {
  const licKey = c.req.param('key')!
  const body   = c.req.valid('json')

  if (!isKnownBundle(body.bundle)) {
    return c.json({
      error: `Nieznany pakiet "${body.bundle}"`,
      known: Object.keys(OVERCRM_BUNDLES),
    }, 400)
  }

  const [license] = await db
    .select({ id: licenses.id, product: licenses.product })
    .from(licenses)
    .where(eq(licenses.key, licKey))
    .limit(1)

  if (!license) return c.json({ error: 'Not found' }, 404)

  // Pakiety są pojęciem wyłącznie OVERCRM-owym. Nadanie ich licencji OVERCMS
  // nic by nie dało (CMS ich nie czyta) i myliłoby obraz w panelu.
  if (license.product !== 'overcrm') {
    return c.json({ error: 'Pakiety dotycza wylacznie licencji produktu overcrm' }, 400)
  }

  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

  const [row] = await db
    .insert(licenseBundles)
    .values({
      licenseId: license.id,
      bundle:    body.bundle,
      source:    body.source,
      expiresAt,
      notes:     body.notes,
    })
    .onConflictDoUpdate({
      target: [licenseBundles.licenseId, licenseBundles.bundle],
      set: { source: body.source, expiresAt, notes: body.notes, grantedAt: new Date() },
    })
    .returning()

  await db.insert(licAudit).values({
    licenseId: license.id,
    event:     'bundle-granted',
    meta:      JSON.stringify({ bundle: body.bundle, source: body.source, expiresAt }),
  }).catch(() => {})

  return c.json({ data: row }, 201)
})

// ── DELETE /admin/licenses/:key/bundles/:bundle — odebranie pakietu ───────────
adminRouter.delete('/licenses/:key/bundles/:bundle', async (c) => {
  const licKey = c.req.param('key')!
  const bundle = c.req.param('bundle')!

  const [license] = await db
    .select({ id: licenses.id })
    .from(licenses)
    .where(eq(licenses.key, licKey))
    .limit(1)

  if (!license) return c.json({ error: 'Not found' }, 404)

  const usuniete = await db
    .delete(licenseBundles)
    .where(and(eq(licenseBundles.licenseId, license.id), eq(licenseBundles.bundle, bundle)))
    .returning({ id: licenseBundles.id })

  if (usuniete.length === 0) return c.json({ error: 'Licencja nie ma tego pakietu' }, 404)

  await db.insert(licAudit).values({
    licenseId: license.id,
    event:     'bundle-revoked',
    meta:      JSON.stringify({ bundle }),
  }).catch(() => {})

  // Uwaga operacyjna: CRM klienta zobaczy odebranie dopiero przy najbliższym
  // /validate, czyli w ciągu 24h. Natychmiastowe odcięcie wymaga, żeby klient
  // kliknął „Odśwież licencję”.
  return c.json({ success: true, uwaga: 'CRM klienta zobaczy zmiane przy najblizszym validate (do 24h)' })
})

// ── POST /admin/licenses ──────────────────────────────────────────────────────
adminRouter.post('/licenses', zValidator('json', createLicenseSchema), async (c) => {
  const body = c.req.valid('json')
  const { maxInstallations: defMax, daysValid } = planDefaults(body.plan)

  const key       = generateLicenseKey()
  const maxInst   = body.maxInstallations ?? defMax
  let   expiresAt: Date | null = null

  if (body.expiresAt) {
    expiresAt = new Date(body.expiresAt)
  } else if (daysValid) {
    expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000)
  }

  const [row] = await db.insert(licenses).values({
    key,
    product:          body.product,
    plan:             body.plan,
    buyerEmail:       body.buyerEmail,
    buyerName:        body.buyerName,
    maxInstallations: maxInst,
    expiresAt,
    notes:            body.notes,
  }).returning()

  if (body.sendEmail) {
    void sendLicenseEmail(body.buyerEmail, body.buyerName, key, body.plan, expiresAt)
  }

  return c.json({ data: row }, 201)
})

// ── PATCH /admin/licenses/:key ────────────────────────────────────────────────
adminRouter.patch('/licenses/:key', zValidator('json', updateLicenseSchema), async (c) => {
  const licKey = c.req.param('key')!
  const body   = c.req.valid('json')

  const set: Record<string, unknown> = { updatedAt: sql`now()` }
  if (body.product          != null) set['product']          = body.product
  if (body.plan             != null) set['plan']             = body.plan
  if (body.status           != null) set['status']           = body.status
  if (body.maxInstallations != null) set['maxInstallations'] = body.maxInstallations
  if (body.notes            != null) set['notes']            = body.notes
  if ('expiresAt' in body) {
    set['expiresAt'] = body.expiresAt ? new Date(body.expiresAt) : null
  }

  const [row] = await db
    .update(licenses)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(set as any)
    .where(eq(licenses.key, licKey))
    .returning()

  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: row })
})

// ── DELETE /admin/licenses/:key — revoke ──────────────────────────────────────
adminRouter.delete('/licenses/:key', async (c) => {
  const key = c.req.param('key')!
  const [row] = await db
    .update(licenses)
    .set({ status: 'revoked', updatedAt: sql`now()` })
    .where(eq(licenses.key, key))
    .returning({ id: licenses.id })

  if (!row) return c.json({ error: 'Not found' }, 404)

  // Deactivate all activations
  await db.update(activations).set({ active: false }).where(eq(activations.licenseId, row.id))

  return c.json({ success: true })
})

// ── POST /admin/licenses/:key/resend-email ────────────────────────────────────
adminRouter.post('/licenses/:key/resend-email', async (c) => {
  const key = c.req.param('key')!
  const [license] = await db.select().from(licenses).where(eq(licenses.key, key)).limit(1)
  if (!license) return c.json({ error: 'Not found' }, 404)

  await sendLicenseEmail(license.buyerEmail, license.buyerName ?? undefined, license.key, license.plan, license.expiresAt)
  return c.json({ success: true })
})

// ── GET /admin/stats ──────────────────────────────────────────────────────────
adminRouter.get('/stats', async (c) => {
  const [totalLic]  = await db.select({ value: count() }).from(licenses)
  const [activeLic] = await db.select({ value: count() }).from(licenses).where(eq(licenses.status, 'active'))
  const [totalAct]  = await db.select({ value: count() }).from(activations).where(eq(activations.active, true))

  return c.json({
    data: {
      totalLicenses:      Number(totalLic?.value ?? 0),
      activeLicenses:     Number(activeLic?.value ?? 0),
      totalActivations:   Number(totalAct?.value ?? 0),
    },
  })
})
