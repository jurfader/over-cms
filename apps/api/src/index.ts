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

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const port = parseInt(process.env['API_PORT'] ?? '3001')

async function start() {
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
