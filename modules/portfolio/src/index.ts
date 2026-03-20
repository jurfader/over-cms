import { defineModule }    from '@overcms/module-kit'
import type { ModuleMiddleware } from '@overcms/module-kit'
import type { Hono }            from 'hono'

// ─── Routes ───────────────────────────────────────────────────────────────────

function registerRoutes(_app: Hono, _middleware: ModuleMiddleware) {
  // Portfolio content is served via the standard content API (/api/content/project)
  // This module exists to register the adminNav entry and future custom routes
}

// ─── Module definition ────────────────────────────────────────────────────────

export default defineModule({
  id:          'portfolio',
  name:        'Portfolio',
  version:     '1.0.0',
  description: 'Moduł portfolio projektów.',
  icon:        'Briefcase',
  routes:      registerRoutes,
  adminNav: {
    label: 'Portfolio',
    path:  '/content/project',
    icon:  'Briefcase',
  },
})
