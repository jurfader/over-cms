import { Hono } from 'hono'
import { db } from '@overcms/core'
import { sql } from '@overcms/core'
import { redis } from '../lib/redis'

const health = new Hono()

health.get('/', async (c) => {
  const checks = {
    api: 'ok',
    database: 'unknown',
    redis: 'unknown',
  }

  // Database check
  try {
    await db.execute(sql`SELECT 1`)
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  // Redis check
  try {
    await redis.ping()
    checks.redis = 'ok'
  } catch {
    checks.redis = 'error'
  }

  const allOk = Object.values(checks).every((v) => v === 'ok')

  return c.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: '0.0.1',
      timestamp: new Date().toISOString(),
      checks,
    },
    allOk ? 200 : 503
  )
})

export default health
