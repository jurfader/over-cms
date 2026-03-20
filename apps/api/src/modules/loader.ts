import { Hono }            from 'hono'
import { db, modules, eq, sql } from '@overcms/core'
import { getRegistry }     from './registry'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppEnv }     from '../types'

const middleware = { requireAuth, requireRole }

// ─── Module loader ────────────────────────────────────────────────────────────

export async function loadModules(app: Hono<AppEnv>): Promise<void> {
  const registry = getRegistry()

  for (const [id, mod] of registry) {
    try {
      // Upsert — safe on every restart
      await db
        .insert(modules)
        .values({
          id,
          name:    mod.name,
          version: mod.version,
          active:  true,
        })
        .onConflictDoUpdate({
          target:  modules.id,
          set:     { name: mod.name, version: mod.version, updatedAt: sql`now()` },
        })

      // Re-fetch to get current active status (may have been toggled via admin)
      const [row] = await db
        .select({ active: modules.active })
        .from(modules)
        .where(eq(modules.id, id))
        .limit(1)

      if (!row || !row.active) {
        console.log(`[modules] Skipped (disabled): ${mod.name}`)
        continue
      }

      // Mount routes
      if (mod.routes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = new Hono<any>()
        mod.routes(sub, middleware as unknown as import('@overcms/module-kit').ModuleMiddleware)
        app.route(`/api/m/${id}`, sub)
        console.log(`[modules] Mounted: /api/m/${id}`)
      }

      if (mod.onLoad) await mod.onLoad()

    } catch (err) {
      console.error(`[modules] Failed to load module "${id}":`, err)
      // Continue loading other modules — don't crash the whole API
    }
  }
}
