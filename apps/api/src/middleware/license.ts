import type { Context, Next } from 'hono'
import { readFileSync, writeFileSync } from 'node:fs'
import type { LicenseVerification } from '@overcms/core'

// ─── Constants ────────────────────────────────────────────────────────────────

const LICENSE_GRACE_DAYS = 7
const CHECK_INTERVAL_MS  = 24 * 60 * 60 * 1000  // 24h
const STATUS_FILE        = '/tmp/overcms-license-status.json'

// ─── State ────────────────────────────────────────────────────────────────────

let lastCheckTime    = 0
let cachedStatus: LicenseVerification | null = null

// ─── Helper: read cached license status ────────────────────────────────────────

function readCachedStatus(): LicenseVerification | null {
  try {
    const data = readFileSync(STATUS_FILE, 'utf-8')
    return JSON.parse(data) as LicenseVerification
  } catch {
    return null
  }
}

// ─── Helper: write license status to disk ─────────────────────────────────────

function writeLicenseStatus(status: LicenseVerification) {
  try {
    writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2))
    cachedStatus = status
  } catch (err) {
    console.error('[License] Failed to write status file:', err)
  }
}

// ─── Helper: validate license with server ────────────────────────────────────

async function validateLicenseWithServer(): Promise<LicenseVerification | null> {
  const licenseKey = process.env['OVERCMS_LICENSE_KEY']
  if (!licenseKey) return null  // No license key configured

  const serverUrl = process.env['LICENSE_SERVER_URL']
  const installId = process.env['OVERCMS_INSTALL_ID']
  const domain    = process.env['API_DOMAIN'] ?? process.env['SITE_URL'] ?? 'localhost'

  if (!serverUrl) {
    console.warn('[License] LICENSE_SERVER_URL not set')
    return null
  }

  try {
    const res = await fetch(`${serverUrl}/validate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ licenseKey, domain, installationId: installId }),
      signal:  AbortSignal.timeout(5000),
    })

    const body = await res.json() as { valid: boolean; error?: string; plan?: string; expiresAt?: string | null }

    if (res.ok && body.valid) {
      return {
        valid: true,
        lastCheck: new Date().toISOString(),
        plan: body.plan,
      }
    }

    // Validation failed
    console.warn(`[License] Validation failed: ${body.error ?? 'Unknown error'}`)
    return {
      valid: false,
      lastCheck: new Date().toISOString(),
      plan: body.plan,
    }
  } catch (err) {
    console.warn('[License] Validation error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Helper: determine if license is currently valid (with grace period) ──────

async function isLicenseValid(): Promise<boolean> {
  const licenseKey = process.env['OVERCMS_LICENSE_KEY']
  if (!licenseKey) return true  // No license = allow (dev mode)

  const now = Date.now()

  // Check if interval elapsed
  if (now - lastCheckTime > CHECK_INTERVAL_MS) {
    lastCheckTime = now
    const freshStatus = await validateLicenseWithServer()

    if (freshStatus) {
      // Server reachable and returned valid data
      writeLicenseStatus(freshStatus)
      return freshStatus.valid
    }

    // Server unreachable — use grace period logic
    const cached = cachedStatus ?? readCachedStatus()
    if (!cached) {
      // Never checked before, assume valid (optimistic)
      const initial: LicenseVerification = {
        valid: true,
        lastCheck: new Date().toISOString(),
      }
      writeLicenseStatus(initial)
      return true
    }

    // Calculate grace period expiration
    const lastCheckDate = new Date(cached.lastCheck).getTime()
    const gracePeriodMs  = LICENSE_GRACE_DAYS * 24 * 60 * 60 * 1000
    const expiredAt      = lastCheckDate + gracePeriodMs

    if (now > expiredAt) {
      // Grace period expired — block
      const status: LicenseVerification = {
        valid: false,
        lastCheck: new Date().toISOString(),
        plan: cached.plan,
        gracePeriodEndsAt: new Date(expiredAt).toISOString(),
      }
      writeLicenseStatus(status)
      return false
    }

    // Still in grace period
    console.warn(`[License] Server unreachable, grace period expires ${new Date(expiredAt).toISOString()}`)
    return true
  }

  // No re-check needed, use cached
  const cached = cachedStatus ?? readCachedStatus()
  return cached?.valid ?? true
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function licenseMiddleware(c: Context, next: Next) {
  // Allow /health endpoint without license check
  if (c.req.path === '/health') {
    return next()
  }

  const isValid = await isLicenseValid()

  if (!isValid) {
    return c.json(
      {
        error: 'License invalid or expired',
        code: 'LICENSE_INVALID',
      },
      403
    )
  }

  return next()
}
