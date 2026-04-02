import { Hono } from 'hono'
import { createWriteStream, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { extract } from 'tar'
import { db, modules, eq, sql } from '@overcms/core'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const router = new Hono<AppEnv>()

const LICENSE_SERVER_URL = process.env['LICENSE_SERVER_URL'] ?? 'http://localhost:3002'
const MODULES_DIR = resolve(process.cwd(), 'modules')

// ─── GET /marketplace — list available plugins from license server ────────────

router.get(
  '/marketplace',
  requireAuth,
  requireRole('super_admin', 'admin'),
  async (c) => {
    try {
      const res = await fetch(`${LICENSE_SERVER_URL}/plugins`)
      if (!res.ok) {
        return c.json({ error: 'Failed to fetch marketplace' }, 502)
      }
      const body = await res.json() as { data: unknown[] }

      // Check which plugins are installed locally
      const installed = await db.select({ id: modules.id }).from(modules)
      const installedIds = new Set(installed.map(m => m.id))

      const plugins = (body.data as Record<string, unknown>[] ?? []).map((p) => ({
        ...p,
        installed: installedIds.has(p.id as string),
      }))

      return c.json({ data: plugins })
    } catch (err) {
      console.error('[marketplace] Fetch error:', err)
      return c.json({ error: 'Cannot reach plugin registry' }, 502)
    }
  },
)

// ─── POST /marketplace/install — install a plugin ─────────────────────────────

router.post(
  '/marketplace/install',
  requireAuth,
  requireRole('super_admin'),
  async (c) => {
    const { pluginId } = await c.req.json<{ pluginId: string }>()
    if (!pluginId) return c.json({ error: 'pluginId required' }, 400)

    // Get license info from env
    const licenseKey = process.env['LICENSE_KEY'] ?? ''
    const domain = process.env['BASE_URL']?.replace(/^https?:\/\//, '') ?? 'localhost'
    const installationId = process.env['INSTALLATION_ID'] ?? 'default'

    if (!licenseKey) {
      return c.json({ error: 'LICENSE_KEY not configured' }, 400)
    }

    try {
      // Request download URL from license server
      const downloadRes = await fetch(`${LICENSE_SERVER_URL}/plugins/${pluginId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, domain, installationId }),
      })

      if (!downloadRes.ok) {
        const err = await downloadRes.json() as { error: string; code?: string }
        return c.json({
          error: err.error ?? 'Download request failed',
          code: err.code,
        }, downloadRes.status as 403 | 404)
      }

      const downloadBody = await downloadRes.json() as {
        data: { pluginId: string; version: string; downloadUrl: string }
      }

      const { downloadUrl, version } = downloadBody.data

      // Download the tarball
      const tarRes = await fetch(downloadUrl)
      if (!tarRes.ok || !tarRes.body) {
        return c.json({ error: 'Failed to download plugin package' }, 502)
      }

      // Ensure modules directory exists
      const pluginDir = join(MODULES_DIR, pluginId)
      if (existsSync(pluginDir)) {
        rmSync(pluginDir, { recursive: true })
      }
      mkdirSync(pluginDir, { recursive: true })

      // Extract tarball to plugin directory
      const tmpFile = join(MODULES_DIR, `${pluginId}.tar.gz`)
      const writeStream = createWriteStream(tmpFile)
      await pipeline(
        Readable.fromWeb(tarRes.body as ReadableStream),
        writeStream,
      )

      // Extract
      await extract({
        file: tmpFile,
        cwd: pluginDir,
        strip: 1, // Remove top-level directory from tarball
      })

      // Clean up tarball
      rmSync(tmpFile, { force: true })

      // Register in DB
      await db
        .insert(modules)
        .values({
          id: pluginId,
          name: pluginId,
          version,
          active: false, // Don't auto-activate — user toggles manually
        })
        .onConflictDoUpdate({
          target: modules.id,
          set: { version, updatedAt: sql`now()` },
        })

      return c.json({
        data: {
          pluginId,
          version,
          status: 'installed',
          message: 'Plugin zainstalowany. Zrestartuj serwer API i aktywuj w Moduły.',
        },
      })
    } catch (err) {
      console.error('[marketplace] Install error:', err)
      return c.json({ error: 'Installation failed' }, 500)
    }
  },
)

// ─── DELETE /marketplace/:id — uninstall a plugin ─────────────────────────────

router.delete(
  '/marketplace/:id',
  requireAuth,
  requireRole('super_admin'),
  async (c) => {
    const pluginId = c.req.param('id')!

    // Don't allow uninstalling core modules
    const CORE_MODULES = new Set(['blog', 'forms', 'portfolio'])
    if (CORE_MODULES.has(pluginId)) {
      return c.json({ error: 'Cannot uninstall core module' }, 400)
    }

    // Remove from DB
    await db.delete(modules).where(eq(modules.id, pluginId))

    // Remove files
    const pluginDir = join(MODULES_DIR, pluginId)
    if (existsSync(pluginDir)) {
      rmSync(pluginDir, { recursive: true })
    }

    return c.json({
      data: {
        pluginId,
        status: 'uninstalled',
        message: 'Plugin usunięty. Zrestartuj serwer API.',
      },
    })
  },
)

export default router
