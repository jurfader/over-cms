import { defineModule } from '@overcms/module-kit'
import type { ModuleMiddleware } from '@overcms/module-kit'
import { Hono } from 'hono'
import { publicRoutes } from './routes/public'
import { adminRoutes } from './routes/admin'
import { itnRoute } from './routes/itn'

// ─── Register routes ──────────────────────────────────────────────────────────

function registerRoutes(app: Hono, middleware: ModuleMiddleware) {
  // Public endpoints (no auth)
  app.route('/', publicRoutes)

  // Autopay ITN webhook (no auth, hash-verified)
  app.route('/', itnRoute)

  // Admin endpoints (requireAuth)
  app.route('/admin', adminRoutes(middleware))
}

// ─── Module definition ────────────────────────────────────────────────────────

export default defineModule({
  id: 'reservations',
  name: 'Rezerwacje',
  version: '1.0.0',
  description:
    'System rezerwacji online z integracją płatności Autopay (BLIK, karty, przelewy).',
  icon: 'CalendarCheck',
  routes: registerRoutes,
  adminNav: {
    label: 'Rezerwacje',
    path: '/modules/reservations',
    icon: 'CalendarCheck',
  },
})
