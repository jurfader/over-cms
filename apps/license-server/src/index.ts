import { serve } from '@hono/node-server'
import app        from './app.js'

const port = parseInt(process.env['LICENSE_PORT'] ?? '3002')

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`\n🔑 OverCMS License Server`)
  console.log(`   http://localhost:${info.port}`)
  console.log(`   Health: http://localhost:${info.port}/health\n`)
})
