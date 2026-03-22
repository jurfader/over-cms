import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

interface CustomerResponse {
  key: string
  plan: string
  status: string
  maxInstallations: number
  activeCount: number
  activations: Array<{ domain: string; installationId: string; activatedAt: string }>
  expiresAt?: string | null
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

    const data = await res.json() as CustomerResponse

    return NextResponse.json({
      valid: data.status === 'active',
      plan: data.plan,
      status: data.status,
      maxInstallations: data.maxInstallations,
      activeCount: data.activeCount,
      expiresAt: data.expiresAt,
    })
  } catch (err) {
    console.error('[Portal] License check failed:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { valid: false, error: 'License check failed' },
      { status: 500 }
    )
  }
}
