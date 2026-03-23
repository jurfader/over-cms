import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

interface LicenseData {
  key: string
  plan: string
  status: string
  maxInstallations: number
  activeCount: number
  activations: Array<{ domain: string; installationId: string; activatedAt: string }>
  expiresAt?: string | null
}

interface CustomerResponse {
  data?: LicenseData
  signature?: string
}


/**
 * Server-side license check endpoint
 * POST /api/check-license
 * Body: { key: string }
 * Returns: { valid: boolean, plan?: string, status?: string, ... }
 */
export async function POST(req: NextRequest) {
  const { key } = await req.json() as { key?: string }

  if (!key) {
    return NextResponse.json(
      { error: 'License key required' },
      { status: 400 }
    )
  }

  const serverUrl = process.env['LICENSE_SERVER_URL']
  if (!serverUrl) {
    console.error('[Portal] LICENSE_SERVER_URL not configured')
    return NextResponse.json(
      { error: 'License server not configured' },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(`${serverUrl}/customer/${key}`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { valid: false, error: 'License not found' },
        { status: res.status }
      )
    }

    const response = await res.json() as CustomerResponse
    const lic = response.data

    if (!lic) {
      return NextResponse.json(
        { valid: false, error: 'Invalid license response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      valid: lic.status === 'active',
      plan: lic.plan,
      status: lic.status,
      maxInstallations: lic.maxInstallations,
      activeCount: lic.activeCount,
      expiresAt: lic.expiresAt,
    })
  } catch (err) {
    console.error('[Portal] License check failed:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { valid: false, error: 'License check failed' },
      { status: 500 }
    )
  }
}
