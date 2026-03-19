import { serve } from '@hono/node-server'
import { app } from './app'

const port = parseInt(process.env['API_PORT'] ?? '3001')

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`\n🚀 OverCMS API`)
  console.log(`   http://localhost:${info.port}`)
  console.log(`   Health: http://localhost:${info.port}/health\n`)
})
