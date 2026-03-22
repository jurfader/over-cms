import { serve }          from '@hono/node-server'
import { app }            from './app'
import { registerModule } from './modules/registry'
import { loadModules }    from './modules/loader'

// ─── Register modules ──────────────────────────────────────────────────────────
// Import moduły tutaj — każdy zarejestrowany moduł jest automatycznie
// montowany pod /api/m/{id}/ jeśli jest aktywny w bazie danych.

import formsModule     from '@overcms/module-forms'
import blogModule      from '@overcms/module-blog'
import portfolioModule from '@overcms/module-portfolio'

registerModule(formsModule)
registerModule(blogModule)
registerModule(portfolioModule)

// ─── License activation on startup ────────────────────────────────────────────

async function activateLicense() {
  const licenseKey = process.env['OVERCMS_LICENSE_KEY']
  const installId  = process.env['OVERCMS_INSTALL_ID']
  const domain     = process.env['API_DOMAIN'] ?? process.env['SITE_URL'] ?? 'localhost'
  const serverUrl  = process.env['LICENSE_SERVER_URL']

  if (!licenseKey || !serverUrl) {
    // No license configured — skip activation
    return
  }

  try {
    const res = await fetch(`${serverUrl}/api/licenses/${licenseKey}/activate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ domain, installId }),
      signal:  AbortSignal.timeout(5000),
    })

    if (res.ok) {
      const data = await res.json() as { success: boolean }
      if (data.success) {
        console.log('[License] ✅ Installation activated')
      }
    } else if (res.status === 404) {
      console.warn('[License] Activation endpoint not yet available on server')
    } else {
      const data = await res.json() as { error?: string }
      console.warn(`[License] Activation failed: ${data.error ?? res.statusText}`)
    }
  } catch (err) {
    console.warn(`[License] Activation check failed: ${err instanceof Error ? err.message : err}`)
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const port = parseInt(process.env['API_PORT'] ?? '3001')

async function start() {
  await activateLicense()
  await loadModules(app)

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`\n🚀 OverCMS API`)
    console.log(`   http://localhost:${info.port}`)
    console.log(`   Health: http://localhost:${info.port}/health\n`)
  })
}

start().catch((err) => {
  console.error('Failed to start API:', err)
  process.exit(1)
})
