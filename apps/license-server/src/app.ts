import { Hono }          from 'hono'
import { cors }          from 'hono/cors'
import { logger }        from 'hono/logger'
import { licenseRouter }      from './routes/license.js'
import { adminRouter }         from './routes/admin.js'
import { stripeWebhookRouter } from './routes/stripe-webhook.js'
import { checkoutRouter }      from './routes/checkout.js'
import { customerRouter }      from './routes/customer.js'

const app = new Hono()

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use('*', logger())

app.use('*', cors({
  origin:      (origin) => origin,   // Allow any — license checks are key-based
  credentials: true,
}))

// ─── Admin auth middleware ────────────────────────────────────────────────────

const ADMIN_SECRET = process.env['LICENSE_ADMIN_SECRET']

app.use('/admin/*', async (c, next) => {
  const auth = c.req.header('authorization')
  const key  = auth?.replace('Bearer ', '')

  if (!ADMIN_SECRET) {
    return c.json({ error: 'Admin secret not configured' }, 500)
  }

  if (key !== ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
})

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ ok: true, service: 'license-server' }))

app.route('/', licenseRouter)
app.route('/admin', adminRouter)
app.route('/webhooks', stripeWebhookRouter)
app.route('/checkout', checkoutRouter)
app.route('/customer', customerRouter)

// ─── Error handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('[license-server] Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
