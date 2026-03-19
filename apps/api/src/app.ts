import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { serveStatic } from '@hono/node-server/serve-static'
import { errorHandler } from './middleware/error'
import { rateLimiter } from './middleware/rate-limit'
import { registerRoutes } from './routes'
import type { AppEnv } from './types'

// ─── App ──────────────────────────────────────────────────────────────────────

export const app = new Hono<AppEnv>()

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use('*', logger())

app.use('/api/*', secureHeaders())

app.use('*', cors({
  origin: process.env['ADMIN_CORS_ORIGINS']?.split(',') ?? ['http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400,
}))

app.use('/api/*', rateLimiter)

// ─── Error Handler ────────────────────────────────────────────────────────────

app.onError(errorHandler)

// ─── 404 ─────────────────────────────────────────────────────────────────────

app.notFound((c) =>
  c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404)
)

// ─── Static files — /uploads ──────────────────────────────────────────────────
// serveStatic creates its own Response object, so CORP/CORS headers must be
// injected AFTER next() resolves — do NOT set them before calling next().

app.use('/uploads/*', async (c, next) => {
  await next()
  c.res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
})

app.use('/uploads/*', serveStatic({ root: './public' }))

// ─── Routes ───────────────────────────────────────────────────────────────────

registerRoutes(app)

export default app
