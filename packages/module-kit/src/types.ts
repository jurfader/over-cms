import type { Hono, MiddlewareHandler } from 'hono'

// ─── Middleware injected into modules by the loader ───────────────────────────

export interface ModuleMiddleware {
  requireAuth: MiddlewareHandler
  requireRole: (...roles: string[]) => MiddlewareHandler
}

// ─── Admin sidebar entry ──────────────────────────────────────────────────────

export interface ModuleAdminNav {
  /** Link shown in admin sidebar, e.g. '/modules/forms' */
  path:  string
  label: string
  /** lucide-react icon name, e.g. 'FileText' */
  icon?: string
}

// ─── Setting definition ───────────────────────────────────────────────────────

export interface ModuleSetting {
  type:     'string' | 'number' | 'boolean'
  label:    string
  default?: unknown
}

// ─── Module definition ────────────────────────────────────────────────────────

export interface OverCMSModule {
  /** Unique slug, e.g. 'forms'. Used as the DB key and URL prefix. */
  id:          string
  /** Human-readable name. */
  name:        string
  version:     string
  description?: string
  /** lucide-react icon name shown in the admin modules list. */
  icon?:       string

  /**
   * Register Hono routes mounted at /api/m/{id}/*.
   * Use the provided middleware for auth checks.
   */
  routes?: (app: Hono, middleware: ModuleMiddleware) => void

  /** Called once on first install (run DB migrations, seed data, etc.). */
  onInstall?: () => Promise<void>

  /** Called on every startup when the module is active. */
  onLoad?: () => Promise<void>

  /** Adds an entry to the admin sidebar under "Moduły". */
  adminNav?: ModuleAdminNav

  /** Configurable settings shown in the modules admin UI. */
  settings?: Record<string, ModuleSetting>
}
