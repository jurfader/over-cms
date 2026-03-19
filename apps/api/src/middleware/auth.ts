import type { Context, Next } from 'hono'
import { auth } from '../lib/auth'
import { ApiError } from './error'
import type { AppEnv, UserRow } from '../types'

// ─── Require Auth ─────────────────────────────────────────────────────────────

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const sessionData = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!sessionData) {
    throw ApiError.unauthorized()
  }

  c.set('user', sessionData.user as unknown as UserRow)
  c.set('session', sessionData.session as unknown as AppEnv['Variables']['session'])

  await next()
}

// ─── Require Role ─────────────────────────────────────────────────────────────

export function requireRole(...roles: Array<UserRow['role']>) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user')

    if (!user) {
      throw ApiError.unauthorized()
    }

    if (!roles.includes(user.role)) {
      throw ApiError.forbidden(`Requires one of roles: ${roles.join(', ')}`)
    }

    await next()
  }
}
