import type { Context, Next } from 'hono'
import { redis } from '../lib/redis'

// ─── Rate Limiter (Redis sliding window) ─────────────────────────────────────

function createRateLimiter(limit: number, windowSeconds: number) {
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'unknown'

    const key = `rl:${ip}`

    try {
      const current = await redis.incr(key)
      if (current === 1) await redis.expire(key, windowSeconds)

      c.header('X-RateLimit-Limit', String(limit))
      c.header('X-RateLimit-Remaining', String(Math.max(0, limit - current)))
      c.header('X-RateLimit-Reset', String(Date.now() + windowSeconds * 1000))

      if (current > limit) {
        return c.json({ error: 'Too many requests', code: 'RATE_LIMITED' }, 429)
      }
    } catch {
      // Jeśli Redis niedostępny — przepuszczamy ruch (fail open)
      console.warn('[RateLimit] Redis unavailable, skipping rate limit')
    }

    await next()
  }
}

export const rateLimiter = createRateLimiter(200, 60)       // 200 req/min — publiczne
export const strictRateLimiter = createRateLimiter(10, 60)  // 10 req/min — auth endpoints
