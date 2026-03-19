import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './packages/core/src/db/schema/index.ts',
  out: './packages/core/src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://overcms:password@localhost:5432/overcms',
  },
  verbose: true,
  strict: false,
})
