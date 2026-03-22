import { Hono } from 'hono'
import { db } from '@overcms/core'
import { sql } from '@overcms/core'
import { redis } from '../lib/redis'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname ?? '.', '../../..', 'package.json'), 'utf-8'))
    return pkg.version ?? '0.0.0'
  } catch { return '0.0.0' }
}

const APP_VERSION = readVersion()

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
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      checks,
    },
    allOk ? 200 : 503
  )
})

export default health
