import { drizzle } from 'drizzle-orm/postgres-js'
import postgres     from 'postgres'
import * as schema  from './schema'

const connectionString = process.env['LICENSE_DATABASE_URL'] ?? process.env['DATABASE_URL']

if (!connectionString) {
  throw new Error('LICENSE_DATABASE_URL or DATABASE_URL is not set')
}

const client = postgres(connectionString, {
  max:             5,
  idle_timeout:    20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })

export * from './schema'
