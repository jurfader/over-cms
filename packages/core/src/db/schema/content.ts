import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import type { FieldDefinition } from '../../types/fields'
import type { SeoData } from '../../types/seo'
import { user } from './auth'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const contentStatusEnum = pgEnum('content_status', [
  'draft',
  'published',
  'scheduled',
  'archived',
])

// ─── Content Types ────────────────────────────────────────────────────────────
// Definicje typów treści (np. "Strona", "Post", "Produkt")

export const contentTypes = pgTable('content_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),       // Nazwa ikony Lucide (SVG)
  fieldsSchema: jsonb('fields_schema')
    .notNull()
    .$type<FieldDefinition[]>()
    .default([]),
  isSingleton: boolean('is_singleton').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Content Items ────────────────────────────────────────────────────────────
// Konkretne elementy treści (instancje typów)

export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    typeId: uuid('type_id')
      .notNull()
      .references(() => contentTypes.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 255 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    data: jsonb('data').notNull().default({}),
    status: contentStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at'),
    scheduledAt: timestamp('scheduled_at'),
    seo: jsonb('seo').$type<SeoData>(),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('content_items_type_slug_idx').on(table.typeId, table.slug),
    index('content_items_status_idx').on(table.status),
    index('content_items_author_idx').on(table.authorId),
    index('content_items_published_at_idx').on(table.publishedAt),
  ]
)
