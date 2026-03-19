import { boolean, jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

// ─── Modules ──────────────────────────────────────────────────────────────────
// Zainstalowane moduły CMS (blog, ecommerce, forms, itp.)

export const modules = pgTable('modules', {
  id: varchar('id', { length: 100 }).primaryKey(), // slug modułu np. 'blog'
  name: varchar('name', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  active: boolean('active').notNull().default(false),
  config: jsonb('config').default({}),
  installedAt: timestamp('installed_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
