import type { Context, Next } from 'hono'
import { verifySigned, type VerifiedResponse } from '@overcms/core'
import { readFileSync, writeFileSync } from 'node:fs'
import type { LicenseData, LicenseVerification } from '@overcms/core'

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

// ─── Helper: check license with server ───────────────────────────────────────

async function checkLicenseWithServer(): Promise<LicenseVerification | null> {
  const licenseKey = process.env['OVERCMS_LICENSE_KEY']
  if (!licenseKey) return null  // No license key configured

  const serverUrl = process.env['LICENSE_SERVER_URL']
  if (!serverUrl) {
    console.warn('[License] LICENSE_SERVER_URL not set')
    return null
  }

  try {
    const res = await fetch(`${serverUrl}/customer/${licenseKey}`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      console.warn(`[License] Server returned ${res.status}`)
      return null
    }

    const body = await res.json() as VerifiedResponse<LicenseData> | LicenseData

    // If response has signature, verify it
    if ('signature' in body && 'data' in body) {
      const verified = verifySigned(body as VerifiedResponse<LicenseData>)
      if (!verified) {
        console.error('[License] Signature verification failed')
        return null
      }
      const data = verified
      const isValid = data.status === 'active'
      return {
        valid: isValid,
        lastCheck: new Date().toISOString(),
        plan: data.plan,
        status: data.status,
      }
    }

    // Fallback: treat as unsigned response (legacy)
    const data = body as LicenseData
    const isValid = data.status === 'active'
    return {
      valid: isValid,
      lastCheck: new Date().toISOString(),
      plan: data.plan,
      status: data.status,
    }
  } catch (err) {
    console.error('[License] Check failed:', err instanceof Error ? err.message : err)
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
    const freshStatus = await checkLicenseWithServer()

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
