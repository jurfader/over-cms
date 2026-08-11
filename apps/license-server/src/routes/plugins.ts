import { Hono } from 'hono'
import { eq, and, sql } from 'drizzle-orm'
import { readFile, stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { db } from '../db/index.js'
import { plugins, licenses, activations } from '../db/schema.js'
import { signPayload } from '../utils/sign.js'
import { activeBundlesFor, OVERCRM_BUNDLES, BUNDLE_CORE } from '../utils/bundles.js'

const router = new Hono()

// Katalog z plikami pluginow. Stosowany przez /plugin-files/:filename do
// statycznego serwowania ZIP'ow. Domyslny: /opt/overcms-license/plugins
const PLUGINS_DIR = process.env['PLUGINS_DIR'] ?? '/opt/overcms-license/plugins'

// ─── GET /plugins — public plugin list (marketplace) ──────────────────────────
// Optional ?product=overcms|overcrm — filtruje pluginy do konkretnego produktu.
// Bez parametru: domyślnie 'overcms' (wstecznie kompatybilne z istniejącymi
// klientami OverCMS którzy nie wysyłają parametru).

router.get('/plugins', async (c) => {
  const productFilter = c.req.query('product') === 'overcrm' ? 'overcrm' : 'overcms'

  const rows = await db
    .select({
      id: plugins.id,
      product: plugins.product,
      name: plugins.name,
      description: plugins.description,
      version: plugins.version,
      icon: plugins.icon,
      author: plugins.author,
      minCmsVersion: plugins.minCmsVersion,
      requiredPlan: plugins.requiredPlan,
      bundle: plugins.bundle,
      price: plugins.price,
      currency: plugins.currency,
      downloads: plugins.downloads,
      updatedAt: plugins.updatedAt,
    })
    .from(plugins)
    .where(and(eq(plugins.active, true), eq(plugins.product, productFilter)))
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

  // ── Kontrola dostępu ────────────────────────────────────────────────────────
  //
  // Dwa produkty, dwa różne modele, i to celowo:
  //
  //  - OVERCMS pyta o PLAN, bo tam dostęp jest drabinką: trial < solo < agency.
  //  - OVERCRM pyta o PAKIET, bo pakiety są względem siebie NIEZALEŻNE.
  //    Klient z Pakietem AI nie ma przez to Pakietu Sprzedaż, więc drabinka
  //    nie ma tu czego porównywać.
  //
  // Gdyby OVERCRM przepuścić przez drabinkę planów, licencja `agency`
  // odblokowałaby wszystkie płatne moduły naraz — czyli rozdała je za darmo.
  if (license.product === 'overcrm') {
    // Moduł bez pakietu ALBO z pakietem `overcrm-core` = wliczony w licencję
    // podstawową i dostępny dla każdej ważnej licencji.
    //
    // Warunek na BUNDLE_CORE jest konieczny, nie kosmetyczny: `activeBundlesFor`
    // celowo NIGDY nie zwraca `overcrm-core`, bo tego pakietu się nie nadaje.
    // Bez tego sprawdzenia moduł deklarujący go w manifeście byłby zablokowany
    // dla wszystkich — czyli akurat moduły DARMOWE (Poczta, Kanban, Leady,
    // Oś czasu) stałyby się jedynymi niemożliwymi do zainstalowania.
    if (plugin.bundle && plugin.bundle !== BUNDLE_CORE) {
      const posiadane = await activeBundlesFor(license.id)

      if (!posiadane.includes(plugin.bundle)) {
        return c.json({
          error: `Ten modul wymaga pakietu "${OVERCRM_BUNDLES[plugin.bundle] ?? plugin.bundle}"`,
          code: 'BUNDLE_MISSING',
          requiredBundle: plugin.bundle,
        }, 403)
      }
    }
  } else {
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
    product?: 'overcms' | 'overcrm'
    name: string
    description?: string
    version: string
    icon?: string
    author?: string
    minCmsVersion?: string
    requiredPlan?: string
    bundle?: string
    price?: number
    currency?: string
    downloadUrl?: string
    changelog?: string
  }>()

  const product = body.product === 'overcrm' ? 'overcrm' : 'overcms'

  const [row] = await db
    .insert(plugins)
    .values({
      id: body.id,
      product,
      name: body.name,
      description: body.description,
      version: body.version,
      icon: body.icon,
      author: body.author,
      minCmsVersion: body.minCmsVersion,
      requiredPlan: (body.requiredPlan as 'trial' | 'solo' | 'agency') ?? 'solo',
      bundle: body.bundle ?? null,
      price: body.price ?? 0,
      currency: body.currency ?? 'PLN',
      downloadUrl: body.downloadUrl,
      changelog: body.changelog,
      active: true,
    })
    .onConflictDoUpdate({
      target: plugins.id,
      set: {
        product,
        name: body.name,
        description: body.description,
        version: body.version,
        icon: body.icon,
        author: body.author,
        minCmsVersion: body.minCmsVersion,
        bundle: body.bundle ?? null,
        downloadUrl: body.downloadUrl,
        changelog: body.changelog,
        price: body.price ?? 0,
        updatedAt: new Date(),
      },
    })
    .returning()

  return c.json({ data: row })
})

// ─── GET /plugin-files/:filename — serwowanie ZIP'ow modulow ─────────────────
// Pliki obecne w PLUGINS_DIR sa serwowane jako application/zip. Filename
// musi byc samym basename (bez path traversal). Plugins darmowe — brak auth
// (URL znany tylko po wywolaniu /plugins/:id/download).

router.get('/plugin-files/:filename', async (c) => {
  const filename = basename(c.req.param('filename'))
  if (!filename.endsWith('.zip') && !filename.endsWith('.tar.gz')) {
    return c.json({ error: 'Invalid file type' }, 400)
  }

  const filepath = join(PLUGINS_DIR, filename)
  try {
    await stat(filepath)
  } catch {
    return c.json({ error: 'Plugin package not found' }, 404)
  }

  const buffer = await readFile(filepath)
  return c.body(buffer, 200, {
    'Content-Type': filename.endsWith('.zip') ? 'application/zip' : 'application/gzip',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })
})

export default router
