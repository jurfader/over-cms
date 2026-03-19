import { Hono } from 'hono'
import { auth } from '../lib/auth'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

const authRouter = new Hono<AppEnv>()

// ─── Current User Info ────────────────────────────────────────────────────────
// WAŻNE: musi być przed catch-all Better Auth handlerem

authRouter.get('/me', requireAuth, (c) => {
  const user = c.get('user')
  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    },
  })
})

// ─── Better Auth Handler (catch-all) ─────────────────────────────────────────
// Musi być po specificznych routach

authRouter.all('/*', (c) => auth.handler(c.req.raw))

export default authRouter
