import { Hono }          from 'hono'
import { cors }          from 'hono/cors'
import { logger }        from 'hono/logger'
import { licenseRouter }      from './routes/license.js'
import { adminRouter }         from './routes/admin.js'
import { adminUiRouter }       from './routes/admin-ui.js'
import { stripeWebhookRouter } from './routes/stripe-webhook.js'
import { checkoutRouter }      from './routes/checkout.js'
import { customerRouter }      from './routes/customer.js'
import pluginsRouter           from './routes/plugins.js'
import themesRouter            from './routes/themes.js'

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
  if (!ADMIN_SECRET) {
    return c.json({ error: 'Admin secret not configured' }, 500)
  }

  // Panel WWW ma własne logowanie — bramka niżej przepuszcza tylko stronę
  // logowania i obsługę formularza, resztę /admin/ui pilnuje ciasteczkiem.
  if (c.req.path.startsWith('/admin/ui')) {
    return next()
  }

  const auth = c.req.header('authorization')
  const key  = auth?.replace('Bearer ', '')

  if (key !== ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
})

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ ok: true, service: 'license-server' }))

app.route('/', licenseRouter)
// Panel WWW przed API administratora — inaczej `/admin/ui/...` złapałby
// adminRouter i oddał 404 w JSON-ie zamiast strony.
app.route('/admin/ui', adminUiRouter)
app.route('/admin', adminRouter)
app.route('/webhooks', stripeWebhookRouter)
app.route('/checkout', checkoutRouter)
app.route('/customer', customerRouter)
app.route('/', pluginsRouter)
app.route('/', themesRouter)

// ─── Error handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('[license-server] Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
