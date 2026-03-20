import type { Context, Next } from 'hono'

// ─── License validation middleware ────────────────────────────────────────────
// Pings the license server every 24h. On failure, allows a 7-day grace period.
// Stored in a simple in-memory object (reset on API restart — acceptable for
// a server process that restarts infrequently).

const LICENSE_GRACE_DAYS = 7
const CHECK_INTERVAL_MS  = 24 * 60 * 60 * 1000  // 24h

let lastCheck:     number  = 0
let lastValid:     boolean = true   // optimistic start
let failingSince:  number  = 0      // timestamp when validity first failed

async function checkLicense(): Promise<boolean> {
  const licenseKey = process.env['OVERCMS_LICENSE_KEY']
  const siteUrl    = process.env['SITE_URL'] ?? process.env['ADMIN_URL'] ?? 'localhost'
  const serverUrl  = process.env['LICENSE_SERVER_URL'] ?? 'http://localhost:3002'

  // If no license key configured, allow (dev/trial mode)
  if (!licenseKey) return true

  const installId = process.env['OVERCMS_INSTALL_ID'] ?? 'default'

  try {
    const res = await fetch(`${serverUrl}/validate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        licenseKey,
        domain:         siteUrl,
        installationId: installId,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return false
    const data = await res.json() as { valid: boolean }
    return data.valid === true
  } catch {
    return false  // network error → use grace period
  }
}

export async function licenseMiddleware(c: Context, next: Next) {
  const now = Date.now()

  // Re-check license if interval elapsed
  if (now - lastCheck > CHECK_INTERVAL_MS) {
    lastCheck = now
    const valid = await checkLicense()

    if (valid) {
      lastValid    = true
      failingSince = 0
    } else {
      if (lastValid) {
        // First failure — start grace period
        failingSince = now
      }
      lastValid = false
    }
  }

  // If currently valid or within grace period — allow
  if (lastValid) {
    return next()
  }

  const gracePeriodMs = LICENSE_GRACE_DAYS * 24 * 60 * 60 * 1000
  if (failingSince > 0 && now - failingSince < gracePeriodMs) {
    return next()
  }

  // License invalid & grace period expired — read-only mode
  const path = c.req.path

  // Block write operations
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)
  const isAuthPath = path.startsWith('/api/auth')

  if (isWrite && !isAuthPath) {
    return c.json({
      error: 'LICENSE_REQUIRED',
      message: 'Your OverCMS license is invalid or expired. The system is in read-only mode.',
    }, 403)
  }

  return next()
}
