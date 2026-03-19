import { index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// ─── Redirects ────────────────────────────────────────────────────────────────
// Manager przekierowań (301/302) — część SEO managera

export const redirects = pgTable(
  'redirects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromPath: varchar('from_path', { length: 1000 }).notNull().unique(),
    toPath: varchar('to_path', { length: 1000 }).notNull(),
    statusCode: integer('status_code').notNull().default(301),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('redirects_from_path_idx').on(table.fromPath),
  ]
)
