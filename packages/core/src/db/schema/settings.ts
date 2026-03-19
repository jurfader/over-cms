import { jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

// ─── Settings ─────────────────────────────────────────────────────────────────
// Globalne ustawienia CMS jako klucz-wartość

export const settings = pgTable('settings', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
