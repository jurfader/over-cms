import { Hono } from 'hono'
import { eq, and, sql } from 'drizzle-orm'
import { createReadStream, existsSync, statSync } from 'fs'
import { join, basename } from 'path'
import { db } from '../db/index.js'
import { themes, licenses, activations, licAudit } from '../db/schema.js'
import { signPayload } from '../utils/sign.js'

const router = new Hono()

const THEMES_DIR = process.env['LICENSE_THEMES_DIR'] ?? '/var/lib/overcms-licenses/themes'

// ─── GET /themes — public list (marketplace) ────────────────────────────────
// Optional ?product=overcms|overcrm — domyślnie 'overcms'.

router.get('/themes', async (c) => {
  const productFilter = c.req.query('product') === 'overcrm' ? 'overcrm' : 'overcms'

  const rows = await db
    .select({
      id:           themes.id,
      product:      themes.product,
      name:         themes.name,
      description:  themes.description,
      version:      themes.version,
      author:       themes.author,
      requiredPlan: themes.requiredPlan,
      fileSize:     themes.fileSize,
      downloads:    themes.downloads,
      updatedAt:    themes.updatedAt,
    })
    .from(themes)
    .where(and(eq(themes.active, true), eq(themes.product, productFilter)))
    .orderBy(themes.name)

  const payload = JSON.stringify({ data: rows })
  const signature = signPayload(payload)

  return c.json({
    data: rows,
    ...(signature ? { signature } : {}),
  })
})

// ─── GET /themes/:id — single theme metadata ────────────────────────────────

router.get('/themes/:id', async (c) => {
  const [theme] = await db
    .select({
      id: themes.id, name: themes.name, description: themes.description,
      version: themes.version, author: themes.author,
      requiredPlan: themes.requiredPlan, fileSize: themes.fileSize,
      downloads: themes.downloads, updatedAt: themes.updatedAt,
    })
    .from(themes)
    .where(eq(themes.id, c.req.param('id')))
    .limit(1)

  if (!theme) return c.json({ error: 'Theme not found' }, 404)
  return c.json({ data: theme })
})

// ─── POST /themes/:id/download — stream .zip + Elegant Themes credentials ───
//
// Wymaga: { licenseKey, domain, installationId } w body.
// Zwraca: binary .zip + nagłówki X-OverCMS-License-Username/X-OverCMS-License-Key
// (credencjały ET używane przez OverCMS do zapisu wp_option et_automatic_updates_options).
//
// Credencjały ET są własnością OVERMEDIA — dystrybuujemy je tylko klientom którzy
// mają ważny plan OverCMS. Nie zapisujemy ich w .zip (żeby nie leakować przy
// reuploadzie lub git leak), zwracamy w nagłówkach odpowiedzi.

router.post('/themes/:id/download', async (c) => {
  const themeId = c.req.param('id')
  const body = await c.req.json<{
    licenseKey: string
    domain: string
    installationId?: string
  }>()

  if (!body.licenseKey || !body.domain) {
    return c.json({ error: 'licenseKey and domain required' }, 400)
  }

  // 1. Find theme
  const [theme] = await db
    .select()
    .from(themes)
    .where(eq(themes.id, themeId))
    .limit(1)

  if (!theme || !theme.active) {
    return c.json({ error: 'Theme not found' }, 404)
  }

  // 2. Verify license key
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
  if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
    return c.json({ error: 'License expired', code: 'LICENSE_EXPIRED' }, 403)
  }

  // 3. Plan check
  const planOrder = { trial: 0, solo: 1, agency: 2 }
  const userPlan = planOrder[license.plan] ?? 0
  const requiredPlan = planOrder[theme.requiredPlan ?? 'solo'] ?? 1
  if (userPlan < requiredPlan) {
    return c.json({
      error: `This theme requires "${theme.requiredPlan}" plan or higher`,
      code: 'PLAN_INSUFFICIENT',
      requiredPlan: theme.requiredPlan,
    }, 403)
  }

  // 4. Domain must be activated
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

  // 5. Check file exists on disk
  const safeName = basename(theme.filename)      // prevent path traversal
  const filePath = join(THEMES_DIR, safeName)
  if (!existsSync(filePath)) {
    console.error(`[themes] File missing on disk: ${filePath}`)
    return c.json({ error: 'Theme package missing on server', code: 'FILE_NOT_FOUND' }, 503)
  }

  const stat = statSync(filePath)

  // 6. Audit log + counter bump
  await db.insert(licAudit).values({
    licenseId: license.id,
    event:     'theme.download',
    domain:    body.domain,
    meta:      JSON.stringify({ themeId, version: theme.version, size: stat.size }),
  })
  await db
    .update(themes)
    .set({ downloads: sql`${themes.downloads} + 1` })
    .where(eq(themes.id, themeId))

  // 7. Stream the .zip with ET credentials in response headers
  const stream = createReadStream(filePath)

  c.header('Content-Type', 'application/zip')
  c.header('Content-Length', String(stat.size))
  c.header('Content-Disposition', `attachment; filename="${safeName}"`)
  c.header('X-OverCMS-Theme-Id', theme.id)
  c.header('X-OverCMS-Theme-Version', theme.version)
  if (theme.licenseUsername) {
    c.header('X-OverCMS-License-Username', theme.licenseUsername)
  }
  if (theme.licenseApiKey) {
    c.header('X-OverCMS-License-Key', theme.licenseApiKey)
  }

  // Hono akceptuje Node.js Readable jako body
  return c.body(stream as unknown as ReadableStream)
})

// ─── Admin: POST /themes — upsert theme metadata (requires admin key) ───────
//
// Plik .zip wgrywasz ręcznie przez SCP do /var/lib/overcms-licenses/themes/{filename}.
// Ten endpoint tylko rejestruje metadane + przechowuje ET credentials.

router.post('/themes', async (c) => {
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
    author?: string
    requiredPlan?: 'trial' | 'solo' | 'agency'
    filename: string
    licenseUsername?: string
    licenseApiKey?: string
  }>()

  if (!body.id || !body.name || !body.version || !body.filename) {
    return c.json({ error: 'id, name, version, filename required' }, 400)
  }

  // Compute fileSize if file exists
  const safeName = basename(body.filename)
  const filePath = join(THEMES_DIR, safeName)
  const fileSize = existsSync(filePath) ? statSync(filePath).size : 0

  const [row] = await db
    .insert(themes)
    .values({
      id: body.id,
      name: body.name,
      description: body.description,
      version: body.version,
      author: body.author,
      requiredPlan: body.requiredPlan ?? 'solo',
      filename: safeName,
      fileSize,
      licenseUsername: body.licenseUsername,
      licenseApiKey: body.licenseApiKey,
      active: true,
    })
    .onConflictDoUpdate({
      target: themes.id,
      set: {
        name: body.name,
        description: body.description,
        version: body.version,
        author: body.author,
        requiredPlan: body.requiredPlan ?? 'solo',
        filename: safeName,
        fileSize,
        licenseUsername: body.licenseUsername,
        licenseApiKey: body.licenseApiKey,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: themes.id,
      name: themes.name,
      version: themes.version,
      filename: themes.filename,
      fileSize: themes.fileSize,
    })

  return c.json({ data: row, fileExists: fileSize > 0 })
})

export default router
