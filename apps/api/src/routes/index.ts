import type { Hono } from 'hono'
import health from './health'
import authRouter from './auth'
import contentTypesRouter from './content-types'
import contentRouter from './content'
import mediaRouter from './media'
import settingsRouter from './settings'
import seoRouter from './seo'
import redirectsRouter from './redirects'
import usersRouter   from './users'
import modulesRouter  from './modules'
import transferRouter from './transfer'
import type { AppEnv } from '../types'

export function registerRoutes(app: Hono<AppEnv>) {
  app.route('/health', health)
  app.route('/api/auth', authRouter)
  app.route('/api/content-types', contentTypesRouter)
  app.route('/api/content', contentRouter)
  app.route('/api/media', mediaRouter)
  app.route('/api/settings', settingsRouter)
  app.route('/api/seo', seoRouter)
  app.route('/api/redirects', redirectsRouter)
  app.route('/api/users', usersRouter)
  app.route('/api/modules',   modulesRouter)
  app.route('/api/transfer',  transferRouter)
}
