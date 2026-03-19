import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { user } from './auth'

// ─── Media ────────────────────────────────────────────────────────────────────

export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    filename: varchar('filename', { length: 500 }).notNull(),   // Nazwa w storage
    originalName: varchar('original_name', { length: 500 }).notNull(),
    url: varchar('url', { length: 1000 }).notNull(),
    size: integer('size').notNull(),                             // Bajty
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    width: integer('width'),                                     // px (tylko obrazy)
    height: integer('height'),                                   // px (tylko obrazy)
    alt: varchar('alt', { length: 500 }),
    caption: text('caption'),
    folder: varchar('folder', { length: 255 }).default('/'),
    tags: jsonb('tags').$type<string[]>().default([]),
    uploadedBy: text('uploaded_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('media_mime_type_idx').on(table.mimeType),
    index('media_folder_idx').on(table.folder),
    index('media_uploaded_by_idx').on(table.uploadedBy),
  ]
)
